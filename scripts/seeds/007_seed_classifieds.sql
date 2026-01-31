-- Seed Classifieds Listings (Aircraft, Parts, Avionics) with Photos

-- Use seeded users as sellers
WITH seed_users AS (
  SELECT id, email
  FROM users
  WHERE email IN (
    'admin@test.local',
    'carlos.silva@test.local',
    'maria.santos@test.local',
    'joao.oliveira@test.local',
    'roberto.costa@test.local',
    'ana.ferreira@test.local',
    'paulo.martins@test.local',
    'lucas.almeida@test.local',
    'juliana.rocha@test.local',
    'michael.johnson@test.local'
  )
),
aircraft_seed AS (
  SELECT
    su.id AS user_id,
    v.title,
    v.manufacturer,
    v.model,
    v.year,
    v.registration,
    v.serial_number,
    v.category,
    v.total_time,
    v.engine_time,
    v.price,
    v.location_city,
    v.location_state,
    v.location_country,
    v.description,
    v.avionics,
    v.interior_condition,
    v.exterior_condition,
    v.logs_status,
    v.damage_history,
    v.financing_available,
    v.partnership_available,
    v.status,
    v.featured,
    v.featured_until,
    v.views,
    v.inquiries_count,
    v.expires_at
  FROM (
    VALUES
      ('carlos.silva@test.local', 'Cessna 172N Skyhawk (1980)', 'Cessna', '172N', 1980, 'PT-ABC', '172N-8012', 'single-engine', 3850, 850, 650000.00, 'São Paulo', 'SP', 'BR',
       'Cessna 172N bem conservado, ideal para instrução e horas PIC.',
       'Garmin GNS 430, CDI, transponder Mode S', 'good', 'good', 'complete', false, true, false, 'active', true, NOW() + INTERVAL '14 days', 128, 6, NOW() + INTERVAL '30 days'),
      ('roberto.costa@test.local', 'Embraer Phenom 100 (2012)', 'Embraer', 'Phenom 100', 2012, 'PR-JET', '500-0321', 'light-jet', 1450, 620, 9800000.00, 'Campinas', 'SP', 'BR',
       'Jato leve executivo com manutenção em dia e interior impecável.',
       'Garmin G1000, TAWS, TCAS I', 'excellent', 'excellent', 'complete', false, true, true, 'active', true, NOW() + INTERVAL '21 days', 312, 14, NOW() + INTERVAL '45 days'),
      ('paulo.martins@test.local', 'Robinson R44 Raven II (2015)', 'Robinson', 'R44 Raven II', 2015, 'PR-HEL', 'R44-2431', 'helicopter', 980, 420, 2100000.00, 'Rio de Janeiro', 'RJ', 'BR',
       'Helicóptero versátil para turismo e operações executivas.',
       'GPS Garmin, rádio VHF, transponder', 'good', 'good', 'partial', false, false, false, 'active', false, NULL, 74, 2, NOW() + INTERVAL '20 days'),
      ('joao.oliveira@test.local', 'Piper PA-28 Archer (2001)', 'Piper', 'PA-28-181', 2001, 'PT-ARC', '2843111', 'single-engine', 2550, 620, 920000.00, 'Curitiba', 'PR', 'BR',
       'PA-28 com interior renovado e manutenção recente.',
       'Garmin 430W, intercom moderno', 'good', 'good', 'complete', false, false, false, 'active', false, NULL, 44, 1, NOW() + INTERVAL '25 days'),
      ('maria.santos@test.local', 'Beechcraft Baron G58 (2010)', 'Beechcraft', 'Baron G58', 2010, 'PT-BAR', 'TG-0188', 'twin-engine', 1900, 580, 6400000.00, 'Belo Horizonte', 'MG', 'BR',
       'Bimotor premium com ótimo desempenho e histórico impecável.',
       'Garmin G1000, radar meteorológico', 'excellent', 'excellent', 'complete', false, true, false, 'active', true, NOW() + INTERVAL '10 days', 205, 9, NOW() + INTERVAL '40 days'),
      ('ana.ferreira@test.local', 'Diamond DA42 Twin Star (2008)', 'Diamond', 'DA42', 2008, 'PT-DAA', '42-041', 'twin-engine', 2200, 540, 5200000.00, 'Porto Alegre', 'RS', 'BR',
       'DA42 com excelente autonomia e aviônicos modernos.',
       'Garmin G1000, anti-ice', 'good', 'good', 'complete', false, false, false, 'draft', false, NULL, 12, 0, NOW() + INTERVAL '30 days')
  ) AS v(
    email, title, manufacturer, model, year, registration, serial_number, category,
    total_time, engine_time, price, location_city, location_state, location_country,
    description, avionics, interior_condition, exterior_condition, logs_status,
    damage_history, financing_available, partnership_available, status, featured,
    featured_until, views, inquiries_count, expires_at
  )
  JOIN seed_users su ON su.email = v.email
)
INSERT INTO aircraft_listings (
  user_id, title, manufacturer, model, year, registration, serial_number, category,
  total_time, engine_time, price, location_city, location_state, location_country,
  description, avionics, interior_condition, exterior_condition, logs_status,
  damage_history, financing_available, partnership_available, status, featured,
  featured_until, views, inquiries_count, expires_at, created_at, updated_at
)
SELECT
  s.user_id, s.title, s.manufacturer, s.model, s.year, s.registration, s.serial_number, s.category,
  s.total_time, s.engine_time, s.price, s.location_city, s.location_state, s.location_country,
  s.description, s.avionics, s.interior_condition, s.exterior_condition, s.logs_status,
  s.damage_history, s.financing_available, s.partnership_available, s.status, s.featured,
  s.featured_until, s.views, s.inquiries_count, s.expires_at,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'
