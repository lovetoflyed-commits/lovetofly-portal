import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import pool from '@/config/db';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ message: 'Payment system not configured' }, { status: 503 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let payload: any;
    try {
      payload = jwt.verify(token, SECRET);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId ?? payload.id;
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const requestId = Number(body.requestId);
    const paymentIntentId = body.paymentIntentId;

    if (!requestId || !paymentIntentId) {
      return NextResponse.json({ message: 'Missing requestId or paymentIntentId' }, { status: 400 });
    }

    const feeResult = await pool.query(
      `SELECT id, status FROM traslados_service_fees
       WHERE request_id = $1 AND payer_user_id = $2 AND payment_intent_id = $3
       LIMIT 1`,
      [requestId, userId, paymentIntentId]
    );

    if (feeResult.rows.length === 0) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const nextStatus = paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status;

    await pool.query(
      `UPDATE traslados_service_fees
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [nextStatus, feeResult.rows[0].id]
    );

    return NextResponse.json({ status: nextStatus }, { status: 200 });
  } catch (error: any) {
    console.error('Error confirming traslados fee payment:', error);
    return NextResponse.json({ message: error.message || 'Error confirming payment' }, { status: 500 });
  }
}
