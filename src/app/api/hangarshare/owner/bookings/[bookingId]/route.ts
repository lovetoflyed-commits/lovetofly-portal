import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
}

// Initialize Stripe (lazy loaded)
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }
  return stripe;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

/**
 * PATCH - Update booking status
 * Only owner of the listing can update status
 * Validates status transitions
 * Sends email notifications
 * Handles refunds for cancellations
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { bookingId } = params;
    const body = await request.json();
    const { booking_status } = body;

    // Validate new status
    if (!booking_status || !STATUS_LABELS[booking_status]) {
      return NextResponse.json(
        { error: 'Status de reserva inválido' },
        { status: 400 }
      );
    }

    // Get booking with listing and owner info + payment intent info
    const bookingResult = await pool.query(
      `SELECT 
        b.id,
        b.listing_id,
        b.user_id,
        b.booking_status as current_status,
        b.total,
        b.payment_status,
        b.payment_intent_id,
        b.payment_method,
        b.checkin,
        b.checkout,
        h.owner_id,
        h.icao_code,
        h.hangar_number,
        ho.user_id as owner_user_id,
        u.email as client_email,
        u.first_name || ' ' || u.last_name as client_name
      FROM bookings b
      JOIN hangar_listings h ON b.listing_id = h.id
      JOIN hangar_owners ho ON h.owner_id = ho.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      );
    }

    const booking = bookingResult.rows[0];

    // Authorization check: must be owner of the listing or admin
    const isOwner = booking.owner_user_id === decoded.userId;
    const isAdmin = decoded.role === 'MASTER' || decoded.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar esta reserva' },
        { status: 403 }
      );
    }

    // Validate status transition
    const currentStatus = booking.current_status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(booking_status)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${STATUS_LABELS[currentStatus]} → ${STATUS_LABELS[booking_status]}`,
          currentStatus,
          requestedStatus: booking_status,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    // Update booking status
    const updateResult = await pool.query(
      `UPDATE bookings 
       SET booking_status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING 
         id, 
         listing_id, 
         user_id, 
         booking_status, 
         payment_status,
         total,
         checkin,
         checkout,
         updated_at`,
      [booking_status, bookingId]
    );

    const updatedBooking = updateResult.rows[0];

    // Handle cancellation refund (if payment was completed)
    let refundInfo = null;
    if (booking_status === 'cancelled' && booking.payment_status === 'paid') {
      try {
        // Check if payment_intent_id exists
        if (!booking.payment_intent_id) {
          console.warn(`[REFUND WARNING] Booking ${bookingId} has no payment_intent_id`);
        } else {
          // Process Stripe refund
          const stripeClient = getStripe();
          const refund = await stripeClient.refunds.create({
            payment_intent: booking.payment_intent_id,
            amount: Math.round(booking.total * 100), // Convert to cents
            reason: 'requested_by_customer',
          });

          refundInfo = {
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status || 'pending',
            created: refund.created,
          };

          // Update booking with refund info
          await pool.query(
            `UPDATE bookings 
             SET refund_id = $1, refund_amount = $2, refund_status = $3
             WHERE id = $4`,
            [refund.id, refund.amount / 100, refund.status, bookingId]
          );

          console.log(`[REFUND SUCCESS] Booking ${bookingId} refunded: R$ ${refund.amount / 100}, Refund ID: ${refund.id}`);
        }
      } catch (refundError: any) {
        console.error(`[REFUND ERROR] Booking ${bookingId}:`, refundError.message);
        // Log error but don't fail the status update
        // Store error in database for admin review
        await pool.query(
          `UPDATE bookings 
           SET refund_error = $1
           WHERE id = $2`,
          [refundError.message, bookingId]
        );
      }
    }

    // Send email notification to client
    try {
      // Import email utility dynamically
      const { sendBookingStatusEmail } = await import('@/utils/email');
      
      await sendBookingStatusEmail({
        to: booking.client_email,
        clientName: booking.client_name,
        bookingId: booking.id,
        hangar: `${booking.icao_code} - Hangar ${booking.hangar_number}`,
        checkin: booking.checkin,
        checkout: booking.checkout,
        newStatus: booking_status,
        statusLabel: STATUS_LABELS[booking_status],
        refundInfo,
      });

      console.log(`[EMAIL SENT] Status update to ${booking.client_email}: ${STATUS_LABELS[booking_status]}`);
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Reserva atualizada para: ${STATUS_LABELS[booking_status]}`,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.booking_status,
        paymentStatus: updatedBooking.payment_status,
        total: updatedBooking.total,
        checkin: updatedBooking.checkin,
        checkout: updatedBooking.checkout,
        updatedAt: updatedBooking.updated_at,
      },
      refundNeeded: booking_status === 'cancelled' && booking.payment_status === 'paid',
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status da reserva' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get single booking details
 * For owner to view booking before updating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { bookingId } = params;

    const result = await pool.query(
      `SELECT 
        b.id,
        b.listing_id,
        b.user_id,
        b.checkin,
        b.checkout,
        b.subtotal,
        b.fees,
        b.total,
        b.payment_method,
        b.payment_status,
        b.booking_status,
        b.special_requests,
        b.created_at,
        b.updated_at,
        h.icao_code as "icaoCode",
        h.hangar_number as "hangarNumber",
        h.daily_rate as "dailyRate",
        h.owner_id,
        ho.user_id as owner_user_id,
        u.first_name || ' ' || u.last_name as "clientName",
        u.email as "clientEmail"
      FROM bookings b
      JOIN hangar_listings h ON b.listing_id = h.id
      JOIN hangar_owners ho ON h.owner_id = ho.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      );
    }

    const booking = result.rows[0];

    // Authorization check
    const isOwner = booking.owner_user_id === decoded.userId;
    const isClient = booking.user_id === decoded.userId;
    const isAdmin = decoded.role === 'MASTER' || decoded.role === 'ADMIN';

    if (!isOwner && !isClient && !isAdmin) {
      return NextResponse.json(
        { error: 'Você não tem permissão para ver esta reserva' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reserva' },
      { status: 500 }
    );
  }
}
