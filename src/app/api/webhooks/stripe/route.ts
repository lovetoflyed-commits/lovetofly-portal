import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import pool from '@/config/db';
import {
    handleStripeSubscriptionUpdate,
    getMembershipPlanByCode,
    recordBillingInvoice,
    getMembershipByStripeSubscriptionId,
    updateUserMembership
} from '@/utils/membershipUtils';
import { verifyWebhookSignature } from '@/utils/stripeUtils';
import { stripe } from '@/utils/stripeUtils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        const event = verifyWebhookSignature(body, signature, webhookSecret);
        if (!event) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        console.log(`[Webhook] Processing event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    try {
        console.log(`[Webhook] Processing completed checkout session: ${session.id}`);

        // Mark pending upgrade as completed
        const result = await pool.query(
            `UPDATE pending_membership_upgrades
             SET status = 'completed', completed_at = NOW(), updated_at = NOW()
             WHERE checkout_session_id = $1 AND status = 'pending'
             RETURNING user_id, target_plan_code, billing_cycle`,
            [session.id]
        );

        if (result.rows.length > 0) {
            const { user_id, target_plan_code, billing_cycle } = result.rows[0];
            console.log(`[Webhook] Marked pending upgrade as completed for user ${user_id}: ${target_plan_code} (${billing_cycle})`);

            // Log to activity log
            try {
                await pool.query(
                    `INSERT INTO user_activity_log 
                     (user_id, activity_type, metadata)
                     VALUES ($1, $2, $3)`,
                    [
                        user_id,
                        'membership_upgrade_completed',
                        JSON.stringify({
                            targetPlan: target_plan_code,
                            billingCycle: billing_cycle,
                            checkoutSessionId: session.id,
                        })
                    ]
                );
            } catch (err) {
                console.error('[Webhook] Error logging completion to activity log:', err);
            }
        } else {
            console.log(`[Webhook] No pending upgrade found for checkout session ${session.id}`);
        }
    } catch (error) {
        console.error('[Webhook] handleCheckoutSessionCompleted error:', error);
        // Don't throw - this is not critical enough to fail the webhook
    }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
    try {
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as any;

        const metadataUserId = subscription.metadata?.user_id || customer.metadata?.user_id;
        if (!metadataUserId) {
            console.warn(`[Webhook] No userId in metadata for subscription ${subscription.id}`);
            return;
        }

        const userId = parseInt(metadataUserId, 10);
        const planCode = (subscription.metadata?.planCode || subscription.metadata?.plan_code) as any;

        if (!planCode) {
            console.warn(`[Webhook] No planCode in subscription metadata for subscription ${subscription.id}`);
            return;
        }

        const plan = await getMembershipPlanByCode(planCode as any);
        if (!plan) {
            console.warn(`[Webhook] Plan not found for code: ${planCode}`);
            return;
        }

        const billingCycle = subscription.items.data[0]?.price?.recurring?.interval === 'year'
            ? 'annual'
            : 'monthly';

        const renewalDate = new Date((subscription as any).current_period_end * 1000);

        const existingMembership = await getMembershipByStripeSubscriptionId(subscription.id);

        if (!existingMembership) {
            await updateUserMembership(
                userId,
                plan.id,
                billingCycle,
                subscription.id,
                customerId
            );
        }

        await handleStripeSubscriptionUpdate(
            customerId,
            subscription.id,
            subscription.status,
            new Date((subscription as any).current_period_start * 1000),
            renewalDate
        );

        console.log(`[Webhook] Updated membership for user ${userId} - subscription ${subscription.id}`);
    } catch (error) {
        console.error('[Webhook] handleSubscriptionEvent error:', error);
        throw error;
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
        const userId = await resolveUserIdFromInvoice(invoice);
        if (!userId) {
            console.warn(`[Webhook] No userId for successful payment on invoice ${invoice.id}`);
            return;
        }

        await recordBillingInvoice(
            userId,
            invoice.id,
            invoice.amount_paid / 100,
            'paid',
            invoice.hosted_invoice_url || undefined,
            invoice.invoice_pdf || undefined
        );

        console.log(`[Webhook] Recorded invoice payment for user ${userId} - invoice ${invoice.id}`);
    } catch (error) {
        console.error('[Webhook] handleInvoicePaymentSucceeded error:', error);
        throw error;
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    try {
        const userId = await resolveUserIdFromInvoice(invoice);
        if (!userId) {
            console.warn(`[Webhook] No userId for failed payment on invoice ${invoice.id}`);
            return;
        }

        await recordBillingInvoice(
            userId,
            invoice.id,
            invoice.amount_due / 100,
            'failed',
            invoice.hosted_invoice_url || undefined,
            invoice.invoice_pdf || undefined
        );

        console.log(`[Webhook] Recorded failed invoice payment for user ${userId} - invoice ${invoice.id}`);
    } catch (error) {
        console.error('[Webhook] handleInvoicePaymentFailed error:', error);
        throw error;
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as any;

        const metadataUserId = subscription.metadata?.user_id || customer.metadata?.user_id;
        if (!metadataUserId) {
            console.warn(`[Webhook] No userId for deleted subscription ${subscription.id}`);
            return;
        }

        const userId = parseInt(metadataUserId, 10);
        await handleStripeSubscriptionUpdate(
            customerId,
            subscription.id,
            'cancelled'
        );

        console.log(`[Webhook] Cancelled membership for user ${userId} - subscription ${subscription.id}`);
    } catch (error) {
        console.error('[Webhook] handleSubscriptionDeleted error:', error);
        throw error;
    }
}

async function resolveUserIdFromInvoice(invoice: Stripe.Invoice): Promise<number | null> {
    const customerId = invoice.customer as string | null;
    if (customerId) {
        const customer = await stripe.customers.retrieve(customerId) as any;
        if (customer.metadata?.user_id) {
            return parseInt(customer.metadata.user_id, 10);
        }
    }

    const subscriptionId = (invoice as any).subscription as string | null;
    if (!subscriptionId) {
        return null;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription.metadata?.user_id) {
        return null;
    }

    return parseInt(subscription.metadata.user_id, 10);
}
