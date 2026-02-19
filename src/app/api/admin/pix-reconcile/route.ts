import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

function isAdminRole(role?: string): boolean {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'staff' || normalized === 'master';
}

interface PIXPaymentRecord {
  id: number;
  user_id: number;
  order_type: string;
  order_id: string;
  amount_cents: number;
  status: string;
  transaction_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

async function markPaymentAsCompleted(payment: PIXPaymentRecord, transactionId?: string | null) {
  await pool.query(
    `UPDATE pix_payments
     SET status = 'completed',
         transaction_id = COALESCE($1, transaction_id),
         payment_date = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [transactionId || null, payment.id]
  );

  // Handle HangarShare bookings
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

  // Handle memberships
  if (payment.order_type === 'membership') {
    const orderId = String(payment.order_id || '');
    const planMatch = orderId.match(/^membership-([a-z]+)/i);
    const planCode = planMatch ? planMatch[1].toLowerCase() : null;

    if (planCode && payment.user_id) {
      try {
        const { getMembershipPlanByCode, updateUserMembership } = await import('@/utils/membershipUtils');
        const plan = await getMembershipPlanByCode(planCode as any);
        if (plan) {
          // Check if already activated
          const existing = await pool.query(
            `SELECT 1 FROM user_memberships
             WHERE user_id = $1 AND membership_plan_id = $2 AND status = 'active'
             LIMIT 1`,
            [payment.user_id, plan.id]
          );

          if (existing.rows.length === 0) {
            await updateUserMembership(payment.user_id, plan.id, 'monthly');
          }

          // Mark pending upgrade as completed
          await pool.query(
            `UPDATE pending_membership_upgrades
             SET status = 'completed', payment_method = 'pix', completed_at = NOW(), updated_at = NOW()
             WHERE user_id = $1 AND status = 'pending'`,
            [payment.user_id]
          );
        }
      } catch (error) {
        console.error('[PIX Admin Reconcile] Membership activation error:', error);
        // Don't fail the whole reconciliation if membership activation fails
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    // 1. Mark expired pending PIX payments
    const expiredResult = await pool.query(
      `SELECT id FROM pix_payments
       WHERE status = 'pending' AND expires_at < NOW()`
    );

    for (const expired of expiredResult.rows) {
      try {
        await pool.query(
          `UPDATE pix_payments SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [expired.id]
        );
        processed += 1;
      } catch (error) {
        console.error('[PIX Admin Reconcile] Failed to mark as expired:', error);
        failed += 1;
      }
    }

    // 2. Confirm pending bookings (if they've been paid via other means, adjust logic as needed)
    // This is a safeguard; normally the webhook should handle this
    if (body.confirmPendingBookings === true) {
      const pendingBookings = await pool.query(
        `SELECT hb.id, hb.pix_payment_id FROM hangar_bookings hb
         WHERE hb.status = 'pending' AND hb.payment_method = 'pix' AND hb.pix_payment_id IS NOT NULL`
      );

      for (const booking of pendingBookings.rows) {
        try {
          const paymentCheck = await pool.query(
            `SELECT status FROM pix_payments WHERE id = $1`,
            [booking.pix_payment_id]
          );

          if (paymentCheck.rows[0]?.status === 'completed') {
            await pool.query(
              `UPDATE hangar_bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
              [booking.id]
            );
            processed += 1;
          } else {
            skipped += 1;
          }
        } catch (error) {
          console.error('[PIX Admin Reconcile] Failed to confirm booking:', error);
          failed += 1;
        }
      }
    }

    // 3. Provide reconciliation summary
    const pendingCount = await pool.query(`SELECT COUNT(*) as count FROM pix_payments WHERE status = 'pending'`);
    const completedCount = await pool.query(`SELECT COUNT(*) as count FROM pix_payments WHERE status = 'completed'`);
    const expiredCount = await pool.query(`SELECT COUNT(*) as count FROM pix_payments WHERE status = 'expired'`);
    const failedCount = await pool.query(`SELECT COUNT(*) as count FROM pix_payments WHERE status = 'failed'`);

    return NextResponse.json(
      {
        success: true,
        processed,
        skipped,
        failed,
        summary: {
          pending: pendingCount.rows[0].count,
          completed: completedCount.rows[0].count,
          expired: expiredCount.rows[0].count,
          failed: failedCount.rows[0].count,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PIX Admin Reconcile] Error:', error);
    return NextResponse.json({ error: 'Failed to reconcile PIX payments' }, { status: 500 });
  }
}
