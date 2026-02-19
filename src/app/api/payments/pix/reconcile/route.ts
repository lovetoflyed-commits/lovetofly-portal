import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

function isAdminRole(role?: string): boolean {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'staff' || normalized === 'master';
}

function normalizeStatus(value: string | null | undefined): 'completed' | 'pending' | 'cancelled' | 'expired' {
  const normalized = String(value || '').toLowerCase();
  if (['completed', 'paid', 'confirmed', 'success', 'settled', 'concluido', 'received', 'recebido'].includes(normalized)) {
    return 'completed';
  }
  if (['cancelled', 'canceled', 'failed', 'rejected', 'refunded', 'chargeback'].includes(normalized)) {
    return 'cancelled';
  }
  if (['expired', 'expirado', 'overdue'].includes(normalized)) {
    return 'expired';
  }
  return 'pending';
}

function getAsaasConfig(): { apiKey: string; baseUrl: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = isProduction
    ? process.env.ASAAS_PRODUCTION_API_KEY
    : process.env.ASAAS_SANDBOX_API_KEY;
  const baseUrl = isProduction
    ? process.env.ASAAS_PRODUCTION_API_BASE_URL
    : process.env.ASAAS_SANDBOX_API_BASE_URL;

  if (!apiKey) {
    throw new Error('Missing Asaas API key');
  }

  return {
    apiKey,
    baseUrl: baseUrl || (isProduction ? 'https://api.asaas.com' : 'https://api-sandbox.asaas.com'),
  };
}

async function asaasGet<T>(path: string): Promise<T> {
  const { apiKey, baseUrl } = getAsaasConfig();
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      access_token: apiKey,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.errors?.[0]?.description || data?.message || response.statusText;
    throw new Error(`Asaas API error (${response.status}): ${message}`);
  }

  return data as T;
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    const allowCron = Boolean(process.env.PIX_RECONCILE_SECRET) && cronSecret === process.env.PIX_RECONCILE_SECRET;

    if (!allowCron) {
      const user = await verifyTokenAndGetUser(request);
      if (!user || !isAdminRole(user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = await request.json().catch(() => ({}));
    const transactions = Array.isArray(payload?.transactions) ? payload.transactions : [];

    let updated = 0;

    const pendingPayments = await pool.query(
      `SELECT id, order_id, order_type, transaction_id
       FROM pix_payments
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 200`
    );

    for (const tx of transactions) {
      const transactionId = String(tx.transactionId || tx.transaction_id || '').trim();
      const txid = String(tx.txid || tx.orderId || tx.reference || '').trim();
      const status = normalizeStatus(String(tx.status || '').toLowerCase());
      if (!transactionId && !txid) continue;
      if (status !== 'completed') continue;

      const paymentResult = transactionId
        ? await pool.query(`SELECT * FROM pix_payments WHERE transaction_id = $1 LIMIT 1`, [transactionId])
        : await pool.query(`SELECT * FROM pix_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`, [txid]);

      if (paymentResult.rows.length === 0) continue;

      const payment = paymentResult.rows[0];
      await pool.query(
        `UPDATE pix_payments
         SET status = 'completed',
             transaction_id = COALESCE($1, transaction_id),
             payment_date = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [transactionId || null, payment.id]
      );

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
            [bookingId, payment.id]
          );
        }
      }

      updated += 1;
    }

    if (transactions.length === 0 && pendingPayments.rows.length > 0) {
      for (const payment of pendingPayments.rows) {
        if (!payment.transaction_id) continue;

        const paymentData = await asaasGet<any>(`/v3/payments/${payment.transaction_id}`);
        const status = normalizeStatus(paymentData?.status);

        if (status !== 'completed') continue;

        await pool.query(
          `UPDATE pix_payments
           SET status = 'completed',
               payment_date = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [payment.id]
        );

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
              [bookingId, payment.id]
            );
          }
        }

        updated += 1;
      }
    }

    await pool.query(
      `UPDATE pix_payments
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'pending' AND expires_at < NOW()`
    );

    return NextResponse.json(
      {
        success: true,
        updated,
        message: transactions.length > 0
          ? 'Reconciliation processed'
          : 'Reconciliation processed from Asaas API',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PIX Reconcile] Error:', error);
    return NextResponse.json({ error: 'Failed to reconcile PIX payments' }, { status: 500 });
  }
}
