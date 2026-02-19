import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership, cancelUserMembership } from '@/utils/membershipUtils';
import { cancelStripeSubscription } from '@/utils/stripeUtils';
import { verifyTokenAndGetUser } from '@/utils/authUtils';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyTokenAndGetUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const membership = await getUserMembership(user.id);
        if (!membership) {
            return NextResponse.json(
                { error: 'No active membership found' },
                { status: 404 }
            );
        }

        if (membership.plan.code === 'free') {
            return NextResponse.json(
                { error: 'Cannot cancel free membership' },
                { status: 400 }
            );
        }

        // Cancel Stripe subscription if it exists
        if (membership.stripe_subscription_id) {
            await cancelStripeSubscription(membership.stripe_subscription_id);
        }

        // Update membership status to cancelled
        await cancelUserMembership(user.id);

        return NextResponse.json(
            {
                success: true,
                data: {
                    message: 'Membership cancelled successfully',
                    newPlanCode: 'free',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Membership Cancel] Error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel membership' },
            { status: 500 }
        );
    }
}