FROM aircraft_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM aircraft_listings a
  WHERE a.title = s.title AND a.user_id = s.user_id
);

WITH seed_users AS (
  SELECT id, email
  FROM users
  WHERE email IN (
    'admin@test.local',
    'carlos.silva@test.local',
    'maria.santos@test.local',
    'joao.oliveira@test.local',
    'roberto.costa@test.local',
    'ana.ferreira@test.local',
    'paulo.martins@test.local',
    'lucas.almeida@test.local',
    'juliana.rocha@test.local',
    'michael.johnson@test.local'
  )
),
parts_seed AS (
  SELECT
    su.id AS user_id,
    v.title,
    v.part_number,
    v.manufacturer,
    v.category,
    v.condition,
    v.time_since_overhaul,
    v.price,
    v.location_city,
    v.location_state,
    v.description,
    v.compatible_aircraft,
    v.has_certification,
    v.has_logbook,
    v.shipping_available,
    v.return_policy,
    v.status,
    v.featured,
    v.views
  FROM (
    VALUES
      ('paulo.martins@test.local', 'Cilindro Lycoming O-320', 'LW-10207', 'Lycoming', 'engine', 'used', 180, 18500.00, 'São Paulo', 'SP',
       'Cilindro revisado com histórico completo.', 'Cessna 172, Piper PA-28', true, true, true, 'Troca em até 7 dias', 'active', false, 32),
      ('ana.ferreira@test.local', 'Display Garmin G5', '010-01246-01', 'Garmin', 'instruments', 'new', NULL, 14500.00, 'Campinas', 'SP',
       'Display novo, pronto para instalação.', 'Vários modelos GA', true, true, true, 'Garantia de fábrica', 'active', true, 78),
      ('lucas.almeida@test.local', 'Pneu aeronáutico 6.00-6', '6006-AVI', 'Goodyear', 'landing-gear', 'new', NULL, 980.00, 'Rio de Janeiro', 'RJ',
       'Pneu novo para aviação geral.', 'Cessna 152/172', false, false, true, 'Sem devolução', 'active', false, 15),
      ('roberto.costa@test.local', 'Hélice McCauley 2 pás', '1C172/EM', 'McCauley', 'propeller', 'used', 120, 42000.00, 'Curitiba', 'PR',
       'Hélice com revisão recente e documentação.', 'Cessna 172', true, true, true, 'Troca em até 15 dias', 'active', false, 41),
      ('juliana.rocha@test.local', 'Kit estofamento cabine', 'INT-PA28', 'AeroTrim', 'interior', 'new', NULL, 8500.00, 'Belo Horizonte', 'MG',
       'Kit completo para renovação de interior.', 'Piper PA-28', true, false, true, 'Sem devolução', 'active', false, 8),
      ('paulo.martins@test.local', 'Conjunto de pinça de freio', 'BRAKE-SET-01', 'Cleveland', 'brakes', 'used', NULL, 6200.00, 'Porto Alegre', 'RS',
       'Conjunto revisado com pastilhas novas.', 'Beechcraft Baron', true, true, true, 'Troca em até 7 dias', 'active', false, 4)
  ) AS v(
    email, title, part_number, manufacturer, category, condition, time_since_overhaul, price,
    location_city, location_state, description, compatible_aircraft,
    has_certification, has_logbook, shipping_available, return_policy, status, featured, views
  )
  JOIN seed_users su ON su.email = v.email
)
INSERT INTO parts_listings (
  user_id, title, part_number, manufacturer, category, condition, time_since_overhaul, price,
  location_city, location_state, description, compatible_aircraft,
  has_certification, has_logbook, shipping_available, return_policy, status, featured,
  views, created_at, updated_at
)
SELECT
  s.user_id, s.title, s.part_number, s.manufacturer, s.category, s.condition, s.time_since_overhaul, s.price,
  s.location_city, s.location_state, s.description, s.compatible_aircraft,
  s.has_certification, s.has_logbook, s.shipping_available, s.return_policy, s.status, s.featured,
  s.views,
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'
FROM parts_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM parts_listings p
  WHERE p.title = s.title AND p.user_id = s.user_id
);

