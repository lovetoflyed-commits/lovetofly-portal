import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAndGetUser } from '@/utils/authUtils';
import { getUserMembership, getMembershipPlanByCode, updateUserMembership } from '@/utils/membershipUtils';
import pool from '@/config/db';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { paymentId, transactionId } = body;

        if (!paymentId || !transactionId) {
            return NextResponse.json(
                { error: 'Payment ID and transaction ID are required' },
                { status: 400 }
            );
        }

        // Verify that the payment exists and belongs to this user
        const paymentResult = await pool.query(
            `SELECT pp.id, pp.status, pp.amount_cents, pp.order_id, pmp.target_plan_code, pmp.billing_cycle
             FROM pix_payments pp
             LEFT JOIN pending_membership_upgrades pmp ON pmp.user_id = pp.user_id AND pmp.status = 'pending'
             WHERE pp.id = $1 AND pp.user_id = $2 AND pp.status = 'completed'`,
            [paymentId, user.id]
        );

        if (paymentResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Payment not found or not completed' },
                { status: 404 }
            );
        }

        const payment = paymentResult.rows[0];
        const orderId = String(payment.order_id || '');
        const planMatch = orderId.match(/^membership-([a-z]+)/i);
        const fallbackPlanCode = planMatch ? planMatch[1].toLowerCase() : null;
        const targetPlanCode = payment.target_plan_code || fallbackPlanCode;
        const billingCycle = payment.billing_cycle || 'monthly';

        if (!targetPlanCode) {
            return NextResponse.json(
                { error: 'No membership upgrade information found for this payment' },
                { status: 400 }
            );
        }

        // Get the plan details
        const newPlan = await getMembershipPlanByCode(targetPlanCode);
        if (!newPlan) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            );
        }

        // Avoid duplicate activation if already on the target plan
        const activeMembership = await pool.query(
            `SELECT 1 FROM user_memberships
             WHERE user_id = $1 AND membership_plan_id = $2 AND status = 'active'
             LIMIT 1`,
            [user.id, newPlan.id]
        );

        if (activeMembership.rows.length === 0) {
            await updateUserMembership(user.id, newPlan.id, billingCycle);
        }

        // Update the pending upgrade record to completed (if still pending)
        await pool.query(
            `UPDATE pending_membership_upgrades 
             SET status = 'completed', payment_method = 'pix', completed_at = NOW(), updated_at = NOW()
             WHERE user_id = $1 AND target_plan_code = $2 AND status = 'pending'`,
            [user.id, targetPlanCode]
        );

        // Log the successful upgrade
        try {
            await pool.query(
                `INSERT INTO user_activity_log 
                 (user_id, activity_type, metadata)
                 VALUES ($1, $2, $3)`,
                [
                    user.id,
                    'membership_upgrade_completed',
                    JSON.stringify({
                        targetPlan: targetPlanCode,
                        billingCycle,
                        paymentMethod: 'pix',
                        paymentId,
                        transactionId,
                        amountCents: payment.amount_cents,
                    })
                ]
            );
        } catch (err) {
            console.error('Error logging to activity log:', err);
        }

        // Create a notification for the user
        try {
            const plan = await getMembershipPlanByCode(targetPlanCode);
            await pool.query(
                `INSERT INTO user_notifications
                 (user_id, type, title, message, priority, action_url, action_label)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    user.id,
                    'membership_upgraded',
                    'Assinatura Ativada',
                    `Sua assinatura para o plano ${plan?.name || targetPlanCode.toUpperCase()} foi ativada com sucesso!`,
                    'high',
                    '/profile?tab=membership',
                    'Ver assinatura',
                ]
            );
        } catch (err) {
            console.error('Error creating notification:', err);
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    message: 'Membership upgrade confirmed',
                    planCode: targetPlanCode,
                    billingCycle,
                    paymentId,
                    transactionId,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error confirming PIX payment:', error);
        return NextResponse.json(
            { error: 'Failed to confirm payment' },
            { status: 500 }
        );
    }
}
