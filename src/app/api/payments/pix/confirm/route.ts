import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

function isAdminRole(role?: string): boolean {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'staff' || normalized === 'master';
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, transactionId } = body;

    if (!paymentId || !transactionId) {
      return NextResponse.json(
        { error: 'paymentId and transactionId are required' },
        { status: 400 }
      );
    }

    const paymentResult = await pool.query(
      `SELECT id, user_id, status, order_id, order_type
       FROM pix_payments
       WHERE id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];
    if (!isAdminRole(user.role) && payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (payment.status !== 'completed') {
      await pool.query(
        `UPDATE pix_payments
         SET status = 'completed',
             transaction_id = COALESCE($1, transaction_id),
             payment_date = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [transactionId, paymentId]
      );
    }

    if (payment.order_type === 'hangar_booking' && payment.order_id) {
      const bookingMatch = String(payment.order_id).match(/^booking-(\d+)$/) || String(payment.order_id).match(/^(\d+)$/);
      const bookingId = bookingMatch ? parseInt(bookingMatch[1], 10) : null;

      if (bookingId) {
        await pool.query(
          `UPDATE hangar_bookings
           SET status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
               payment_method = 'pix',
               pix_payment_id = COALESCE(pix_payment_id, $2),
               updated_at = NOW()
           WHERE id = $1`,
          [bookingId, paymentId]
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          paymentId,
          transactionId,
          status: 'completed',
          orderType: payment.order_type,
          orderId: payment.order_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PIX Confirm] Error:', error);
    return NextResponse.json({ error: 'Failed to confirm PIX payment' }, { status: 500 });
  }
}
