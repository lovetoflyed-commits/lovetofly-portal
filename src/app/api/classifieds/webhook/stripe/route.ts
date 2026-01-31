import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured');
  }
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover' as any,
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

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await pool.query(
        `UPDATE classifieds_transactions
         SET status = 'paid', escrow_status = 'holding', updated_at = NOW(), stripe_charge_id = $1
         WHERE stripe_payment_intent_id = $2`,
        [paymentIntent.latest_charge || null, paymentIntent.id]
      );
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await pool.query(
        `UPDATE classifieds_transactions
         SET status = 'cancelled', updated_at = NOW()
         WHERE stripe_payment_intent_id = $1`,
        [paymentIntent.id]
      );
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      await pool.query(
        `UPDATE classifieds_transactions
         SET status = 'refunded', escrow_status = 'refunded', updated_at = NOW()
         WHERE stripe_charge_id = $1`,
        [charge.id]
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Classifieds webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
