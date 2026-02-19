import { NextRequest, NextResponse } from 'next/server';
import { getUserMembership, getMembershipPlanByCode, updateUserMembership, type MembershipPlan } from '@/utils/membershipUtils';
import { createCheckoutSession, createStripeCoupon, createStripeCustomer } from '@/utils/stripeUtils';
import { verifyTokenAndGetUser } from '@/utils/authUtils';
import { validateAndGetCodeInfo, getCodeBenefits, incrementCodeUsage, recordUserCodeUsage, type CodeInfo } from '@/utils/codeUtils';
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

        const buildAccessExpiry = (info: CodeInfo | null) => {
            if (!info) return null;
            if (info.access_expires_at) return new Date(info.access_expires_at);
            if (info.grant_duration_days && Number(info.grant_duration_days) > 0) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + Number(info.grant_duration_days));
                return expiry;
            }
            if (info.valid_until) return new Date(info.valid_until);
            return null;
        };

        const createCodeNotification = async (context: { status: 'pending' | 'active'; planName: string }) => {
            if (!codeInfo || !appliedCode) return;

            const expiresAt = buildAccessExpiry(codeInfo);
            const expiryText = expiresAt
                ? `O acesso gratuito expira em ${expiresAt.toLocaleDateString('pt-BR')}.`
                : 'Consulte os detalhes da sua assinatura para verificar prazos.';

            const title = codeInfo.code_type === 'invite'
                ? 'Convite aplicado com sucesso'
                : 'Codigo promocional aplicado com sucesso';

            const message = context.status === 'pending'
                ? `Seu codigo ${appliedCode} foi aplicado para o plano ${context.planName}. Finalize o pagamento para ativar a assinatura. ${expiryText}`
                : `Seu codigo ${appliedCode} ativou o plano ${context.planName}. ${expiryText}`;

            await pool.query(
                `INSERT INTO user_notifications
                 (user_id, type, title, message, priority, action_url, action_label, metadata, expires_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    user.id,
                    'membership_code_applied',
                    title,
                    message,
                    'normal',
                    '/profile?tab=membership',
                    'Ver assinatura',
                    JSON.stringify({
                        code: appliedCode,
                        plan: finalPlanCode,
                        billingCycle,
                        expiresAt: expiresAt ? expiresAt.toISOString() : null,
                        codeType: codeInfo.code_type,
                        discountType: codeBenefits?.discountType || null,
                        discountValue: codeBenefits?.discountValue || null,
                    }),
                    expiresAt,
                ]
            );
        };

        const body = await request.json();
        const { planCode, billingCycle = 'monthly', code: appliedCode, paymentMethod = 'stripe' } = body;

        if (!planCode) {
            return NextResponse.json(
                { error: 'Plan code is required' },
                { status: 400 }
            );
        }

        if (!['monthly', 'annual'].includes(billingCycle)) {
            return NextResponse.json(
                { error: 'Invalid billing cycle. Must be monthly or annual' },
                { status: 400 }
            );
        }

        // Process code if provided
        let codeInfo: CodeInfo | null = null;
        let codeBenefits: ReturnType<typeof getCodeBenefits> | null = null;
        let finalPlanCode = typeof planCode === 'string' ? planCode.trim().toLowerCase() : '';
        
        if (appliedCode && appliedCode.trim()) {
            codeInfo = await validateAndGetCodeInfo(appliedCode);
            if (!codeInfo) {
                return NextResponse.json(
                    { error: 'Invalid or expired code' },
                    { status: 400 }
                );
            }
            
            codeBenefits = getCodeBenefits(codeInfo);
            console.log('[Upgrade] Code benefits:', JSON.stringify(codeBenefits, null, 2));
            
            // Override plan if code grants upgrade
            if (codeBenefits.membershipUpgrade) {
                finalPlanCode = String(codeBenefits.membershipUpgrade).trim().toLowerCase();
            }
        }

        const allowedPlans = new Set(['free', 'standard', 'premium', 'pro']);
        if (!allowedPlans.has(finalPlanCode)) {
            return NextResponse.json(
                { error: 'Invalid plan code' },
                { status: 400 }
            );
        }

        const normalizedPlanCode = finalPlanCode as MembershipPlan;
        const newPlan = await getMembershipPlanByCode(normalizedPlanCode);
        if (!newPlan) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            );
        }

        const currentMembership = await getUserMembership(user.id);
        let stripeCustomerId = currentMembership?.stripe_customer_id || null;

        if (!stripeCustomerId) {
            stripeCustomerId = await createStripeCustomer(user.email, undefined, user.id);
            await pool.query(
                `UPDATE user_memberships
                 SET stripe_customer_id = $1
                 WHERE user_id = $2 AND status = 'active'`,
                [stripeCustomerId, user.id]
            );
        }

        let stripeCouponId = codeInfo?.stripe_coupon_id || null;
        let stripePromotionCodeId = codeInfo?.stripe_promo_code_id || null;

        const discountType =
            codeBenefits?.discountType === 'percent' || codeBenefits?.discountType === 'fixed'
                ? codeBenefits.discountType
                : null;

        if (discountType && codeBenefits?.discountValue && !stripeCouponId && !stripePromotionCodeId) {
            const coupon = await createStripeCoupon({
                discountType,
                discountValue: Number(codeBenefits.discountValue),
            });
            stripeCouponId = coupon.id;

            if (codeInfo?.id) {
                await pool.query(
                    `UPDATE codes SET stripe_coupon_id = $1 WHERE id = $2`,
                    [stripeCouponId, codeInfo.id]
                );
            }
        }

        // Check if this is a free upgrade:
        // 1. Upgrading to free plan
        // 2. Code with 100% discount
        // 3. Code that grants a membership plan upgrade (free upgrade grant)
        const discountValue = codeBenefits?.discountValue ? Number(codeBenefits.discountValue) : 0;
        const is100PercentDiscount = 
            codeBenefits?.discountType === 'percent' && 
            (discountValue === 100 || discountValue >= 100);
        const hasMembershipGrant = Boolean(codeBenefits?.membershipUpgrade);
        const isPromoGrant = hasMembershipGrant && codeInfo?.code_type === 'promo';
        
        const isFreeUpgrade = newPlan.code === 'free' || is100PercentDiscount || isPromoGrant;
        
        console.log('[Upgrade] Free upgrade check:', {
            planCode: newPlan.code,
            discountType: codeBenefits?.discountType,
            discountValue: discountValue,
            membershipUpgrade: codeBenefits?.membershipUpgrade,
            is100PercentDiscount,
            hasMembershipGrant,
            isPromoGrant,
            isFreeUpgrade
        });

        // If upgrading/downgrading to a paid plan (without 100% discount), handle payment
        if (!isFreeUpgrade) {
            // Handle PIX payment
            if (paymentMethod === 'pix') {
                // For PIX, we don't need to create a Stripe checkout session
                // Instead, we validate that a PIX key is configured and return action to start PIX payment
                const pixKeyResult = await pool.query(
                    `SELECT id, pix_key, pix_key_type FROM pix_keys WHERE is_active = true LIMIT 1`
                );

                if (pixKeyResult.rows.length === 0) {
                    return NextResponse.json(
                        { error: 'PIX is not configured. Please contact support.' },
                        { status: 400 }
                    );
                }

                // Calculate the amount to be paid (in cents)
                const amount = billingCycle === 'monthly'
                    ? Math.round(Number(newPlan.monthly_price || 0) * 100)
                    : Math.round(Number(newPlan.annual_price || 0) * 100);

                if (amount <= 0) {
                    return NextResponse.json(
                        { error: 'Plan pricing not configured' },
                        { status: 500 }
                    );
                }

                // Log pending upgrade creation for PIX
                try {
                    await pool.query(
                        `INSERT INTO pending_membership_upgrades 
                         (user_id, target_plan_code, billing_cycle, payment_method, amount_cents, promo_code, status)
                         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
                        [user.id, finalPlanCode, billingCycle, 'pix', amount, appliedCode || null]
                    );
                } catch (err) {
                    console.error('Error logging pending upgrade:', err);
                    // Don't block checkout if logging fails
                }

                // Log to activity log for PIX upgrade
                try {
                    await pool.query(
                        `INSERT INTO user_activity_log 
                         (user_id, activity_type, activity_note)
                         VALUES ($1, $2, $3)`,
                        [
                            user.id,
                            'membership_upgrade_started',
                            JSON.stringify({
                                targetPlan: finalPlanCode,
                                billingCycle,
                                paymentMethod: 'pix',
                                amountCents: amount,
                                promoCode: appliedCode || null,
                            })
                        ]
                    );
                } catch (err) {
                    console.error('Error logging to activity log:', err);
                }

                try {
                    await createCodeNotification({ status: 'pending', planName: newPlan.name });
                } catch (err) {
                    console.error('Error creating code notification:', err);
                }

                // Track code usage if code was applied
                if (codeInfo) {
                    try {
                        await incrementCodeUsage(codeInfo.id);
                        
                        // Record in user_code_usage for future reference
                        await pool.query(
                            `INSERT INTO user_code_usage (user_id, code_id, membership_id, membership_upgrade_to, applied_at)
                             VALUES ($1, $2, $3, $4, NOW())`,
                            [user.id, codeInfo.id, currentMembership?.id || null, finalPlanCode]
                        );
                    } catch (err) {
                        console.error('Error tracking code usage:', err);
                        // Don't block upgrade if tracking fails
                    }
                }

                return NextResponse.json(
                    {
                        success: true,
                        data: {
                            action: 'start_pix_payment',
                            paymentMethod: 'pix',
                            planCode: finalPlanCode,
                            billingCycle,
                            amountCents: amount,
                            codeBenefits: codeBenefits ? {
                                discountType: codeBenefits.discountType,
                                discountValue: codeBenefits.discountValue,
                                membershipUpgrade: codeBenefits.membershipUpgrade,
                            } : null,
                        },
                    },
                    { status: 200 }
                );
            }

            // Handle Stripe payment (existing logic)
            const priceId = billingCycle === 'monthly' 
                ? newPlan.stripe_monthly_price_id 
                : newPlan.stripe_annual_price_id;

            if (!priceId) {
                return NextResponse.json(
                    { error: 'Plan pricing not configured' },
                    { status: 500 }
                );
            }

            const checkoutUrl = await createCheckoutSession({
                userId: user.id,
                userEmail: user.email,
                priceId,
                planCode: newPlan.code,
                billingCycle,
                currentSubscriptionId: currentMembership?.stripe_subscription_id || null,
                customerId: stripeCustomerId,
                stripeCouponId,
                stripePromotionCodeId,
                codeId: codeInfo?.id || null,
            });

            // Extract checkout_session_id from the URL if available
            let checkoutSessionId: string | null = null;
            try {
                const url = new URL(checkoutUrl);
                const pathParts = url.pathname.split('/');
                const csIndex = pathParts.findIndex(part => part === 'c');
                if (csIndex !== -1 && pathParts.length > csIndex + 2) {
                    checkoutSessionId = pathParts[csIndex + 2];
                }
            } catch (e) {
                console.warn('Failed to extract checkout_session_id from URL:', e);
            }

            // Log pending upgrade creation to dedicated table
            try {
                await pool.query(
                    `INSERT INTO pending_membership_upgrades 
                     (user_id, target_plan_code, billing_cycle, checkout_session_id, checkout_url, promo_code, status)
                     VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
                    [user.id, finalPlanCode, billingCycle, checkoutSessionId, checkoutUrl, appliedCode || null]
                );
            } catch (err) {
                console.error('Error logging pending upgrade:', err);
                // Don't block checkout if logging fails
            }

            // Also log to activity log
            try {
                await pool.query(
                    `INSERT INTO user_activity_log 
                     (user_id, activity_type, metadata)
                     VALUES ($1, $2, $3)`,
                    [
                        user.id,
                        'membership_upgrade_started',
                        JSON.stringify({
                            targetPlan: finalPlanCode,
                            billingCycle,
                            checkoutUrl,
                            promoCode: appliedCode || null,
                            checkoutSessionId,
                        })
                    ]
                );
            } catch (err) {
                console.error('Error logging to activity log:', err);
            }

            try {
                await createCodeNotification({ status: 'pending', planName: newPlan.name });
            } catch (err) {
                console.error('Error creating code notification:', err);
            }

            // Track code usage if code was applied
            if (codeInfo) {
                try {
                    await incrementCodeUsage(codeInfo.id);
                    
                    // Record in user_code_usage for future reference
                    await pool.query(
                        `INSERT INTO user_code_usage (user_id, code_id, membership_id, membership_upgrade_to, applied_at)
                         VALUES ($1, $2, $3, $4, NOW())`,
                        [user.id, codeInfo.id, currentMembership?.id || null, finalPlanCode]
                    );
                } catch (err) {
                    console.error('Error tracking code usage:', err);
                    // Don't block upgrade if tracking fails
                }
            }

            return NextResponse.json(
                {
                    success: true,
                    data: {
                        checkoutUrl,
                        action: 'redirect_to_checkout',
                        codeBenefits: codeBenefits ? {
                            discountType: codeBenefits.discountType,
                            discountValue: codeBenefits.discountValue,
                            membershipUpgrade: codeBenefits.membershipUpgrade,
                        } : null,
                    },
                },
                { status: 200 }
            );
        } else {
            // Free upgrade: either free plan or 100% discount code (immediate activation)
            await updateUserMembership(user.id, newPlan.id, billingCycle);
            
            // Log to activity log for free upgrades
            try {
                await pool.query(
                    `INSERT INTO user_activity_log 
                     (user_id, activity_type, metadata)
                     VALUES ($1, $2, $3)`,
                    [
                        user.id,
                        'membership_upgrade_completed',
                        JSON.stringify({
                            targetPlan: finalPlanCode,
                            billingCycle,
                            promoCode: appliedCode || null,
                            isFreeUpgrade: true,
                            discountValue: codeBenefits?.discountValue || null,
                        })
                    ]
                );
            } catch (err) {
                console.error('Error logging to activity log:', err);
            }

            try {
                await createCodeNotification({ status: 'active', planName: newPlan.name });
            } catch (err) {
                console.error('Error creating code notification:', err);
            }
            
            // Track code usage if code was applied
            if (codeInfo) {
                try {
                    await incrementCodeUsage(codeInfo.id);
                    
                    // Record in user_code_usage for future reference
                    await pool.query(
                        `INSERT INTO user_code_usage (user_id, code_id, membership_id, membership_upgrade_to, applied_at)
                         VALUES ($1, $2, $3, $4, NOW())`,
                        [user.id, codeInfo.id, currentMembership?.id || null, finalPlanCode]
                    );
                } catch (err) {
                    console.error('Error tracking code usage:', err);
                    // Don't block upgrade if tracking fails
                }
            }
            
            const successMessage = isPromoGrant || is100PercentDiscount
                ? `Successfully upgraded to ${newPlan.name} plan with promo code! (Free upgrade)`
                : `Successfully changed to ${newPlan.name} plan`;
            
            console.log('[Upgrade] Free upgrade completed:', {
                userId: user.id,
                newPlan: newPlan.code,
                billingCycle,
                promoCode: appliedCode || null
            });
            
            return NextResponse.json(
                {
                    success: true,
                    data: { 
                        message: successMessage,
                        action: 'immediate_upgrade'
                    },
                },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error('[Membership Upgrade] Error:', error);
        return NextResponse.json(
            { error: 'Failed to upgrade membership' },
            { status: 500 }
        );
    }
}
