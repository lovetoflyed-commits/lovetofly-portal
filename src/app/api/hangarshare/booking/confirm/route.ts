import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// Importa Stripe dinamicamente apenas durante a execução
async function getStripe() {
  const Stripe = (await import('stripe')).default;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY ausente. Configure no .env.local e reinicie o servidor.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia' as any,
  });
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
  try {
    const stripe = await getStripe();
    const body = await request.json();
    const { hangarId, userId, checkIn, checkOut, totalPrice, subtotal, fees } = body;

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

    // Verify hangar exists and is available
    const hangarResult = await pool.query(
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
    const userResult = await pool.query(
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

    // Determine booking type (refundable vs non_refundable)
    const bookingType = determineBookingType({ checkIn, timeZone });
    const refundPolicyApplied = 'moderate_v1';

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

    // Create booking record with pending status
    const bookingResult = await pool.query(
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
        'pending',
        'stripe',
        paymentIntent.id,
        bookingType,
        refundPolicyApplied,
      ]
    );

    const booking = bookingResult.rows[0];

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: 'pending',
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
  } catch (error) {
    console.error('Booking confirmation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar reserva';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
