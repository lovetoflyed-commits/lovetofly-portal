-- Seed additional hangar listings across Brazilian airports
-- Generates ~120 listings using existing owners and airport_icao data

DO $$
BEGIN
  IF to_regclass('public.hangar_listings') IS NOT NULL THEN
    WITH owners AS (
      SELECT id FROM hangar_owners ORDER BY id
    ),
    airports AS (
      SELECT icao_code, airport_name, city, state, country
      FROM airport_icao
      ORDER BY icao_code
    ),
    service_sets AS (
      SELECT * FROM (VALUES
        ('["WiFi","Segurança 24h","Lavagem"]'::jsonb),
        ('["Manutenção","Abastecimento","Hangar climatizado"]'::jsonb),
        ('["Hangar compartilhado","Vigilância","Sala de briefing"]'::jsonb),
        ('["Towing","Suporte solo","Limpeza"]'::jsonb)
      ) AS s(services)
    ),
    category_sets AS (
      SELECT * FROM (VALUES
        ('["piston","turboprop"]'::jsonb),
        ('["jet","turboprop"]'::jsonb),
        ('["piston","jet"]'::jsonb)
      ) AS c(categories)
    )
    INSERT INTO hangar_listings (
      owner_id,
      icao_code,
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
      daily_rate,
      monthly_rate,
      available_from,
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
      approval_status,
      status,
      photos,
      airport_icao,
      availability_status,
      payment_status
    )
    SELECT
      (SELECT id FROM owners ORDER BY random() LIMIT 1),
      a.icao_code,
      a.airport_name,
      a.city,
      a.state,
      a.country,
      CONCAT('HS-', LPAD(g::text, 3, '0')),
      CONCAT('Hangar localizado próximo ao pátio principal de ', a.airport_name, '.'),
      (120 + (g % 20) * 8)::numeric,
      (14 + (g % 6) * 1.5)::numeric,
      (12 + (g % 8) * 1.2)::numeric,
      (4 + (g % 4) * 0.5)::numeric,
      (SELECT categories FROM category_sets ORDER BY random() LIMIT 1),
      (600 + (g % 12) * 50)::numeric,
      (9000 + (g % 15) * 400)::numeric,
      CURRENT_DATE - (g % 14),
      true,
      '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"22:00"}}'::jsonb,
      (SELECT services FROM service_sets ORDER BY random() LIMIT 1),
      'Hangar com acesso controlado, equipe local e suporte básico em solo.',
      'Disponível para contratos mensais e trimestrais.',
      (g % 3 = 0),
      true,
      (g % 4 = 0),
      'flexible',
      CASE WHEN g % 6 = 0 THEN 'pending' ELSE 'verified' END,
      CASE WHEN g % 6 = 0 THEN 'pending_approval' ELSE 'approved' END,
      'active',
      JSONB_BUILD_ARRAY(CONCAT('/seed-assets/hangars/hangar-', ((g % 8) + 1), '.svg')),
      a.icao_code,
      'available',
      'unpaid'
    FROM generate_series(1, 120) g
    CROSS JOIN LATERAL (SELECT * FROM airports ORDER BY random() LIMIT 1) a
    WHERE NOT EXISTS (
      SELECT 1 FROM hangar_listings hl
      WHERE hl.icao_code = a.icao_code
        AND hl.hangar_number = CONCAT('HS-', LPAD(g::text, 3, '0'))
    );
  END IF;
END $$;

SELECT 'Bulk hangar listings seeded successfully!' as message,
  CASE WHEN to_regclass('public.hangar_listings') IS NOT NULL THEN (SELECT COUNT(*) FROM hangar_listings) ELSE 0 END as total_hangars;
