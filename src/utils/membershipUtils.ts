import pool from '@/config/db';

export type MembershipPlan = 'free' | 'standard' | 'premium' | 'pro';

export interface MembershipPlanRecord {
    id: number;
    code: MembershipPlan;
    name: string;
    description: string | null;
    monthly_price: number | null;
    annual_price: number | null;
    annual_discount_percent: number;
    stripe_product_id: string | null;
    stripe_monthly_price_id: string | null;
    stripe_annual_price_id: string | null;
    features: string[];
    max_users_allowed: number | null;
    max_projects: number | null;
    max_storage_gb: number | null;
    priority_support: boolean;
    is_active: boolean;
}

export interface UserMembership {
    id: number;
    user_id: number;
    membership_plan_id: number;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    billing_cycle: 'monthly' | 'annual' | null;
    current_period_start: string | null;
    current_period_end: string | null;
    next_billing_date: string | null;
    status: 'active' | 'past_due' | 'canceled' | 'paused';
    canceled_at: string | null;
    reason_for_cancellation: string | null;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get all membership plans
 */
export async function getAllMembershipPlans(): Promise<MembershipPlanRecord[]> {
    try {
        const result = await pool.query(
            `SELECT * FROM membership_plans WHERE is_active = TRUE ORDER BY id ASC`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching membership plans:', error);
        throw error;
    }
}

/**
 * Get specific membership plan by code
 */
export async function getMembershipPlanByCode(
    code: MembershipPlan
): Promise<MembershipPlanRecord | null> {
    try {
        const result = await pool.query(
            `SELECT * FROM membership_plans WHERE code = $1 AND is_active = TRUE`,
            [code]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching membership plan:', error);
        throw error;
    }
}

/**
 * Get specific membership plan by ID
 */
export async function getMembershipPlanById(id: number): Promise<MembershipPlanRecord | null> {
    try {
        const result = await pool.query(
            `SELECT * FROM membership_plans WHERE id = $1 AND is_active = TRUE`,
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching membership plan by ID:', error);
        throw error;
    }
}

/**
 * Get user's current membership
 */
export async function getUserMembership(userId: number): Promise<(UserMembership & { plan: MembershipPlanRecord }) | null> {
    try {
        const result = await pool.query(
            `SELECT um.id, um.user_id, um.membership_plan_id, um.stripe_customer_id, 
                    um.stripe_subscription_id, um.billing_cycle, um.current_period_start,
                    um.current_period_end, um.next_billing_date, um.status, um.canceled_at,
                    um.reason_for_cancellation, um.auto_renew, um.created_at, um.updated_at,
                    mp.id as plan_id, mp.code, mp.name, mp.description, mp.monthly_price,
                    mp.annual_price, mp.annual_discount_percent, mp.stripe_product_id,
                    mp.stripe_monthly_price_id, mp.stripe_annual_price_id, mp.features,
                    mp.max_users_allowed, mp.max_projects, mp.max_storage_gb, 
                    mp.priority_support, mp.is_active
             FROM user_memberships um
             JOIN membership_plans mp ON um.membership_plan_id = mp.id
             WHERE um.user_id = $1 AND um.status = 'active'
             ORDER BY um.created_at DESC
             LIMIT 1`,
            [userId]
        );
        
        if (!result.rows[0]) return null;
        
        const row = result.rows[0];
        const membership: any = {
            id: row.id,
            user_id: row.user_id,
            membership_plan_id: row.membership_plan_id,
            stripe_customer_id: row.stripe_customer_id,
            stripe_subscription_id: row.stripe_subscription_id,
            billing_cycle: row.billing_cycle,
            current_period_start: row.current_period_start,
            current_period_end: row.current_period_end,
            next_billing_date: row.next_billing_date,
            status: row.status,
            canceled_at: row.canceled_at,
            reason_for_cancellation: row.reason_for_cancellation,
            auto_renew: row.auto_renew,
            created_at: row.created_at,
            updated_at: row.updated_at,
            plan: {
                id: row.plan_id,
                code: row.code,
                name: row.name,
                description: row.description,
                monthly_price: row.monthly_price,
                annual_price: row.annual_price,
                annual_discount_percent: row.annual_discount_percent,
                stripe_product_id: row.stripe_product_id,
                stripe_monthly_price_id: row.stripe_monthly_price_id,
                stripe_annual_price_id: row.stripe_annual_price_id,
                features: row.features,
                max_users_allowed: row.max_users_allowed,
                max_projects: row.max_projects,
                max_storage_gb: row.max_storage_gb,
                priority_support: row.priority_support,
                is_active: row.is_active,
            }
        };
        
        return membership;
    } catch (error) {
        console.error('Error fetching user membership:', error);
        throw error;
    }
}

/**
 * Get membership by Stripe subscription ID
 */
export async function getMembershipByStripeSubscriptionId(subscriptionId: string): Promise<UserMembership | null> {
    try {
        const result = await pool.query(
            `SELECT * FROM user_memberships WHERE stripe_subscription_id = $1 LIMIT 1`,
            [subscriptionId]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching membership by Stripe subscription:', error);
        throw error;
    }
}

/**
 * Check if user has access to feature
 */
export async function hasFeatureAccess(
    userId: number,
    featureCode: string
): Promise<boolean> {
    try {
        const membership = await getUserMembership(userId);
        if (!membership) return featureCode === 'basic_access'; // Free users have basic access

        const result = await pool.query(
            `SELECT enabled FROM membership_plan_features
             WHERE membership_plan_id = $1 AND feature_code = $2`,
            [membership.membership_plan_id, featureCode]
        );

        return result.rows.length > 0 && result.rows[0].enabled;
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
}

/**
 * Create user membership record
 */
export async function createUserMembership(
    userId: number,
    planId: number,
    billingCycle: 'monthly' | 'annual',
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
): Promise<UserMembership> {
    try {
        const result = await pool.query(
            `INSERT INTO user_memberships (
                user_id, membership_plan_id, billing_cycle,
                stripe_customer_id, stripe_subscription_id, status
            ) VALUES ($1, $2, $3, $4, $5, 'active')
            RETURNING *`,
            [userId, planId, billingCycle, stripeCustomerId || null, stripeSubscriptionId || null]
        );

        await pool.query(
            `UPDATE users
             SET plan = (SELECT code FROM membership_plans WHERE id = $1)
             WHERE id = $2`,
            [planId, userId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error creating user membership:', error);
        throw error;
    }
}

/**
 * Update user membership (upgrade/downgrade)
 */
export async function updateUserMembership(
    userId: number,
    newPlanId: number,
    billingCycle: 'monthly' | 'annual',
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
): Promise<UserMembership> {
    try {
        // Archive old membership in history
        const oldMembership = await getUserMembership(userId);
        if (oldMembership) {
            await pool.query(
                `INSERT INTO user_membership_history (
                    user_id, action, from_plan_id, to_plan_id, billing_cycle
                ) VALUES ($1, 'upgraded', $2, $3, $4)`,
                [userId, oldMembership.membership_plan_id, newPlanId, billingCycle]
            );
        }

        // Create new membership
        const result = await pool.query(
            `INSERT INTO user_memberships (
                user_id, membership_plan_id, billing_cycle,
                stripe_customer_id, stripe_subscription_id, status
            ) VALUES ($1, $2, $3, $4, $5, 'active')
            RETURNING *`,
            [userId, newPlanId, billingCycle, stripeCustomerId || null, stripeSubscriptionId || null]
        );

        await pool.query(
            `UPDATE users
             SET plan = (SELECT code FROM membership_plans WHERE id = $1)
             WHERE id = $2`,
            [newPlanId, userId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error updating user membership:', error);
        throw error;
    }
}

/**
 * Cancel user membership
 */
export async function cancelUserMembership(
    userId: number,
    reason?: string
): Promise<void> {
    try {
        await pool.query(
            `UPDATE user_memberships
             SET status = 'canceled', canceled_at = NOW(), reason_for_cancellation = $1
             WHERE user_id = $2 AND status = 'active'`,
            [reason || null, userId]
        );

        // Log to history
        await pool.query(
            `INSERT INTO user_membership_history (
                user_id, action, notes
            ) VALUES ($1, 'canceled', $2)`,
            [userId, reason || 'User requested cancellation']
        );
    } catch (error) {
        console.error('Error canceling user membership:', error);
        throw error;
    }
}

/**
 * Record billing invoice
 */
export async function recordBillingInvoice(
    userId: number,
    stripeInvoiceId: string,
    amountPaid: number,
    status: string,
    invoiceUrl?: string,
    pdfUrl?: string
): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO billing_invoices (
                user_id, stripe_invoice_id, amount_paid, status, invoice_url, pdf_url, paid_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (stripe_invoice_id) DO UPDATE SET status = $4, paid_at = NOW()`,
            [userId, stripeInvoiceId, amountPaid, status, invoiceUrl || null, pdfUrl || null]
        );
    } catch (error) {
        console.error('Error recording billing invoice:', error);
        throw error;
    }
}

/**
 * Get user billing history
 */
export async function getUserBillingHistory(userId: number, limit: number = 10) {
    try {
        const result = await pool.query(
            `SELECT * FROM billing_invoices
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching billing history:', error);
        throw error;
    }
}

/**
 * Update membership from Stripe event
 */
export async function handleStripeSubscriptionUpdate(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    status: string,
    periodStart?: Date,
    periodEnd?: Date
): Promise<void> {
    try {
        await pool.query(
            `UPDATE user_memberships
             SET status = $1, 
                 current_period_start = $2,
                 current_period_end = $3,
                 updated_at = NOW()
             WHERE stripe_subscription_id = $4`,
            [status, periodStart || null, periodEnd || null, stripeSubscriptionId]
        );
    } catch (error) {
        console.error('Error handling Stripe subscription update:', error);
        throw error;
    }
}
