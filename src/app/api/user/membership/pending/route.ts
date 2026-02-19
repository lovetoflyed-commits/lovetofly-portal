import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyTokenAndGetUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get most recent pending upgrade for user
    const result = await pool.query(
      `SELECT 
        id,
        target_plan_code,
        billing_cycle,
        checkout_url,
        promo_code,
        started_at,
        status
       FROM pending_membership_upgrades
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY started_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const pending = result.rows[0];
    return NextResponse.json(
      {
        data: {
          checkoutUrl: pending.checkout_url,
          planCode: pending.target_plan_code,
          billingCycle: pending.billing_cycle,
          promoCode: pending.promo_code,
          startedAt: pending.started_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Membership Pending] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending upgrade' }, { status: 500 });
  }
}
