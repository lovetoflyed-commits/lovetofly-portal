import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendPaymentFailureNotification,
} from '@/utils/email';

// Importa Stripe dinamicamente apenas durante a execução
async function getStripe() {
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia' as any,
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripe();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing webhook secret or signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;

      // Update booking status to confirmed/paid
      const bookingUpdateResult = await pool.query(
        `UPDATE bookings 
         SET status = $1, stripe_charge_id = $2, payment_date = NOW()
         WHERE stripe_payment_intent_id = $3
         RETURNING id, hangar_id, user_id, check_in, check_out, nights, total_price`,
        ['confirmed', paymentIntent.charges.data[0]?.id || null, paymentIntent.id]
      );

      if (bookingUpdateResult.rows.length > 0) {
        const booking = bookingUpdateResult.rows[0];
        console.log(`✅ Booking ${booking.id} confirmed for hangar ${booking.hangar_id}`);

        // Get user and hangar details for email
        const userResult = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [booking.user_id]
        );
        const hangarResult = await pool.query(
          'SELECT h.hangar_number, h.airport_icao, h.user_id, u.first_name as owner_name, u.email as owner_email FROM hangar_listings h JOIN users u ON h.user_id = u.id WHERE h.id = $1',
          [booking.hangar_id]
        );

        if (userResult.rows.length > 0 && hangarResult.rows.length > 0) {
          const user = userResult.rows[0];
          const hangar = hangarResult.rows[0];
          const confirmationNumber = `LTF-${Date.now()}`;

          // Send confirmation email to customer
          await sendBookingConfirmation({
            customerEmail: user.email,
            customerName: `${user.first_name} ${user.last_name}`,
            hangarName: `Hangar ${hangar.hangar_number}`,
            hangarLocation: hangar.airport_icao,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: booking.nights,
            totalPrice: parseFloat(booking.total_price),
            confirmationNumber,
            paymentId: paymentIntent.id,
          });

          // Send notification to hangar owner
          await sendOwnerNotification({
            ownerEmail: hangar.owner_email,
            ownerName: hangar.owner_name,
            customerName: `${user.first_name} ${user.last_name}`,
            hangarName: `Hangar ${hangar.hangar_number}`,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: booking.nights,
            totalPrice: parseFloat(booking.total_price),
            confirmationNumber,
          });

          console.log('✅ Emails sent successfully');

          // Create in-app notification for customer
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              booking.user_id,
              '🎉 Reserva Confirmada!',
              `Sua reserva no Hangar ${hangar.hangar_number} (${hangar.airport_icao}) de ${booking.check_in} a ${booking.check_out} foi confirmada com sucesso!`,
              'success',
              `/profile/bookings`
            ]
          );

          // Create in-app notification for owner
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              hangar.user_id,
              '💰 Nova Reserva Recebida!',
              `${user.first_name} ${user.last_name} reservou seu Hangar ${hangar.hangar_number} de ${booking.check_in} a ${booking.check_out}. Total: R$ ${parseFloat(booking.total_price).toFixed(2)}`,
              'success',
              `/hangarshare/owner/dashboard`
            ]
          );

          console.log('✅ In-app notifications created');
        }
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;

      // Get booking details before updating
      const bookingResult = await pool.query(
        `SELECT b.id, b.hangar_id, b.user_id, b.check_in, b.check_out, b.total_price,
                u.first_name, u.last_name, u.email,
                h.hangar_number
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN hangar_listings h ON b.hangar_id = h.id
         WHERE b.stripe_payment_intent_id = $1`,
        [paymentIntent.id]
      );

      // Update booking status to cancelled
      await pool.query(
        `UPDATE bookings 
         SET status = $1
         WHERE stripe_payment_intent_id = $2`,
        ['cancelled', paymentIntent.id]
      );

      console.log(`❌ Payment failed for intent ${paymentIntent.id}`);

      // Send failure notification to customer
      if (bookingResult.rows.length > 0) {
        const booking = bookingResult.rows[0];
        await sendPaymentFailureNotification({
          customerEmail: booking.email,
          customerName: `${booking.first_name} ${booking.last_name}`,
          hangarName: `Hangar ${booking.hangar_number}`,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalPrice: parseFloat(booking.total_price),
          failureReason: paymentIntent.last_payment_error?.message || 'Erro desconhecido',
        });

        console.log('✅ Failure notification sent');

        // Create in-app notification for customer
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            booking.user_id,
            '❌ Pagamento Falhou',
            `O pagamento da sua reserva no Hangar ${booking.hangar_number} não pôde ser processado. Motivo: ${paymentIntent.last_payment_error?.message || 'Erro desconhecido'}`,
            'error',
            `/hangarshare/listing/${booking.hangar_id}`
          ]
        );

        console.log('✅ In-app failure notification created');
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
