import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { generateCode } from '@/utils/codeGenerator';
import { getAdminUser, requireAdmin, logAdminAction } from '@/utils/adminAuth';

const MAX_BATCH = 500;

async function getStripe() {
  const Stripe = (await import('stripe')).default;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY missing. Configure in .env.local and restart the server.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia' as any,
  });
}

export async function POST(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const {
    codeType,
    count = 1,
    prefix,
    groupSize,
    groups,
    description,
    discountType,
    discountValue,
    membershipPlanCode,
    membershipGrantMode,
    grantDurationDays,
    roleGrant,
    featureFlags,
    maxUses,
    perUserLimit = true,
    validFrom,
    validUntil,
    accessExpiresAt,
    eligibleEmail,
    eligibleDomain,
    usageTargets,
    customTags,
    stripeCouponId,
    stripePromoCodeId,
    metadata
  } = body || {};

  if (!codeType || !['invite', 'promo'].includes(codeType)) {
    return NextResponse.json({ message: 'Invalid code type.' }, { status: 400 });
  }

  const expectedPrefix = codeType === 'promo' ? 'CPN' : 'LTF';
  if (prefix && String(prefix).toUpperCase() !== expectedPrefix) {
    return NextResponse.json({ message: `Prefix must be ${expectedPrefix} for ${codeType} codes.` }, { status: 400 });
  }

  const batchCount = Number(count) || 1;
  if (batchCount < 1 || batchCount > MAX_BATCH) {
    return NextResponse.json({ message: `Count must be between 1 and ${MAX_BATCH}.` }, { status: 400 });
  }

  if (discountType && !['percent', 'fixed'].includes(discountType)) {
    return NextResponse.json({ message: 'Invalid discount type.' }, { status: 400 });
  }

  if (discountType && (!discountValue || Number(discountValue) <= 0)) {
    return NextResponse.json({ message: 'Discount value required.' }, { status: 400 });
  }

  if (discountType && codeType !== 'promo') {
    return NextResponse.json({ message: 'Discounts require promo code type.' }, { status: 400 });
  }

  if (codeType === 'invite' && (!validFrom || !validUntil)) {
    return NextResponse.json({ message: 'Invite codes require a valid start and end date.' }, { status: 400 });
  }

  if (membershipGrantMode && !['free', 'upgrade'].includes(String(membershipGrantMode))) {
    return NextResponse.json({ message: 'Invalid membership grant mode.' }, { status: 400 });
  }

  if (codeType === 'promo' && membershipPlanCode && !accessExpiresAt && !grantDurationDays) {
    return NextResponse.json({ message: 'Membership promos require a duration or expiry date.' }, { status: 400 });
  }

  const usageTargetsList = Array.isArray(usageTargets) ? usageTargets : [];
  const customTagList = typeof customTags === 'string'
    ? customTags.split(',').map((item: string) => item.trim()).filter(Boolean)
    : [];
  const metadataPayload = typeof metadata === 'object' && metadata !== null ? { ...metadata } : {};
  if (customTagList.length > 0) {
    (metadataPayload as Record<string, unknown>).customTags = customTagList;
  }

  const client = await pool.connect();
  const createdCodes: Array<{ code: string; mask: string; hint: string; id: number }> = [];
  let attempts = 0;
  const stripeEnabled = codeType === 'promo' && discountType;

  try {
    const stripe = stripeEnabled ? await getStripe() : null;
    await client.query('BEGIN');

    const resolvedPrefix = expectedPrefix;

    while (createdCodes.length < batchCount && attempts < batchCount * 6) {
      attempts += 1;
      const generated = generateCode({ prefix: resolvedPrefix, groupSize, groups });
      let resolvedStripeCouponId = stripeCouponId || null;
      let resolvedStripePromoCodeId = stripePromoCodeId || null;

      if (stripeEnabled && stripe) {
        const value = Number(discountValue);
        const coupon = await stripe.coupons.create(
          discountType === 'percent'
            ? {
                percent_off: value,
                duration: 'once',
              }
            : {
                amount_off: Math.round(value * 100),
                currency: 'brl',
                duration: 'once',
              }
        );

        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: generated.code,
          max_redemptions: maxUses || undefined,
          expires_at: validUntil ? Math.floor(new Date(validUntil).getTime() / 1000) : undefined,
        } as any);

        resolvedStripeCouponId = coupon.id;
        resolvedStripePromoCodeId = promoCode.id;
      }
      const insertRes = await client.query(
        `INSERT INTO codes
         (code_hash, code_hint, code_type, description, discount_type, discount_value, membership_plan_code,
          role_grant, feature_flags, max_uses, per_user_limit, valid_from, valid_until, access_expires_at,
          eligible_email, eligible_domain, stripe_coupon_id, stripe_promo_code_id, usage_targets,
          grant_duration_days, membership_grant_mode, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
         ON CONFLICT (code_hash) DO NOTHING
         RETURNING id`,
        [
          generated.hash,
          generated.hint,
          codeType,
          description || null,
          discountType || null,
          discountValue || null,
          membershipPlanCode || null,
          roleGrant || null,
          featureFlags ? JSON.stringify(featureFlags) : '[]',
          maxUses || null,
          perUserLimit,
          validFrom ? new Date(validFrom) : null,
          validUntil ? new Date(validUntil) : null,
          accessExpiresAt ? new Date(accessExpiresAt) : null,
          eligibleEmail || null,
          eligibleDomain || null,
          resolvedStripeCouponId,
          resolvedStripePromoCodeId,
          JSON.stringify(usageTargetsList),
          grantDurationDays ? Number(grantDurationDays) : null,
          membershipGrantMode || 'free',
          Object.keys(metadataPayload).length ? JSON.stringify(metadataPayload) : null,
          admin.id
        ]
      );

      if (insertRes.rows.length > 0) {
        createdCodes.push({
          code: generated.code,
          mask: generated.mask,
          hint: generated.hint,
          id: insertRes.rows[0].id
        });
      }
    }

    if (createdCodes.length !== batchCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Failed to generate requested number of codes.' }, { status: 500 });
    }

    await client.query('COMMIT');

    await logAdminAction(
      admin.id,
      'create',
      'codes',
      'batch',
      { count: createdCodes.length, codeType },
      request
    );

    return NextResponse.json({
      message: 'Codes generated successfully.',
      data: {
        count: createdCodes.length,
        codes: createdCodes
      }
    }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin code generation error:', error);
    return NextResponse.json({ message: 'Failed to generate codes.' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const authResponse = await requireAdmin(request);
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const codeType = searchParams.get('type');
  const isActive = searchParams.get('active');
  const limit = Number(searchParams.get('limit') || 50);
  const offset = Number(searchParams.get('offset') || 0);

  const where: string[] = [];
  const params: Array<string | number | boolean> = [];

  if (codeType && ['invite', 'promo'].includes(codeType)) {
    params.push(codeType);
    where.push(`code_type = $${params.length}`);
  }

  if (isActive !== null) {
    params.push(isActive === 'true');
    where.push(`is_active = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, code_hint, code_type, description, discount_type, discount_value, membership_plan_code,
              role_grant, feature_flags, max_uses, used_count, per_user_limit, valid_from, valid_until,
              access_expires_at, eligible_email, eligible_domain, stripe_coupon_id, stripe_promo_code_id,
              usage_targets, grant_duration_days, membership_grant_mode, created_by, created_at, is_active
       FROM codes
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      message: 'Codes retrieved successfully.',
      data: {
        count: result.rows.length,
        codes: result.rows
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Admin code list error:', error);
    return NextResponse.json({ message: 'Failed to retrieve codes.' }, { status: 500 });
  }
}
