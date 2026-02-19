import pool from '@/config/db';
import { hashCode, normalizeCode } from '@/utils/codeGenerator';

export interface CodeInfo {
    id: number;
    code_type: string;
    membership_plan_code: string | null;
    discount_type: string | null;
    discount_value: number | null;
    stripe_coupon_id: string | null;
    stripe_promo_code_id: string | null;
    feature_flags: string[];
    role_grant: string | null;
    valid_from: string | null;
    valid_until: string | null;
    access_expires_at?: string | null;
    grant_duration_days?: number | null;
    membership_grant_mode?: string | null;
}

/**
 * Validate a code and get its benefits
 */
export async function validateAndGetCodeInfo(code: string): Promise<CodeInfo | null> {
    try {
        if (!code || code.trim().length === 0) return null;

        const normalized = normalizeCode(code.trim());
        const codeHash = hashCode(normalized);

        const result = await pool.query(
            `SELECT 
                id, code_type, membership_plan_code, discount_type, discount_value,
                stripe_coupon_id, stripe_promo_code_id, feature_flags, role_grant, valid_from, valid_until,
                access_expires_at, grant_duration_days, membership_grant_mode,
                used_count, max_uses, per_user_limit
             FROM codes
             WHERE code_hash = $1 AND is_active = TRUE`,
            [codeHash]
        );

        if (result.rows.length === 0) return null;

        const codeRecord = result.rows[0];

        // Check usage limits
        if (codeRecord.max_uses && codeRecord.used_count >= codeRecord.max_uses) {
            return null; // Code exhausted
        }

        // Check date validity
        const now = new Date();
        if (codeRecord.valid_from && new Date(codeRecord.valid_from) > now) {
            return null; // Not yet valid
        }
        if (codeRecord.valid_until && new Date(codeRecord.valid_until) < now) {
            return null; // Expired
        }

        return {
            id: codeRecord.id,
            code_type: codeRecord.code_type,
            membership_plan_code: codeRecord.membership_plan_code,
            discount_type: codeRecord.discount_type,
            discount_value: codeRecord.discount_value,
            stripe_coupon_id: codeRecord.stripe_coupon_id,
            stripe_promo_code_id: codeRecord.stripe_promo_code_id,
            feature_flags: codeRecord.feature_flags || [],
            role_grant: codeRecord.role_grant,
            valid_from: codeRecord.valid_from,
            valid_until: codeRecord.valid_until,
            access_expires_at: codeRecord.access_expires_at,
            grant_duration_days: codeRecord.grant_duration_days,
            membership_grant_mode: codeRecord.membership_grant_mode,
        };
    } catch (error) {
        console.error('Error validating code:', error);
        return null;
    }
}

/**
 * Get code benefits (membership upgrade, discount, etc.)
 */
export function getCodeBenefits(codeInfo: CodeInfo) {
    return {
        membershipUpgrade: codeInfo.membership_plan_code,
        discountType: codeInfo.discount_type,
        discountValue: codeInfo.discount_value,
        features: codeInfo.feature_flags,
        roleGrant: codeInfo.role_grant,
    };
}

/**
 * Increment code usage counter
 */
export async function incrementCodeUsage(codeId: number): Promise<boolean> {
    try {
        const result = await pool.query(
            `UPDATE codes SET used_count = used_count + 1 WHERE id = $1 RETURNING used_count`,
            [codeId]
        );
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('Error incrementing code usage:', error);
        return false;
    }
}

/**
 * Validate code for specific user (email/domain eligibility)
 */
