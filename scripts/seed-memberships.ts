#!/usr/bin/env node

/**
 * Seed Membership Plans Script
 * 
 * This script seeds the membership_plans table with the 4-tier membership system:
 * - Free
 * - Standard
 * - Premium
 * - Pro
 * 
 * It also creates corresponding Stripe products and prices if using test/live keys.
 * 
 * Run: npm run seed:memberships
 */

import pool from '@/config/db';
import Stripe from 'stripe';

const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION;

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY || '',
    STRIPE_API_VERSION ? { apiVersion: STRIPE_API_VERSION as any } : undefined
);

const MEMBERSHIP_PLANS = [
    {
        code: 'free',
        name: 'Free',
        description: 'Perfect for getting started with Love to Fly',
        monthlyPrice: 0,
        annualPrice: 0,
        features: [
            'Basic flight logbook',
            'Weather access',
            'E6B calculator',
            'Community forum',
        ],
        prioritySupport: false,
        maxUsersAllowed: 1,
        maxProjects: 3,
        maxStorageGb: 1,
    },
    {
        code: 'standard',
        name: 'Standard',
        description: 'For serious student pilots and hobbyists',
        monthlyPrice: 9.99,
        annualPrice: 99.99,
        annualDiscountPercent: 17,
        features: [
            'Everything in Free',
            'Advanced flight logbook',
            'Flight planning tools',
            'Weather integration',
            'Mentorship connections',
            'Simulator access',
            'Classifieds marketplace',
        ],
        prioritySupport: false,
        maxUsersAllowed: 1,
        maxProjects: 10,
        maxStorageGb: 10,
    },
    {
        code: 'premium',
        name: 'Premium',
        description: 'For professional pilots and flight schools',
        monthlyPrice: 29.99,
        annualPrice: 299.99,
        annualDiscountPercent: 17,
        features: [
            'Everything in Standard',
            'Team management (up to 5 users)',
            'Advanced flight planning',
            'HangarShare listing tools',
            'Curriculum builder (for instructors)',
            'API access',
            'Priority support (email)',
            'Custom aircraft profiles',
        ],
        prioritySupport: true,
        maxUsersAllowed: 5,
        maxProjects: 50,
        maxStorageGb: 100,
    },
    {
        code: 'pro',
        name: 'Pro',
        description: 'For flight operations, airlines, and large organizations',
        monthlyPrice: 99.99,
        annualPrice: 999.99,
        annualDiscountPercent: 17,
        features: [
            'Everything in Premium',
            'Team management (unlimited users)',
            'WhiteLabel options',
            'Custom integrations',
            'Dedicated phone support',
            'SLA guarantee',
            'Training & onboarding',
            'Custom reports',
        ],
        prioritySupport: true,
        maxUsersAllowed: 999,
        maxProjects: 999,
        maxStorageGb: 1000,
    },
];

