-- Seed Hangar Owners and Listings (minimal schema)

INSERT INTO hangar_owners (
  user_id,
  company_name,
  cnpj,
  phone,
  address,
  description,
  is_verified,
  verification_status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  owner_data.company_name,
  owner_data.cnpj,
  owner_data.phone,
  owner_data.address,
  owner_data.description,
  true,
  'verified',
  NOW() - INTERVAL '6 months',
  NOW()
FROM users u
JOIN (
  VALUES
    ('roberto.costa@test.local', 'Costa Aviation', '12.345.678/0001-90', '+55 11 95432-1098', 'São Paulo, SP', 'Operadora de hangares premium'),
    ('ana.ferreira@test.local', 'Ferreira Hangars', '98.765.432/0001-10', '+55 11 94321-0987', 'São Paulo, SP', 'Hangares executivos e compartilhados')
) AS owner_data(email, company_name, cnpj, phone, address, description)
  ON u.email = owner_data.email
WHERE NOT EXISTS (SELECT 1 FROM hangar_owners ho WHERE ho.user_id = u.id)
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO hangar_listings (
  owner_id,
  icao_code,
  airport_icao,
  aerodrome_name,
  city,
  state,
  country,
  hangar_number,
  hangar_location_description,
  hangar_size_sqm,
  max_wingspan_meters,
  max_length_meters,
  max_height_meters,
  accepted_aircraft_categories,
  hourly_rate,
  daily_rate,
  weekly_rate,
  monthly_rate,
  price_per_day,
  price_per_week,
  price_per_month,
  available_from,
  available_until,
  is_available,
  operating_hours,
  services,
  description,
  special_notes,
  accepts_online_payment,
  accepts_payment_on_arrival,
  accepts_payment_on_departure,
  cancellation_policy,
  verification_status,
  photos,
  status,
  approval_status,
  availability_status,
  created_at,
  updated_at
)
SELECT
  ho.id as owner_id,
  listing.icao_code,
  listing.icao_code,
  listing.aerodrome_name,
  listing.city,
  listing.state,
  'Brasil',
  listing.hangar_number,
  listing.hangar_location_description,
  listing.hangar_size_sqm,
  listing.max_wingspan_meters,
  listing.max_length_meters,
  listing.max_height_meters,
  listing.accepted_aircraft_categories,
  listing.hourly_rate,
  listing.daily_rate,
  listing.weekly_rate,
  listing.monthly_rate,
  listing.daily_rate,
  listing.weekly_rate,
  listing.monthly_rate,
  CURRENT_DATE - INTERVAL '15 days',
  NULL,
  true,
  listing.operating_hours,
  listing.services,
  listing.description,
  listing.special_notes,
  true,
  true,
  false,
  'flexible',
  'verified',
  listing.photos,
  'active',
  'approved',
  'available',
  NOW() - INTERVAL '2 months',
  NOW()
FROM hangar_owners ho
JOIN (
  VALUES
    ('roberto.costa@test.local', 'SBSP', 'Aeroporto de Congonhas', 'São Paulo', 'SP', 'H-01', 'Hangar premium próximo ao pátio executivo.', 250, 18.5, 16.0, 5.5, 280, 1200, 4800, 18000, '["jet","turboprop"]'::jsonb, '["WiFi","Segurança 24h","Lavagem"]'::jsonb, '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"22:00"}}'::jsonb, '["/seed-assets/hangars/hangar-1.svg"]'::jsonb, 'Hangar executivo com climatização e acesso rápido.', 'Preferência por contratos trimestrais.'),
    ('roberto.costa@test.local', 'SBGR', 'Aeroporto de Guarulhos', 'Guarulhos', 'SP', 'H-02', 'Hangar corporativo com acesso 24h.', 420, 24.0, 22.0, 7.0, 350, 1600, 6400, 24000, '["widebody","jet"]'::jsonb, '["Segurança","Estacionamento","Oficina"]'::jsonb, '{"mon":{"open":"00:00","close":"23:59"}}'::jsonb, '["/seed-assets/hangars/hangar-4.svg"]'::jsonb, 'Espaço para aeronaves de grande porte.', 'Necessário seguro ativo.'),
    ('ana.ferreira@test.local', 'SBKP', 'Aeroporto de Viracopos', 'Campinas', 'SP', 'H-07', 'Hangar compartilhado com suporte básico.', 90, 12.0, 11.0, 4.5, 120, 560, 2100, 7800, '["piston","turboprop"]'::jsonb, '["WiFi","Banheiro","Segurança"]'::jsonb, '{"mon":{"open":"08:00","close":"20:00"}}'::jsonb, '["/seed-assets/hangars/hangar-7.svg"]'::jsonb, 'Opção econômica para aviação geral.', 'Check-in com antecedência.'),
    ('ana.ferreira@test.local', 'SBRJ', 'Aeroporto Santos Dumont', 'Rio de Janeiro', 'RJ', 'H-11', 'Hangar executivo com vista para a baía.', 160, 15.0, 14.0, 5.0, 180, 800, 3200, 12000, '["jet","turboprop"]'::jsonb, '["WiFi","Sala VIP","Segurança"]'::jsonb, '{"mon":{"open":"07:00","close":"22:00"}}'::jsonb, '["/seed-assets/hangars/hangar-6.svg"]'::jsonb, 'Ideal para operações executivas no RJ.', 'Disponível mediante aprovação.')
) AS listing(email, icao_code, aerodrome_name, city, state, hangar_number, hangar_location_description, hangar_size_sqm, max_wingspan_meters, max_length_meters, max_height_meters, hourly_rate, daily_rate, weekly_rate, monthly_rate, accepted_aircraft_categories, services, operating_hours, photos, description, special_notes)
  ON (SELECT u.email FROM users u WHERE u.id = ho.user_id) = listing.email
WHERE NOT EXISTS (
  SELECT 1 FROM hangar_listings hl WHERE hl.owner_id = ho.id AND hl.hangar_number = listing.hangar_number
);

SELECT 'Hangar listings seeded successfully!' as message,
       COUNT(*) as total_listings,
       COUNT(*) FILTER (WHERE status = 'active') as active_listings
FROM hangar_listings;
