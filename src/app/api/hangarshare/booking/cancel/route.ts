import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/config/db';
import { sendCancellationEmail } from '@/utils/email';



interface RefundPolicy {
  name: string;
  daysBeforeCheckin: number;
  refundPercentage: number;
}

// Standard refund policies
const REFUND_POLICIES: RefundPolicy[] = [
  { name: 'Flexible', daysBeforeCheckin: 1, refundPercentage: 100 },
  { name: 'Moderate', daysBeforeCheckin: 7, refundPercentage: 100 },
  { name: 'Strict', daysBeforeCheckin: 30, refundPercentage: 100 },
];

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe only at request time
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured.' },
        { status: 500 }
      );
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia' as any,
    });
    const body = await request.json();
    const { bookingId, reason, refundType = 'full' } = body;

    if (!bookingId || !reason) {
      return NextResponse.json(
        { error: 'bookingId and reason are required' },
        { status: 400 }
      );
    }

    // Fetch booking details
    const result = await pool.query(
      `SELECT 
        b.*,
        u.email as user_email,
        u.full_name as user_name,
        hl.owner_id,
        hl.cancellation_policy
      FROM hangar_bookings b
      JOIN users u ON b.user_id = u.id
      JOIN hangar_listings hl ON b.hangar_id = hl.id
      WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = result.rows[0];

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed booking' },
        { status: 400 }
      );
    }

    // Calculate refund amount based on policy, booking type and non-refundable service fee
    const refundAmount = calculateRefund(booking, refundType);

    let refundId = null;

    // Process Stripe refund if payment was made and there is amount to refund
    if (booking.stripe_payment_intent_id && booking.total_price > 0 && refundAmount > 0) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: 'requested_by_customer',
        });

        refundId = refund.id;

        // Update booking status
        await pool.query(
          `UPDATE hangar_bookings 
          SET status = $1, updated_at = NOW(), refund_amount = $2, refund_id = $3, cancellation_reason = $4
          WHERE id = $5`,
          ['cancelled', refundAmount, refundId, reason, bookingId]
        );
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        
        // Still update booking status locally even if Stripe fails
        await pool.query(
          `UPDATE hangar_bookings 
          SET status = $1, updated_at = NOW(), refund_amount = $2, cancellation_reason = $3
          WHERE id = $4`,
          ['cancelled', refundAmount, reason, bookingId]
        );
      }
    } else {
      // No payment to refund (payment not completed or pending)
      await pool.query(
        `UPDATE hangar_bookings 
        SET status = $1, updated_at = NOW(), refund_amount = $2, cancellation_reason = $3
        WHERE id = $4`,
        ['cancelled', refundAmount, reason, bookingId]
      );
    }

    // Send cancellation email to customer
    try {
      await sendCancellationEmail({
        customerName: booking.user_name,
        customerEmail: booking.user_email,
        bookingId: booking.id,
        checkInDate: booking.check_in,
        checkOutDate: booking.check_out,
        totalAmount: booking.total_price,
        refundAmount: refundAmount,
        cancellationReason: reason,
        bookingType: booking.booking_type || 'refundable',
        serviceFee: booking.fees || 0,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the refund if email fails
    }


    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        status: 'cancelled',
        originalAmount: booking.total_price,
        refundAmount: refundAmount,
        refundId: refundId,
      },
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRefund(booking: any, refundType: string): number {
  // Non-refundable bookings: zero refund
  if (booking.booking_type === 'non_refundable') {
    return 0;
  }

  const checkInDate = new Date(booking.check_in);
  const today = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Base eligible for refund excludes service fee
  const serviceFee = Number(booking.fees || 0);
  const refundableBase = Math.max(Number(booking.total_price) - serviceFee, 0);

  let refundPercentage = 0;

  if (refundType === 'full') {
    // Moderate policy: >=7d 100%, >1d 50%, <=1d 0%
    if (daysUntilCheckIn >= 7) {
      refundPercentage = 100;
    } else if (daysUntilCheckIn > 1) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }
  } else if (refundType === 'partial') {
    refundPercentage = 50;
  }

  return (refundableBase * refundPercentage) / 100;
}
