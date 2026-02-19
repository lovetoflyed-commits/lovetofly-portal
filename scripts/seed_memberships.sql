-- Seed Membership Plans
-- This script populates the membership_plans table with the 4-tier system

DELETE FROM membership_plans WHERE code IN ('free', 'standard', 'premium', 'pro');

INSERT INTO membership_plans (
    code, name, description, monthly_price, annual_price,
    annual_discount_percent, features, priority_support,
    max_users_allowed, max_projects, max_storage_gb,
    stripe_monthly_price_id, stripe_annual_price_id, is_active, created_at
) VALUES
(
    'free',
    'Free',
    'Perfect for getting started with Love to Fly',
    0,
    0,
    0,
    '["Basic flight logbook", "Weather access", "E6B calculator", "Community forum"]'::jsonb,
    false,
    1,
    3,
    1,
    NULL,
    NULL,
    true,
    NOW()
),
(
    'standard',
    'Standard',
    'For serious student pilots and hobbyists',
    9.99,
    99.99,
    17,
    '["Everything in Free", "Advanced flight logbook", "Flight planning tools", "Weather integration", "Mentorship connections", "Simulator access", "Classifieds marketplace"]'::jsonb,
    false,
    1,
    10,
    10,
    NULL,
    NULL,
    true,
    NOW()
),
(
    'premium',
    'Premium',
    'For professional pilots and flight schools',
    29.99,
    299.99,
    17,
    '["Everything in Standard", "Team management (up to 5 users)", "Advanced flight planning", "HangarShare listing tools", "Curriculum builder (for instructors)", "API access", "Priority support (email)", "Custom aircraft profiles"]'::jsonb,
    true,
    5,
    50,
    100,
    NULL,
    NULL,
    true,
    NOW()
),
(
    'pro',
    'Pro',
    'For flight operations, airlines, and large organizations',
    99.99,
    999.99,
    17,
    '["Everything in Premium", "Team management (unlimited users)", "WhiteLabel options", "Custom integrations", "Dedicated phone support", "SLA guarantee", "Training & onboarding", "Custom reports"]'::jsonb,
    true,
    999,
    999,
    1000,
    NULL,
    NULL,
    true,
    NOW()
);

SELECT COUNT(*) as total_plans FROM membership_plans;
