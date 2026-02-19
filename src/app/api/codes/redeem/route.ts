import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { hashCode, normalizeCode } from '@/utils/codeGenerator';
import { verifyToken } from '@/utils/auth';

const ROLE_ALLOWLIST = new Set(['user', 'beta', 'tester', 'member']);

export async function POST(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload?.id && !payload?.userId) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  const rawUserId = payload.id ?? payload.userId;
  const userId = Number(rawUserId);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ message: 'Invalid user.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const { code, orderId, metadata } = body || {};
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ message: 'Invalid code.' }, { status: 400 });
  }

  const normalized = normalizeCode(code);
  const prefix = normalized.slice(0, 3);
  if (prefix !== 'LTF' && prefix !== 'CPN') {
    return NextResponse.json({ message: 'Invalid code prefix.' }, { status: 400 });
  }
  const codeHash = hashCode(normalized);
  const now = new Date();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const codeRes = await client.query(
      `SELECT * FROM codes
       WHERE code_hash = $1 AND is_active = TRUE
       FOR UPDATE`,
      [codeHash]
    );

    if (codeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Invalid or expired code.' }, { status: 404 });
    }

    const codeRow = codeRes.rows[0];
    const grantMode = codeRow.membership_grant_mode || 'free';
    const grantDurationDays = codeRow.grant_duration_days ? Number(codeRow.grant_duration_days) : null;
    const grantExpiresAt = codeRow.access_expires_at
      ? new Date(codeRow.access_expires_at)
      : (grantDurationDays ? new Date(now.getTime() + grantDurationDays * 24 * 60 * 60 * 1000) : null);

    if (codeRow.valid_from && now < new Date(codeRow.valid_from)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Code not active yet.' }, { status: 400 });
    }

    if (codeRow.valid_until && now > new Date(codeRow.valid_until)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Code expired.' }, { status: 400 });
    }

    if (codeRow.max_uses && codeRow.used_count >= codeRow.max_uses) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Usage limit reached.' }, { status: 400 });
    }

    const userRes = await client.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];
    const normalizedEmail = String(user.email || '').trim().toLowerCase();

    if (codeRow.eligible_email && normalizedEmail !== String(codeRow.eligible_email).trim().toLowerCase()) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Email not eligible for this code.' }, { status: 403 });
    }

    if (codeRow.eligible_domain) {
      const domain = normalizedEmail.split('@')[1] || '';
      if (domain !== String(codeRow.eligible_domain).trim().toLowerCase()) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Domain not eligible for this code.' }, { status: 403 });
      }
    }

    if (codeRow.per_user_limit) {
      const existing = await client.query(
        'SELECT 1 FROM code_redemptions WHERE code_id = $1 AND user_id = $2 LIMIT 1',
        [codeRow.id, userId]
      );
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Code already redeemed.' }, { status: 400 });
      }
    }

    if (orderId) {
      const existingOrder = await client.query(
        'SELECT 1 FROM code_redemptions WHERE code_id = $1 AND user_id = $2 AND order_id = $3 LIMIT 1',
        [codeRow.id, userId, orderId]
      );
      if (existingOrder.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Code already redeemed for this order.' }, { status: 400 });
      }
    }

    await client.query(
      'INSERT INTO code_redemptions (code_id, user_id, order_id, metadata) VALUES ($1, $2, $3, $4)',
      [codeRow.id, userId, orderId || null, metadata ? JSON.stringify(metadata) : null]
    );

    await client.query(
      'UPDATE codes SET used_count = used_count + 1 WHERE id = $1',
      [codeRow.id]
    );

    let membershipApplied = null;
    if (codeRow.membership_plan_code) {
      const planRes = await client.query(
        'SELECT id, level FROM membership_plans WHERE plan_code = $1',
        [codeRow.membership_plan_code]
      );
      if (planRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Membership plan not found.' }, { status: 400 });
      }
      const planId = planRes.rows[0].id;
      const planLevel = Number(planRes.rows[0].level);

      if (grantMode === 'upgrade') {
        const currentRes = await client.query(
          `SELECT mp.level
           FROM user_memberships um
           JOIN membership_plans mp ON mp.id = um.plan_id
           WHERE um.user_id = $1`,
          [userId]
        );
        if (currentRes.rows.length > 0) {
          const currentLevel = Number(currentRes.rows[0].level);
          if (currentLevel >= planLevel) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'User already has this plan or higher.' }, { status: 400 });
          }
        }
      }
      await client.query(
        `INSERT INTO user_memberships (user_id, plan_id, status, starts_at, expires_at, notes)
         VALUES ($1, $2, 'active', NOW(), $3, 'Granted by code redemption')
         ON CONFLICT (user_id) DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           status = 'active',
           starts_at = NOW(),
           expires_at = EXCLUDED.expires_at,
           notes = EXCLUDED.notes,
           updated_at = NOW()`,
        [userId, planId, grantExpiresAt]
      );
      membershipApplied = codeRow.membership_plan_code;
    }

    let roleApplied = null;
    if (codeRow.role_grant) {
      const roleGrant = String(codeRow.role_grant).trim().toLowerCase();
      if (!ROLE_ALLOWLIST.has(roleGrant)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Role grant not permitted.' }, { status: 400 });
      }
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [roleGrant, userId]);
      roleApplied = roleGrant;
    }

    await client.query(
      `INSERT INTO user_code_entitlements
       (user_id, source_code_id, role_grant, membership_plan_code, feature_flags, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (user_id, source_code_id) DO UPDATE SET
         role_grant = EXCLUDED.role_grant,
         membership_plan_code = EXCLUDED.membership_plan_code,
         feature_flags = EXCLUDED.feature_flags,
         expires_at = EXCLUDED.expires_at,
         is_active = TRUE`,
      [
        userId,
        codeRow.id,
        roleApplied,
        membershipApplied,
        codeRow.feature_flags || '[]',
        grantExpiresAt
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'Code redeemed successfully.',
      data: {
        codeType: codeRow.code_type,
        discountType: codeRow.discount_type,
        discountValue: codeRow.discount_value,
        membershipPlanCode: membershipApplied,
        roleGrant: roleApplied,
        featureFlags: codeRow.feature_flags,
        accessExpiresAt: grantExpiresAt,
        stripePromoCodeId: codeRow.stripe_promo_code_id
      }
    }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Code redemption error:', error);
    return NextResponse.json({ message: 'Failed to redeem code.' }, { status: 500 });
  } finally {
    client.release();
  }
}
