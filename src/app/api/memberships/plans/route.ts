import { NextRequest, NextResponse } from 'next/server';
import { getAllMembershipPlans, getMembershipPlanByCode } from '@/utils/membershipUtils';

export async function GET(request: NextRequest) {
    try {
        const plans = await getAllMembershipPlans();

        return NextResponse.json(
            {
                success: true,
                data: {
                    plans: plans.map((plan) => ({
                        id: plan.id,
                        code: plan.code,
                        name: plan.name,
                        description: plan.description,
                        monthlyPrice: plan.monthly_price,
                        annualPrice: plan.annual_price,
                        annualDiscountPercent: plan.annual_discount_percent,
                        features: plan.features,
                        prioritySupport: plan.priority_support,
                        maxUsersAllowed: plan.max_users_allowed,
                        maxProjects: plan.max_projects,
                        maxStorageGb: plan.max_storage_gb,
                    })),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Membership Plans] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch membership plans' },
            { status: 500 }
        );
    }
}