async function seedMembershipPlans() {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting membership plans seed...\n');

        // Create Stripe products if we have a valid key
        const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
        const stripeProducts: Record<string, { monthlyPriceId: string; annualPriceId: string }> = {};

        if (hasStripeKey) {
            console.log('📱 Creating Stripe products...\n');

            for (const plan of MEMBERSHIP_PLANS) {
                const existing = await client.query(
                    `SELECT stripe_product_id, stripe_monthly_price_id, stripe_annual_price_id
                     FROM membership_plans WHERE code = $1 LIMIT 1`,
                    [plan.code]
                );
                const existingRow = existing.rows[0];
                if (existingRow?.stripe_monthly_price_id && existingRow?.stripe_annual_price_id) {
                    stripeProducts[plan.code] = {
                        monthlyPriceId: existingRow.stripe_monthly_price_id,
                        annualPriceId: existingRow.stripe_annual_price_id,
                    };
                    console.log(`⏭️  Using existing Stripe prices for ${plan.name}`);
                    continue;
                }

                if (plan.monthlyPrice === 0) {
                    console.log(`⏭️  Skipping Stripe product for ${plan.name} (free tier)`);
                    stripeProducts[plan.code] = { monthlyPriceId: '', annualPriceId: '' };
                    continue;
                }

                try {
                    // Create product
                    const product = await stripe.products.create({
                        name: `Love to Fly - ${plan.name}`,
                        description: plan.description,
                        metadata: {
                            planCode: plan.code,
                        },
                    });

                    // Create monthly price
                    const monthlyPrice = await stripe.prices.create({
                        product: product.id,
                        unit_amount: Math.round(plan.monthlyPrice * 100),
                        currency: 'brl',
                        recurring: {
                            interval: 'month',
                            interval_count: 1,
                        },
                    });

                    // Create annual price
                    const annualPrice = await stripe.prices.create({
                        product: product.id,
                        unit_amount: Math.round(plan.annualPrice * 100),
                        currency: 'brl',
                        recurring: {
                            interval: 'year',
                            interval_count: 1,
                        },
                    });

                    stripeProducts[plan.code] = {
                        monthlyPriceId: monthlyPrice.id,
                        annualPriceId: annualPrice.id,
                    };

                    console.log(`✅ Created Stripe product: ${plan.name}`);
                    console.log(`   → Monthly Price ID: ${monthlyPrice.id}`);
                    console.log(`   → Annual Price ID: ${annualPrice.id}\n`);
                } catch (error) {
                    console.error(`❌ Error creating Stripe product for ${plan.name}:`, error);
                    stripeProducts[plan.code] = { monthlyPriceId: '', annualPriceId: '' };
                }
            }
        } else if (!process.env.STRIPE_SECRET_KEY) {
            console.log(
                '⚠️  STRIPE_SECRET_KEY not found. Stripe products will not be created.\n' +
                'ℹ️  You can create them manually in the Stripe Dashboard later.\n'
            );
        }

        // Insert membership plans (upsert)
        console.log('💾 Upserting membership plans into database...\n');

        for (const plan of MEMBERSHIP_PLANS) {
            const priceIds = stripeProducts[plan.code] || { monthlyPriceId: '', annualPriceId: '' };

            await client.query(
                `
                INSERT INTO membership_plans (
                    code, name, description, monthly_price, annual_price,
                    annual_discount_percent, features, priority_support,
                    max_users_allowed, max_projects, max_storage_gb,
                    stripe_monthly_price_id, stripe_annual_price_id, is_active, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    monthly_price = EXCLUDED.monthly_price,
                    annual_price = EXCLUDED.annual_price,
                    annual_discount_percent = EXCLUDED.annual_discount_percent,
                    features = EXCLUDED.features,
                    priority_support = EXCLUDED.priority_support,
                    max_users_allowed = EXCLUDED.max_users_allowed,
                    max_projects = EXCLUDED.max_projects,
                    max_storage_gb = EXCLUDED.max_storage_gb,
                    stripe_monthly_price_id = EXCLUDED.stripe_monthly_price_id,
                    stripe_annual_price_id = EXCLUDED.stripe_annual_price_id,
                    is_active = true,
                    updated_at = NOW()
                `,
                [
                    plan.code,
                    plan.name,
                    plan.description,
                    plan.monthlyPrice,
                    plan.annualPrice,
                    plan.annualDiscountPercent || 0,
                    JSON.stringify(plan.features),
                    plan.prioritySupport,
                    plan.maxUsersAllowed,
                    plan.maxProjects,
                    plan.maxStorageGb,
                    priceIds.monthlyPriceId || null,
                    priceIds.annualPriceId || null,
                ]
            );

            console.log(`✅ Inserted plan: ${plan.name}`);
        }

        console.log('\n🎉 Membership plans successfully seeded!');
        console.log('\nℹ️  Next steps:');
        console.log('1. Add Stripe webhook endpoint: https://dashboard.stripe.com/webhooks');
        console.log(`   URL: ${process.env.WEBHOOK_URL || 'https://yoursite.com/api/webhooks/stripe'}`);
        console.log('2. Test Stripe integration with test credit cards');
        console.log('3. Update environment variables with live Stripe keys when ready');

    } catch (error) {
        console.error('❌ Error seeding membership plans:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedMembershipPlans();
