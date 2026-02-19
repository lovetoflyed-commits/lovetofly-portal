import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { hashCode, normalizeCode } from '@/utils/codeGenerator';

export async function POST(request: Request) {
  try {
    const { code, email, codeType } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ message: 'Invalid code.' }, { status: 400 });
    }

    const normalized = normalizeCode(code);
    const prefix = normalized.slice(0, 3);
    if (codeType === 'invite' && prefix !== 'LTF') {
      return NextResponse.json({ message: 'Invalid invite code prefix.' }, { status: 400 });
    }
    if (codeType === 'promo' && prefix !== 'CPN') {
      return NextResponse.json({ message: 'Invalid promo code prefix.' }, { status: 400 });
    }
    const codeHash = hashCode(normalized);
    const now = new Date();

    const result = await pool.query(
      `SELECT id, code_type, description, discount_type, discount_value, membership_plan_code, role_grant,
              feature_flags, max_uses, used_count, per_user_limit, valid_from, valid_until, access_expires_at,
              eligible_email, eligible_domain, stripe_promo_code_id, usage_targets, grant_duration_days,
              membership_grant_mode
       FROM codes
       WHERE code_hash = $1 AND is_active = TRUE`,
      [codeHash]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired code.' }, { status: 404 });
    }

    const codeRow = result.rows[0];

    if (codeType && codeRow.code_type !== codeType) {
      return NextResponse.json({ message: 'Invalid code type.' }, { status: 400 });
    }

    if (codeRow.valid_from && now < new Date(codeRow.valid_from)) {
      return NextResponse.json({ message: 'Code not active yet.' }, { status: 400 });
    }

    if (codeRow.valid_until && now > new Date(codeRow.valid_until)) {
      return NextResponse.json({ message: 'Code expired.' }, { status: 400 });
    }

    if (codeRow.max_uses && codeRow.used_count >= codeRow.max_uses) {
      return NextResponse.json({ message: 'Usage limit reached.' }, { status: 400 });
    }

    if ((codeRow.eligible_email || codeRow.eligible_domain) && !email) {
      return NextResponse.json({ message: 'Email required for this code.' }, { status: 400 });
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (codeRow.eligible_email && normalizedEmail !== String(codeRow.eligible_email).trim().toLowerCase()) {
        return NextResponse.json({ message: 'Email not eligible for this code.' }, { status: 403 });
      }
      if (codeRow.eligible_domain) {
        const domain = normalizedEmail.split('@')[1] || '';
        if (domain !== String(codeRow.eligible_domain).trim().toLowerCase()) {
          return NextResponse.json({ message: 'Domain not eligible for this code.' }, { status: 403 });
        }
      }
    }

    return NextResponse.json({
      message: 'Code valid.',
      data: {
        id: codeRow.id,
        codeType: codeRow.code_type,
        description: codeRow.description,
        discountType: codeRow.discount_type,
        discountValue: codeRow.discount_value,
        membershipPlanCode: codeRow.membership_plan_code,
        roleGrant: codeRow.role_grant,
        featureFlags: codeRow.feature_flags,
        accessExpiresAt: codeRow.access_expires_at,
        stripePromoCodeId: codeRow.stripe_promo_code_id,
        usageTargets: codeRow.usage_targets || [],
        grantDurationDays: codeRow.grant_duration_days,
        membershipGrantMode: codeRow.membership_grant_mode,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Code validation error:', error);
    return NextResponse.json({ message: 'Failed to validate code.' }, { status: 500 });
  }
}
