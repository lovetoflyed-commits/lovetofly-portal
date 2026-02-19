import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership, getUserBillingHistory } from '@/utils/membershipUtils';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const membership = await getUserMembership(user.id);
        let billingHistory = [];

        if (membership) {
            billingHistory = await getUserBillingHistory(user.id);
        }

        const planCode = membership?.plan?.code ?? (membership as any)?.plan_code ?? (membership as any)?.code ?? null;
        const planName = membership?.plan?.name ?? (membership as any)?.plan_name ?? (membership as any)?.name ?? null;

        return NextResponse.json(
            {
                success: true,
                data: {
                    membership: membership ? {
                        id: membership.id,
                        userId: membership.user_id,
                        planId: membership.membership_plan_id,
                        planCode,
                        planName,
                        stripeSubscriptionId: membership.stripe_subscription_id,
                        startDate: membership.current_period_start,
                        renewalDate: membership.current_period_end,
                        billingCycle: membership.billing_cycle,
                        status: membership.status,
                        autoRenewal: membership.auto_renew,
                    } : null,
                    billingHistory: billingHistory.map((invoice) => ({
                        id: invoice.id,
                        invoiceDate: invoice.invoice_date,
                        amount: invoice.amount,
                        currency: invoice.currency,
                        status: invoice.status,
                        stripeInvoiceId: invoice.stripe_invoice_id,
                    })),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[User Membership] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch membership' },
            { status: 500 }
        );
    }
}
