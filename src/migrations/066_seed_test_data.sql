-- Seed realistic test data (schema-safe)

-- Users: only allowed plans (free, pro, premium)
INSERT INTO users (first_name, last_name, email, password_hash, plan, created_at, updated_at)
VALUES
('Carlos', 'Silva', 'carlos@lovetofly.com.br', '$2b$10$abc', 'pro', NOW() - INTERVAL '180 days', NOW()),
('Maria', 'Santos', 'maria@lovetofly.com.br', '$2b$10$abc', 'pro', NOW() - INTERVAL '150 days', NOW()),
('Joao', 'Oliveira', 'joao.owner@email.com', '$2b$10$abc', 'premium', NOW() - INTERVAL '120 days', NOW()),
('Pedro', 'Costa', 'pedro.owner@email.com', '$2b$10$abc', 'premium', NOW() - INTERVAL '100 days', NOW()),
('Ana', 'Ferreira', 'ana.owner@email.com', '$2b$10$abc', 'premium', NOW() - INTERVAL '90 days', NOW()),
('Lucas', 'Pereira', 'lucas@email.com', '$2b$10$abc', 'free', NOW() - INTERVAL '60 days', NOW()),
('Fernanda', 'Gomes', 'fernanda@email.com', '$2b$10$abc', 'free', NOW() - INTERVAL '50 days', NOW()),
('Ricardo', 'Martins', 'ricardo@email.com', '$2b$10$abc', 'pro', NOW() - INTERVAL '40 days', NOW()),
('Beatriz', 'Alves', 'beatriz@email.com', '$2b$10$abc', 'free', NOW() - INTERVAL '30 days', NOW()),
('Diego', 'Rocha', 'diego@email.com', '$2b$10$abc', 'premium', NOW() - INTERVAL '20 days', NOW()),
('Carolina', 'Lima', 'carolina@email.com', '$2b$10$abc', 'free', NOW() - INTERVAL '10 days', NOW()),
('Gabriel', 'Neves', 'gabriel@email.com', '$2b$10$abc', 'pro', NOW() - INTERVAL '5 days', NOW()),
('Isabella', 'Campos', 'isabella@email.com', '$2b$10$abc', 'pro', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (email) DO NOTHING;

-- Hangar owners: required columns only
INSERT INTO hangar_owners (id, user_id, company_name, cnpj, is_verified, created_at, updated_at, owner_type, cpf, pix_key, pix_key_type)
SELECT gen_random_uuid(), u.id, 'SkyHoldings Ltd', '12345678000199', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', 'company', '11122233344', 'joao@pix', 'email'
FROM users u WHERE u.email = 'joao.owner@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO hangar_owners (id, user_id, company_name, cnpj, is_verified, created_at, updated_at, owner_type, cpf, pix_key, pix_key_type)
SELECT gen_random_uuid(), u.id, 'Costa Aviation', '98765432000155', false, NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', 'company', '22233344455', 'pedro@pix', 'email'
FROM users u WHERE u.email = 'pedro.owner@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO hangar_owners (id, user_id, company_name, cnpj, is_verified, created_at, updated_at, owner_type, cpf, pix_key, pix_key_type)
SELECT gen_random_uuid(), u.id, 'Ferreira Aero', '10203040000188', false, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', 'company', '33344455566', 'ana@pix', 'email'
FROM users u WHERE u.email = 'ana.owner@email.com'
ON CONFLICT DO NOTHING;

-- Hangar listings: status allowed (active, inactive, pending, rejected, suspended)
INSERT INTO hangar_listings (
  owner_id, icao_code, aerodrome_name, city, state, country, hangar_number,
  size_sqm, max_wingspan, max_length, max_height,
  daily_rate, weekly_rate, monthly_rate, description,
  is_available, status, created_at, updated_at, image_url, hourly_rate,
  available_from, available_until, accepts_online_payment, accepts_payment_on_arrival,
  accepts_payment_on_departure, cancellation_policy, hangar_location_description,
  special_notes, total_spaces, available_spaces, space_description
)
SELECT
  ho.id, 'SBSP', 'Congonhas', 'Sao Paulo', 'SP', 'BR', 'A1',
  500, 35, 40, 12,
  500, 3000, 12000, 'Premium facility with full services',
  true, 'active', NOW() - INTERVAL '70 days', NOW() - INTERVAL '10 days', 'https://example.com/hangar1.jpg', 120,
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '180 days', true, false,
  true, 'flexible', 'Prime location near terminal',
  'Includes lounge and fuel service', 10, 8, 'Supports mid-size jets'
FROM hangar_owners ho
JOIN users u ON ho.user_id = u.id
WHERE u.email = 'joao.owner@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO hangar_listings (
  owner_id, icao_code, aerodrome_name, city, state, country, hangar_number,
  size_sqm, max_wingspan, max_length, max_height,
  daily_rate, weekly_rate, monthly_rate, description,
  is_available, status, created_at, updated_at, image_url, hourly_rate,
  available_from, available_until, accepts_online_payment, accepts_payment_on_arrival,
  accepts_payment_on_departure, cancellation_policy, hangar_location_description,
  special_notes, total_spaces, available_spaces, space_description
)
SELECT
  ho.id, 'SBSP', 'Congonhas', 'Sao Paulo', 'SP', 'BR', 'B1',
  600, 38, 42, 13,
  550, 3200, 13000, 'Executive hangar with restaurant access',
  true, 'active', NOW() - INTERVAL '65 days', NOW() - INTERVAL '8 days', 'https://example.com/hangar2.jpg', 130,
  NOW() - INTERVAL '2 days', NOW() + INTERVAL '160 days', true, true,
  true, 'moderate', 'Close to main apron',
  'Includes briefing room', 12, 10, 'Twin engine friendly'
