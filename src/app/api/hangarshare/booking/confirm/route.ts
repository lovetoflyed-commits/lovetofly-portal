import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import MonitoringService from '@/services/monitoring';

// Importa Stripe dinamicamente apenas durante a execução
async function getStripe() {
  const Stripe = (await import('stripe')).default;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY ausente. Configure no .env.local e reinicie o servidor.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Helpers to get local time in a specific timezone without external deps
function getZonedDate(timeZone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
}

function toZonedDate(dateInput: string | Date, timeZone: string): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
}

function determineBookingType(params: { checkIn: string; timeZone: string }): 'refundable' | 'non_refundable' {
  const { checkIn, timeZone } = params;
  const nowZoned = getZonedDate(timeZone);
  const checkInZoned = toZonedDate(checkIn, timeZone);

  const sameDay =
    nowZoned.getFullYear() === checkInZoned.getFullYear() &&
    nowZoned.getMonth() === checkInZoned.getMonth() &&
    nowZoned.getDate() === checkInZoned.getDate();

  const isDayBefore = (() => {
    const nextDay = new Date(nowZoned);
    nextDay.setDate(nextDay.getDate() + 1);
    return (
      nextDay.getFullYear() === checkInZoned.getFullYear() &&
      nextDay.getMonth() === checkInZoned.getMonth() &&
      nextDay.getDate() === checkInZoned.getDate()
    );
  })();

  const isAfter18 = nowZoned.getHours() >= 18;

  if (sameDay) return 'non_refundable';
  if (isDayBefore && isAfter18) return 'non_refundable';
  return 'refundable';
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const client = await pool.connect();
  let parsedBody: any = null;
  try {
    const stripe = await getStripe();
    parsedBody = await request.json();
    const { hangarId, userId, checkIn, checkOut, totalPrice, subtotal, fees } = parsedBody;

    const timeZone = process.env.BOOKING_TIMEZONE || 'America/Sao_Paulo';

    // Validation
    if (!hangarId || !userId || !checkIn || !checkOut || !totalPrice) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verify user is authenticated (should be passed in request headers)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !userId) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [hangarId]);

    // Release expired pending holds so dates become available again
    await client.query(
      `UPDATE hangar_bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '30 minutes'`
    );

    // Verify hangar exists and is available
    const hangarResult = await client.query(
      'SELECT id, hangar_number, icao_code, monthly_rate FROM hangar_listings WHERE id = $1 AND is_available = true',
      [hangarId]
    );

    if (hangarResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hangar não encontrado ou indisponível' },
        { status: 404 }
      );
    }

    // Verify user exists
    const userResult = await client.query(
      'SELECT id, email, first_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const hangar = hangarResult.rows[0];
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Calculate nights for validation
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return NextResponse.json(
        { error: 'Datas inválidas' },
        { status: 400 }
      );
    }

    // Prevent overlapping bookings (confirmed or active pending)
    const overlapResult = await client.query(
      `SELECT id
       FROM hangar_bookings
       WHERE hangar_id = $1
         AND status IN ('confirmed', 'pending')
         AND (status <> 'pending' OR created_at >= NOW() - INTERVAL '30 minutes')
         AND check_in < $3
         AND check_out > $2
       LIMIT 1`,
      [hangarId, checkIn, checkOut]
    );

    if (overlapResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Hangar indisponível para as datas selecionadas' },
        { status: 409 }
      );
    }

    // Determine booking type (refundable vs non_refundable)
    const bookingType = determineBookingType({ checkIn, timeZone });
    const refundPolicyApplied = 'moderate_v1';

    // Idempotency guard: reuse recent booking/payment intent for same user + hangar + dates
    const existingResult = await client.query(
      `SELECT id, status, stripe_payment_intent_id, booking_type
       FROM hangar_bookings
       WHERE hangar_id = $1
         AND user_id = $2
         AND check_in = $3
         AND check_out = $4
         AND status IN ('pending', 'confirmed')
         AND created_at >= NOW() - INTERVAL '15 minutes'
       ORDER BY created_at DESC
       LIMIT 1`,
      [hangarId, userId, checkIn, checkOut]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      await client.query('COMMIT');

      if (!existing.stripe_payment_intent_id) {
        return NextResponse.json(
          { error: 'Reserva existente sem pagamento associado' },
          { status: 409 }
        );
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);

      return NextResponse.json({
        success: true,
        booking: {
          id: existing.id,
          status: existing.status,
          hangarNumber: hangar.hangar_number,
          checkIn,
          checkOut,
          nights,
          totalPrice,
          bookingType: existing.booking_type || bookingType,
        },
        payment: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        },
      });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'brl',
      payment_method_types: ['card'],
      metadata: {
        hangarId: String(hangarId),
        userId: String(userId),
        hangarNumber: hangar.hangar_number,
        checkIn,
        checkOut,
        nights: String(nights),
        bookingType,
      },
      receipt_email: user.email,
      description: `Reserva de hangar ${hangar.hangar_number} (${hangar.icao_code}) - ${nights} noite(s)`,
    });

    // Create booking record with confirmed status
    const bookingResult = await client.query(
      `INSERT INTO hangar_bookings 
        (hangar_id, user_id, check_in, check_out, nights, subtotal, fees, total_price, status, payment_method, stripe_payment_intent_id, booking_type, refund_policy_applied)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, stripe_payment_intent_id, booking_type`,
      [
        hangarId,
        userId,
        checkIn,
        checkOut,
        nights,
        subtotal,
        fees,
        totalPrice,
        'confirmed',
        'stripe',
        paymentIntent.id,
        bookingType,
        refundPolicyApplied,
      ]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: 'confirmed',
        hangarNumber: hangar.hangar_number,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        bookingType,
      },
      payment: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },
    });

    const duration = performance.now() - startTime;
    MonitoringService.trackPaymentEvent('initiated', totalPrice, 'BRL', {
      paymentIntentId: paymentIntent.id,
      hangarId,
      userId,
    });
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/booking/confirm',
      duration,
      200
    );
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    const duration = performance.now() - startTime;
    MonitoringService.trackApiPerformance(
      '/api/hangarshare/booking/confirm',
      duration,
      500,
      false
    );
    const failedTotal = Number(parsedBody?.totalPrice || 0);
    MonitoringService.trackPaymentEvent('failed', failedTotal, 'BRL');
    MonitoringService.captureException(error as Error, { endpoint: '/api/hangarshare/booking/confirm' });
    console.error('Booking confirmation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar reserva';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