WITH seed_users AS (
  SELECT id, email
  FROM users
  WHERE email IN (
    'admin@test.local',
    'carlos.silva@test.local',
    'maria.santos@test.local',
    'joao.oliveira@test.local',
    'roberto.costa@test.local',
    'ana.ferreira@test.local',
    'paulo.martins@test.local',
    'lucas.almeida@test.local',
    'juliana.rocha@test.local',
    'michael.johnson@test.local'
  )
),
avionics_seed AS (
  SELECT
    su.id AS user_id,
    v.title,
    v.manufacturer,
    v.model,
    v.category,
    v.condition,
    v.software_version,
    v.tso_certified,
    v.panel_mount,
    v.price,
    v.location_city,
    v.location_state,
    v.description,
    v.compatible_aircraft,
    v.includes_installation,
    v.warranty_remaining,
    v.status,
    v.featured,
    v.views
  FROM (
    VALUES
      ('maria.santos@test.local', 'Garmin GTN 650Xi', 'Garmin', 'GTN 650Xi', 'navigation', 'new', 'v3.2', true, true, 92000.00, 'São Paulo', 'SP',
       'GPS/NAV/COM touchscreen com garantia.', 'Aeronaves GA', true, 'Garantia 12 meses', 'active', true, 96),
      ('carlos.silva@test.local', 'Autopiloto BendixKing KAP 140', 'BendixKing', 'KAP 140', 'autopilot', 'used', 'v2.1', false, true, 32000.00, 'Curitiba', 'PR',
       'Autopiloto revisado, funcionando perfeitamente.', 'Cessna 172/182', false, 'Garantia 90 dias', 'active', false, 54),
      ('roberto.costa@test.local', 'Transponder Garmin GTX 345', 'Garmin', 'GTX 345', 'transponder', 'new', 'v5.0', true, true, 41000.00, 'Campinas', 'SP',
       'ADS-B In/Out com instalação inclusa.', 'Aeronaves GA', true, 'Garantia 12 meses', 'active', false, 61),
      ('ana.ferreira@test.local', 'Avidyne IFD440', 'Avidyne', 'IFD440', 'navigation', 'used', 'v3.0', true, true, 68000.00, 'Belo Horizonte', 'MG',
       'Upgrade compatível com GNS 430.', 'Aeronaves GA', false, 'Garantia 6 meses', 'active', false, 33),
      ('michael.johnson@test.local', 'Aspen Evolution EFD1000', 'Aspen', 'EFD1000', 'display', 'used', 'v2.8', true, true, 56000.00, 'Rio de Janeiro', 'RJ',
       'Glass cockpit com excelente estado.', 'Piper PA-28, Beechcraft', false, 'Garantia 6 meses', 'active', false, 28),
      ('joao.oliveira@test.local', 'Painel de áudio PS Engineering', 'PS Engineering', 'PMA8000B', 'audio', 'used', 'v1.9', true, true, 18000.00, 'Porto Alegre', 'RS',
       'Painel de áudio com Bluetooth.', 'Aeronaves GA', false, 'Sem garantia', 'active', false, 5)
  ) AS v(
    email, title, manufacturer, model, category, condition, software_version, tso_certified, panel_mount, price,
    location_city, location_state, description, compatible_aircraft,
    includes_installation, warranty_remaining, status, featured, views
  )
  JOIN seed_users su ON su.email = v.email
)
INSERT INTO avionics_listings (
  user_id, title, manufacturer, model, category, condition, software_version, tso_certified, panel_mount, price,
  location_city, location_state, description, compatible_aircraft,
  includes_installation, warranty_remaining, status, featured, views, created_at, updated_at
)
SELECT
  s.user_id, s.title, s.manufacturer, s.model, s.category, s.condition, s.software_version, s.tso_certified, s.panel_mount, s.price,
  s.location_city, s.location_state, s.description, s.compatible_aircraft,
  s.includes_installation, s.warranty_remaining, s.status, s.featured, s.views,
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'
FROM avionics_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM avionics_listings a
  WHERE a.title = s.title AND a.user_id = s.user_id
);

