import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/config/db';
import { sendCancellationEmail } from '@/utils/email';
import { verifyToken } from '@/utils/auth';



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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Initialize Stripe only at request time
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured.' },
        { status: 500 }
      );
    }
    const stripe = new Stripe(stripeSecretKey);
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
        u.first_name as user_first_name,
        u.last_name as user_last_name,
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
    const userName = [booking.user_first_name, booking.user_last_name].filter(Boolean).join(' ').trim() || 'Cliente';

    const isAdmin = ['admin', 'master', 'staff'].includes(String(user.role || '').toLowerCase());
    if (!isAdmin && Number(booking.user_id) !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const refundAmount = calculateRefund(booking, refundType, isAdmin);

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
          SET status = $1, updated_at = NOW()
          WHERE id = $2`,
          ['cancelled', bookingId]
        );
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        
        // Still update booking status locally even if Stripe fails
        await pool.query(
          `UPDATE hangar_bookings 
          SET status = $1, updated_at = NOW()
          WHERE id = $2`,
          ['cancelled', bookingId]
        );
      }
    } else {
      // No payment to refund (payment not completed or pending)
      await pool.query(
        `UPDATE hangar_bookings 
        SET status = $1, updated_at = NOW()
        WHERE id = $2`,
        ['cancelled', bookingId]
      );
    }

    // Send cancellation email to customer
    try {
      await sendCancellationEmail({
        customerName: userName,
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

function calculateRefund(booking: any, refundType: string, isAdmin: boolean): number {
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
  const policy = String(booking.cancellation_policy || 'moderate').toLowerCase();

  if (refundType === 'partial' && isAdmin) {
    refundPercentage = 50;
  } else {
    if (policy === 'flexible') {
      refundPercentage = daysUntilCheckIn >= 1 ? 100 : 0;
    } else if (policy === 'strict') {
      refundPercentage = daysUntilCheckIn >= 30 ? 100 : 0;
    } else {
      // Moderate policy: >=7d 100%, >1d 50%, <=1d 0%
      if (daysUntilCheckIn >= 7) {
        refundPercentage = 100;
      } else if (daysUntilCheckIn > 1) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }
    }
  }

  return (refundableBase * refundPercentage) / 100;
}
