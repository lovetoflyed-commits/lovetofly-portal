-- Insert test invitation and promotional codes
-- These are sample codes for testing the membership integration

-- Test invitation code (grants no upgrade, just tracks invites)
INSERT INTO codes (
    code_hash,
    code_hint,
    code_type,
    description,
    discount_type,
    discount_value,
    membership_plan_code,
    feature_flags,
    max_uses,
    valid_from,
    valid_until,
    is_active,
    created_at
) VALUES (
    '411c38633e60bd28d55e506291040ca6f8c049f9d2e7c2638623950d79d65c6c',
    'LFTTEST',
    'invite',
    'Test invitation code - no upgrade',
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    100,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- Test promotional code (grants 20% discount on any plan)
INSERT INTO codes (
    code_hash,
    code_hint,
    code_type,
    description,
    discount_type,
    discount_value,
    membership_plan_code,
    feature_flags,
    max_uses,
    valid_from,
    valid_until,
    is_active,
    created_at
) VALUES (
    'a421d94fb80d157897c3838b131e918f9182215d436df891841f5415bd2e09d5',
    'CPNSAVE',
    'promo',
    'Save 20% on any monthly subscription',
    'percent',
    20,
    NULL,
    '[]'::jsonb,
    500,
    NOW(),
    NOW() + INTERVAL '90 days',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- Test upgrade code (grants Premium tier)
INSERT INTO codes (
    code_hash,
    code_hint,
    code_type,
    description,
    discount_type,
    discount_value,
    membership_plan_code,
    feature_flags,
    max_uses,
    valid_from,
    valid_until,
    is_active,
    created_at
) VALUES (
    '1887e9b207cf4bc2b04bc1da357aeed99b6e5d2f0ae6585748fe86ea2b244470',
    'CPNPREM',
    'promo',
    'Upgrade to Premium tier for 3 months',
    NULL,
    NULL,
    'premium',
    '[]'::jsonb,
    50,
    NOW(),
    NOW() + INTERVAL '60 days',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- Test restricted code (only for specific domain)
INSERT INTO codes (
    code_hash,
    code_hint,
    code_type,
    description,
    discount_type,
    discount_value,
    membership_plan_code,
    eligible_domain,
    feature_flags,
    max_uses,
    valid_from,
    valid_until,
    is_active,
    created_at
) VALUES (
    'fbe3fba1e41a4a934a68539ab8a39186f20aea3d7160a28b5d25f14a03cc12b9',
    'CPNTEAM',
    'promo',
    'Special rate for airlineacademy.com employees',
    'percent',
    30,
    'standard',
    'airlineacademy.com',
    '[]'::jsonb,
    100,
    NOW(),
    NOW() + INTERVAL '180 days',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

SELECT COUNT(*) as total_test_codes FROM codes WHERE code_hint IN ('LFTTEST', 'CPNSAVE', 'CPNPREM', 'CPNTEAM');
