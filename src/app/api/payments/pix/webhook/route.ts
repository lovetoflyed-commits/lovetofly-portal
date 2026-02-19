import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/config/db';
import type { QueryResult } from 'pg';
import { logPIXWebhook } from '@/utils/pixUtils';
import { getMembershipPlanByCode, updateUserMembership, type MembershipPlan } from '@/utils/membershipUtils';

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

function extractValue(payload: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).length > 0) {
      return String(value);
    }
  }
  return null;
}

function verifySignature(signature: string | null, secret: string | undefined): boolean {
  if (!secret) return true;
  if (!signature) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(secret));
}

async function activateMembershipFromPayment(payment: any): Promise<void> {
  const orderId = String(payment.order_id || '');
  const planMatch = orderId.match(/^membership-([a-z]+)/i);
  const planCode = planMatch ? planMatch[1].toLowerCase() : null;

  if (!planCode) return;

  const pendingUpgrade = await pool.query(
    `SELECT target_plan_code, billing_cycle
     FROM pending_membership_upgrades
     WHERE user_id = $1 AND status = 'pending'
     ORDER BY started_at DESC
     LIMIT 1`,
    [payment.user_id]
  );

  const targetPlanCode = pendingUpgrade.rows[0]?.target_plan_code || planCode;
  const billingCycle = pendingUpgrade.rows[0]?.billing_cycle || 'monthly';

  const plan = await getMembershipPlanByCode(targetPlanCode as MembershipPlan);
  if (!plan) return;

  await updateUserMembership(payment.user_id, plan.id, billingCycle);

  await pool.query(
    `UPDATE pending_membership_upgrades
     SET status = 'completed', payment_method = 'pix', completed_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND status = 'pending'`,
    [payment.user_id]
  );
}

async function finalizePayment(paymentId: number, transactionId: string | null, status: 'completed' | 'pending' | 'cancelled' | 'expired') {
  await pool.query(
    `UPDATE pix_payments
     SET status = $1,
         transaction_id = COALESCE($2, transaction_id),
         payment_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE payment_date END,
         updated_at = NOW()
     WHERE id = $3`,
    [status, transactionId, paymentId]
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('asaas-access-token');

  if (!verifySignature(signature, process.env.PIX_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const paymentPayload = payload?.payment && typeof payload.payment === 'object' ? payload.payment : payload;
  const transactionId = extractValue(paymentPayload, ['id', 'paymentId', 'payment_id', 'transactionId', 'transaction_id', 'endToEndId', 'e2eId']);
  const txid = extractValue(paymentPayload, ['externalReference', 'reference', 'referenceLabel', 'identifier', 'orderId', 'txid']);
  const status = normalizeStatus(
    extractValue(paymentPayload, ['status', 'state', 'event', 'eventType']) ||
    extractValue(payload, ['event', 'type']) ||
    'pending'
  );

  try {
    await logPIXWebhook('pix.webhook', txid || '', transactionId || '', payload, 'success');
  } catch (error) {
    console.error('[PIX Webhook] Log error:', error);
  }

  if (status !== 'completed') {
    return NextResponse.json({ success: true, status }, { status: 200 });
  }

  let paymentResult: QueryResult<any> | null = null;

  if (transactionId) {
    paymentResult = await pool.query(
      `SELECT * FROM pix_payments WHERE transaction_id = $1 LIMIT 1`,
      [transactionId]
    );
  }

  if (!paymentResult || (paymentResult.rowCount ?? 0) === 0) {
    const matchValue = txid || transactionId;
    if (matchValue) {
      paymentResult = await pool.query(
        `SELECT * FROM pix_payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [matchValue]
      );
    }
  }

  if (!paymentResult || (paymentResult.rowCount ?? 0) === 0) {
    return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
  }

  const payment = paymentResult.rows[0];

  await finalizePayment(payment.id, transactionId, status);

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

  if (payment.order_type === 'membership') {
    await activateMembershipFromPayment(payment);
  }

  return NextResponse.json({ success: true, status: 'completed' }, { status: 200 });
}
