import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get payment by order_id
    const result = await pool.query(
      `SELECT id, order_id, status, amount_cents, expires_at, payment_date
       FROM pix_payments
       WHERE order_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = result.rows[0];
    const amountBRL = (payment.amount_cents / 100).toFixed(2);

    return NextResponse.json(
      {
        id: payment.id,
        order_id: payment.order_id,
        status: payment.status,
        amount: {
          cents: payment.amount_cents,
          formatted: `R$ ${(payment.amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        expires_at: payment.expires_at,
        payment_date: payment.payment_date,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PIX Status] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve payment status' }, { status: 500 });
  }
}
