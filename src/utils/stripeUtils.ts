import Stripe from 'stripe';

const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || undefined;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (stripeClient) {
        return stripeClient;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        throw new Error('Missing STRIPE_SECRET_KEY');
    }

    stripeClient = new Stripe(
        stripeSecretKey,
        STRIPE_API_VERSION ? { apiVersion: STRIPE_API_VERSION as any } : undefined
    );

    return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        const client = getStripeClient() as any;
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

export interface StripeProductConfig {
    code: 'free' | 'standard' | 'premium' | 'pro';
    name: string;
    monthlyPrice: number | null; // in cents
    annualPrice: number | null;
    description: string;
}

export interface CreateCheckoutSessionOptions {
    userId: number;
    userEmail: string;
    priceId: string;
    planCode: string;
    billingCycle: 'monthly' | 'annual';
    currentSubscriptionId?: string | null;
    customerId?: string | null;
    stripeCouponId?: string | null;
    stripePromotionCodeId?: string | null;
    codeId?: number | null;
}

export interface CreateStripeCouponOptions {
    discountType: 'percent' | 'fixed';
    discountValue: number;
    currency?: string;
}

/**
 * Create a Stripe product and price objects
 * Should be run once during setup
 */
export async function createStripeProduct(config: StripeProductConfig) {
    try {
        // Create product
        const product = await stripe.products.create({
            name: config.name,
            description: config.description,
            metadata: {
                plan_code: config.code,
            },
        });

        let monthlyPriceId: string | null = null;
        let annualPriceId: string | null = null;

        // Create monthly price if applicable
        if (config.monthlyPrice !== null && config.monthlyPrice > 0) {
            const monthlyPrice = await stripe.prices.create({
                product: product.id,
                unit_amount: config.monthlyPrice,
                currency: 'usd',
                recurring: {
                    interval: 'month',
                    interval_count: 1,
                },
                metadata: {
                    billing_cycle: 'monthly',
                },
            });
            monthlyPriceId = monthlyPrice.id;
        }

        // Create annual price if applicable
        if (config.annualPrice !== null && config.annualPrice > 0) {
            const annualPrice = await stripe.prices.create({
                product: product.id,
                unit_amount: config.annualPrice,
                currency: 'usd',
                recurring: {
                    interval: 'year',
                    interval_count: 1,
                },
                metadata: {
                    billing_cycle: 'annual',
                },
            });
            annualPriceId = annualPrice.id;
        }

        return {
            stripeProductId: product.id,
            stripeMonthlyPriceId: monthlyPriceId,
            stripeAnnualPriceId: annualPriceId,
        };
    } catch (error) {
        console.error('Error creating Stripe product:', error);
        throw error;
    }
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(options: CreateCheckoutSessionOptions) {
    const {
        userId,
        userEmail,
        priceId,
        planCode,
        billingCycle,
        currentSubscriptionId,
        customerId,
        stripeCouponId,
        stripePromotionCodeId,
        codeId,
    } = options;

    try {
        const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`;

        const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
        if (stripePromotionCodeId) {
            discounts.push({ promotion_code: stripePromotionCodeId });
        } else if (stripeCouponId) {
            discounts.push({ coupon: stripeCouponId });
        }

        const subscriptionMetadata: Record<string, string> = {
            user_id: userId.toString(),
            plan_code: planCode,
            billing_cycle: billingCycle,
        };

        if (codeId) {
            subscriptionMetadata.code_id = codeId.toString();
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId || undefined,
            customer_email: customerId ? undefined : userEmail,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            discounts: discounts.length ? discounts : undefined,
            subscription_data: {
                metadata: subscriptionMetadata,
            },
            metadata: {
                user_id: userId.toString(),
                plan_code: planCode,
                billing_cycle: billingCycle,
            },
        });

        return session.url || '';
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

/**
 * Create a Stripe coupon for a discount
 */
export async function createStripeCoupon(options: CreateStripeCouponOptions) {
    const { discountType, discountValue, currency = 'usd' } = options;

    try {
        if (discountType === 'percent') {
            return await stripe.coupons.create({
                percent_off: discountValue,
                duration: 'once',
            });
        }

        return await stripe.coupons.create({
            amount_off: Math.round(discountValue * 100),
            currency,
            duration: 'once',
        });
    } catch (error) {
        console.error('Error creating Stripe coupon:', error);
        throw error;
    }
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(email: string, name?: string, userId?: number) {
    try {
        const customer = await stripe.customers.create({
            email,
            name: name || undefined,
            metadata: {
                user_id: userId?.toString() || '',
            },
        });

        return customer.id;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
}

/**
 * Get Stripe customer by ID
 */
export async function getStripeCustomer(customerId: string) {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        return customer;
    } catch (error) {
        console.error('Error retrieving Stripe customer:', error);
        throw error;
    }
}

/**
 * Create portal session for billing management
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return session.url;
    } catch (error) {
        console.error('Error creating billing portal session:', error);
        throw error;
    }
}

/**
 * Cancel subscription
 */
export async function cancelStripeSubscription(subscriptionId: string) {
    try {
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}

/**
 * Update subscription items (for upgrades/downgrades)
 */
export async function updateSubscription(subscriptionId: string, newPriceId: string) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        if (!subscription.items.data.length) {
            throw new Error('No items in subscription');
        }

        // Remove old item, add new
        const updated = await stripe.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscription.items.data[0].id,
                    deleted: true,
                },
                {
                    price: newPriceId,
                },
            ],
            proration_behavior: 'create_prorations',
        });

        return updated;
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

/**
 * List subscription invoices
 */
export async function getSubscriptionInvoices(subscriptionId: string) {
    try {
        const invoices = await stripe.invoices.list({
            subscription: subscriptionId,
            limit: 10,
        });

        return invoices.data;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    body: string | Buffer,
    signature: string,
    secret: string
): Stripe.Event {
    try {
        const event = stripe.webhooks.constructEvent(body, signature, secret);
        return event;
    } catch (error) {
        console.error('Webhook verification failed:', error);
        throw error;
    }
}
