import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { checkoutUrl, planName, startedAt } = body || {};

    // Update pending_membership_upgrades table to mark as cancelled
    try {
      await pool.query(
        `UPDATE pending_membership_upgrades
         SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND status = 'pending' AND checkout_url = $2`,
        [user.id, checkoutUrl]
      );
    } catch (err) {
      console.error('Error updating pending_membership_upgrades:', err);
      // Continue to log to activity log even if this fails
    }

    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, activity_category, description, status, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        'membership_upgrade_cancelled',
        'membership',
        'User cancelled a pending membership upgrade',
        'success',
        JSON.stringify({
          checkoutUrl: checkoutUrl || null,
          planName: planName || null,
          startedAt: startedAt || null,
        }),
      ]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Membership Pending Cancel] Error:', error);
    return NextResponse.json({ error: 'Failed to record cancellation' }, { status: 500 });
  }
}