FROM hangar_owners ho
JOIN users u ON ho.user_id = u.id
WHERE u.email = 'pedro.owner@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO hangar_listings (
  owner_id, icao_code, aerodrome_name, city, state, country, hangar_number,
  size_sqm, max_wingspan, max_length, max_height,
  daily_rate, weekly_rate, monthly_rate, description,
  is_available, status, created_at, updated_at, image_url, hourly_rate,
  available_from, available_until, accepts_online_payment, accepts_payment_on_arrival,
  accepts_payment_on_departure, cancellation_policy, hangar_location_description,
  special_notes, total_spaces, available_spaces, space_description
)
SELECT
  ho.id, 'SBSP', 'Congonhas', 'Sao Paulo', 'SP', 'BR', 'C1',
  700, 40, 50, 15,
  700, 4000, 18000, 'Luxury facility with lounge and maintenance team',
  true, 'pending', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', 'https://example.com/hangar3.jpg', 160,
  NOW(), NOW() + INTERVAL '200 days', true, true,
  false, 'strict', 'Brooklin access gate',
  'Awaiting final approval', 14, 12, 'Large jet capable'
FROM hangar_owners ho
JOIN users u ON ho.user_id = u.id
WHERE u.email = 'ana.owner@email.com'
ON CONFLICT DO NOTHING;

-- Bookings: insert into base table hangar_bookings (view bookings is read-only)
INSERT INTO hangar_bookings (
  id, hangar_id, user_id, check_in, check_out, nights,
  subtotal, fees, total_price, status, payment_method,
  stripe_payment_intent_id, booking_type, refund_policy_applied,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  hl.id,
  u.id,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '20 days',
  5,
  2500, 0, 2500,
  'completed', 'card',
  'pi_test_1', 'daily', 'flexible',
  NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'
FROM hangar_listings hl
JOIN users u ON u.email = 'lucas@email.com'
WHERE hl.hangar_number = 'A1'
LIMIT 1;

INSERT INTO hangar_bookings (
  id, hangar_id, user_id, check_in, check_out, nights,
  subtotal, fees, total_price, status, payment_method,
  stripe_payment_intent_id, booking_type, refund_policy_applied,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  hl.id,
  u.id,
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '12 days',
  7,
  4550, 0, 4550,
  'pending', 'card',
  'pi_test_2', 'weekly', 'moderate',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
FROM hangar_listings hl
JOIN users u ON u.email = 'beatriz@email.com'
WHERE hl.hangar_number = 'B1'
LIMIT 1;

INSERT INTO hangar_bookings (
  id, hangar_id, user_id, check_in, check_out, nights,
  subtotal, fees, total_price, status, payment_method,
  stripe_payment_intent_id, booking_type, refund_policy_applied,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  hl.id,
  u.id,
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '25 days',
  10,
  7000, 0, 7000,
  'pending', 'card',
  'pi_test_3', 'weekly', 'strict',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
FROM hangar_listings hl
JOIN users u ON u.email = 'diego@email.com'
WHERE hl.hangar_number = 'C1'
LIMIT 1;
