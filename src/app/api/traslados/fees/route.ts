import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import pool from '@/config/db';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DEFAULT_FEE_BRL = Number(process.env.TRASLADOS_SERVICE_FEE_BRL || '500');
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const getDiscountReason = (plan: string) => {
  if (plan === 'premium') return 'premium_plan';
  if (plan === 'pro') return 'pro_plan';
  return null;
};

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

    if (!requestId) {
      return NextResponse.json({ message: 'Missing requestId' }, { status: 400 });
    }

    const requestResult = await pool.query(
      `SELECT id, user_id, assigned_to, agreement_confirmed_at
       FROM traslados_requests WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const requestRow = requestResult.rows[0];

    if (!requestRow.agreement_confirmed_at) {
      return NextResponse.json({ message: 'Agreement not confirmed yet' }, { status: 409 });
    }

    let payerRole: 'owner' | 'pilot' | null = null;
    if (requestRow.user_id === Number(userId)) payerRole = 'owner';
    if (requestRow.assigned_to === Number(userId)) payerRole = 'pilot';

    if (!payerRole) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userResult = await pool.query('SELECT plan FROM users WHERE id = $1', [userId]);
    const userPlan = (userResult.rows[0]?.plan || 'free').toLowerCase();

    const baseAmountCents = Math.round(DEFAULT_FEE_BRL * 100);
    const discountReason = getDiscountReason(userPlan);
    const isExempt = (payerRole === 'owner' || payerRole === 'pilot') && discountReason;

    if (isExempt) {
      await pool.query(
        `INSERT INTO traslados_service_fees
         (request_id, payer_user_id, payer_role, amount_cents, base_amount_cents, discount_cents, discount_reason, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [requestId, userId, payerRole, 0, baseAmountCents, baseAmountCents, discountReason, 'brl', 'paid']
      );

      return NextResponse.json(
        {
          status: 'paid',
          amount_cents: 0,
          base_amount_cents: baseAmountCents,
          discount_cents: baseAmountCents,
          discount_reason: discountReason,
          currency: 'BRL',
          exempt: true,
        },
        { status: 200 }
      );
    }

    const existingPaid = await pool.query(
      `SELECT id FROM traslados_service_fees
       WHERE request_id = $1 AND payer_user_id = $2 AND status = 'paid'
       LIMIT 1`,
      [requestId, userId]
    );

    if (existingPaid.rows.length > 0) {
      return NextResponse.json({ message: 'Fee already paid' }, { status: 409 });
    }

    const amountCents = baseAmountCents;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'brl',
      payment_method_types: ['card'],
      description: `Taxa de serviço Traslados TR-${requestId}`,
      metadata: {
        request_id: requestId.toString(),
        payer_role: payerRole,
        payer_user_id: userId.toString(),
      },
      statement_descriptor_suffix: 'LoveToFly Traslados',
    });

    await pool.query(
      `INSERT INTO traslados_service_fees
       (request_id, payer_user_id, payer_role, amount_cents, base_amount_cents, discount_cents, discount_reason, currency, status, payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        requestId,
        userId,
        payerRole,
        amountCents,
        baseAmountCents,
        0,
        null,
        'brl',
        'pending',
        paymentIntent.id,
      ]
    );

    return NextResponse.json(
      {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount_cents: amountCents,
        base_amount_cents: baseAmountCents,
        discount_cents: 0,
        discount_reason: null,
        currency: 'BRL',
        status: paymentIntent.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating traslados fee payment intent:', error);
    return NextResponse.json({ message: error.message || 'Error creating payment intent' }, { status: 500 });
  }
}
