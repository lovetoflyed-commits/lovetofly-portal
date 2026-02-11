import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

async function getStripe() {
  const Stripe = (await import('stripe')).default;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY ausente. Configure no .env.local e reinicie o servidor.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

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

    const body = await request.json();
    const paymentIntentId = String(body.paymentIntentId || '');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    const txRes = await pool.query(
      `SELECT id, buyer_user_id, status FROM classifieds_transactions WHERE stripe_payment_intent_id = $1`,
      [paymentIntentId]
    );

    if (txRes.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = txRes.rows[0];
    if (Number(transaction.buyer_user_id) !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await pool.query(
        `UPDATE classifieds_transactions
         SET status = 'paid', updated_at = NOW(), stripe_charge_id = $1
         WHERE stripe_payment_intent_id = $2`,
        [paymentIntent.latest_charge || null, paymentIntentId]
      );

      return NextResponse.json({
        success: true,
        status: 'paid',
      });
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Error confirming classifieds payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', details: error?.message },
      { status: 500 }
    );
  }
}