export async function validateCodeForUser(code: string, userEmail: string): Promise<boolean> {
    try {
        if (!code || code.trim().length === 0) return true; // No code = no eligibility check

        const normalized = normalizeCode(code.trim());
        const codeHash = hashCode(normalized);

        const result = await pool.query(
            `SELECT eligible_email, eligible_domain FROM codes WHERE code_hash = $1`,
            [codeHash]
        );

        if (result.rows.length === 0) return false;

        const { eligible_email, eligible_domain } = result.rows[0];

        // If specific emails are listed, user must match
        if (eligible_email) {
            const eligibleEmails = eligible_email.split(',').map((e: string) => e.trim().toLowerCase());
            if (!eligibleEmails.includes(userEmail.toLowerCase())) {
                return false;
            }
        }

        // If specific domains are listed, user email domain must match
        if (eligible_domain) {
            const userDomain = userEmail.split('@')[1]?.toLowerCase() || '';
            const eligibleDomains = eligible_domain.split(',').map((d: string) => d.trim().toLowerCase());
            if (!eligibleDomains.includes(userDomain)) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error validating code for user:', error);
        return false;
    }
}

/**
 * Check if user already used a per-user-limit code
 */
export async function hasUserUsedPerUserLimitCode(userId: number, codeId: number): Promise<boolean> {
    try {
        const result = await pool.query(
            `SELECT 1 FROM code_usage_history 
             WHERE user_id = $1 AND code_id = $2 LIMIT 1`,
            [userId, codeId]
        );

        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('Error checking user code usage:', error);
        return false;
    }
}

/**
 * Record code usage by user (for per-user-limit tracking)
 */
export async function recordUserCodeUsage(userId: number, codeId: number): Promise<boolean> {
    try {
        await pool.query(
            `INSERT INTO code_usage_history (user_id, code_id, used_at) 
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, code_id) DO UPDATE 
             SET used_at = NOW()`,
            [userId, codeId]
        );
        return true;
    } catch (error) {
        console.error('Error recording user code usage:', error);
        return false;
    }
}

/**
 * Validate a promo code for HangarShare bookings
 * Returns discount information if valid, null if invalid
 */
export async function validatePromoCode(code: string) {
    try {
        if (!code || code.trim().length === 0) return null;

        // Check in coupons table first (direct discount codes)
        const couponResult = await pool.query(
            `SELECT 
                id, code, discount_type, discount_value, max_uses, used_count,
                valid_from, valid_until, is_active, description
             FROM coupons
             WHERE code = $1 AND is_active = TRUE`,
            [code.trim().toUpperCase()]
        );

        if (couponResult.rows.length > 0) {
            const coupon = couponResult.rows[0];

            // Check usage limits
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
                return null; // Code exhausted
            }

            // Check date validity
            const now = new Date();
            if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                return null; // Not yet valid
            }
            if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                return null; // Expired
            }

            return {
                id: coupon.id,
                code: coupon.code,
                type: 'coupon',
                discountType: coupon.discount_type, // 'percent' or 'fixed'
                discountValue: coupon.discount_value,
                description: coupon.description,
            };
        }

        // Check in codes table for special promo codes
        const normalized = normalizeCode(code.trim());
        const codeHash = hashCode(normalized);

        const codeResult = await pool.query(
            `SELECT 
                id, code_type, discount_type, discount_value, valid_from, valid_until,
                used_count, max_uses
             FROM codes
             WHERE code_hash = $1 AND is_active = TRUE`,
            [codeHash]
        );

        if (codeResult.rows.length > 0) {
            const codeRecord = codeResult.rows[0];

            // Check usage limits
            if (codeRecord.max_uses && codeRecord.used_count >= codeRecord.max_uses) {
                return null;
            }

            // Check date validity
            const now = new Date();
            if (codeRecord.valid_from && new Date(codeRecord.valid_from) > now) {
                return null;
            }
            if (codeRecord.valid_until && new Date(codeRecord.valid_until) < now) {
                return null;
            }

            // Only consider codes that have discount_type and discount_value
            if (!codeRecord.discount_type || codeRecord.discount_value === null) {
                return null;
            }

            return {
                id: codeRecord.id,
                code: code.trim(),
                type: 'promo_code',
                discountType: codeRecord.discount_type,
                discountValue: codeRecord.discount_value,
            };
        }

        return null;
    } catch (error) {
        console.error('Error validating promo code:', error);
        return null;
    }
}

/**
 * Apply discount to a price based on code info
 */
export function applyDiscount(subtotal: number, discountInfo: Awaited<ReturnType<typeof validatePromoCode>>): {
    discount_amount: number;
    discount_percentage: number;
    final_subtotal: number;
} {
    if (!discountInfo) {
        return {
            discount_amount: 0,
            discount_percentage: 0,
            final_subtotal: subtotal,
        };
    }

    let discountAmount = 0;

    if (discountInfo.discountType === 'percent') {
        discountAmount = (subtotal * discountInfo.discountValue) / 100;
    } else if (discountInfo.discountType === 'fixed') {
        discountAmount = discountInfo.discountValue;
    }

    // Cap discount to subtotal (can't have negative price)
    discountAmount = Math.min(discountAmount, subtotal);

    return {
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        discount_percentage: parseFloat(((discountAmount / subtotal) * 100).toFixed(2)),
        final_subtotal: parseFloat((subtotal - discountAmount).toFixed(2)),
    };
}