-- Seed classified photos with a tiny placeholder image (1x1 PNG)
WITH photo_blob AS (
  SELECT decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1dSfkAAAAASUVORK5CYII=', 'base64') AS data
)
INSERT INTO classified_photos (
  listing_type, listing_id, photo_data, mime_type, file_name, file_size, is_primary, display_order, caption
)
SELECT
  'aircraft', a.id, photo_blob.data, 'image/png', 'placeholder.png', octet_length(photo_blob.data), true, 0, 'Foto principal'
FROM aircraft_listings a, photo_blob
WHERE a.title IN (
  'Cessna 172N Skyhawk (1980)',
  'Embraer Phenom 100 (2012)',
  'Robinson R44 Raven II (2015)',
  'Piper PA-28 Archer (2001)'
)
AND NOT EXISTS (
  SELECT 1 FROM classified_photos p
  WHERE p.listing_type = 'aircraft' AND p.listing_id = a.id AND p.file_name = 'placeholder.png'
);

WITH photo_blob AS (
  SELECT decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1dSfkAAAAASUVORK5CYII=', 'base64') AS data
)
INSERT INTO classified_photos (
  listing_type, listing_id, photo_data, mime_type, file_name, file_size, is_primary, display_order, caption
)
SELECT
  'parts', p.id, photo_blob.data, 'image/png', 'placeholder.png', octet_length(photo_blob.data), true, 0, 'Foto principal'
FROM parts_listings p, photo_blob
WHERE p.title IN (
  'Cilindro Lycoming O-320',
  'Display Garmin G5',
  'Pneu aeronáutico 6.00-6'
)
AND NOT EXISTS (
  SELECT 1 FROM classified_photos ph
  WHERE ph.listing_type = 'parts' AND ph.listing_id = p.id AND ph.file_name = 'placeholder.png'
);

WITH photo_blob AS (
  SELECT decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1dSfkAAAAASUVORK5CYII=', 'base64') AS data
)
INSERT INTO classified_photos (
  listing_type, listing_id, photo_data, mime_type, file_name, file_size, is_primary, display_order, caption
)
SELECT
  'avionics', a.id, photo_blob.data, 'image/png', 'placeholder.png', octet_length(photo_blob.data), true, 0, 'Foto principal'
FROM avionics_listings a, photo_blob
WHERE a.title IN (
  'Garmin GTN 650Xi',
  'Autopiloto BendixKing KAP 140',
  'Transponder Garmin GTX 345'
)
AND NOT EXISTS (
  SELECT 1 FROM classified_photos ph
  WHERE ph.listing_type = 'avionics' AND ph.listing_id = a.id AND ph.file_name = 'placeholder.png'
);

-- Output summary
SELECT 'Classifieds seeded successfully!' as message,
  (SELECT COUNT(*) FROM aircraft_listings) as aircraft,
  (SELECT COUNT(*) FROM parts_listings) as parts,
  (SELECT COUNT(*) FROM avionics_listings) as avionics,
  (SELECT COUNT(*) FROM classified_photos) as photos;
