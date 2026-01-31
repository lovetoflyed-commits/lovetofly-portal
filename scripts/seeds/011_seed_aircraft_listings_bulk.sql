-- Seed bulk aircraft listings for classifieds expansion
-- Generates 200+ aircraft listings across Brazil

DO $$
BEGIN
  IF to_regclass('public.aircraft_listings') IS NOT NULL THEN
    WITH user_pool AS (
      SELECT id FROM users ORDER BY id
    ),
    city_pool AS (
      SELECT * FROM (VALUES
        ('São Paulo','SP'),
        ('Rio de Janeiro','RJ'),
        ('Belo Horizonte','MG'),
        ('Brasília','DF'),
        ('Curitiba','PR'),
        ('Porto Alegre','RS'),
        ('Florianópolis','SC'),
        ('Recife','PE'),
        ('Salvador','BA'),
        ('Fortaleza','CE'),
        ('Goiânia','GO'),
        ('Manaus','AM')
      ) AS c(city, state)
    )
    INSERT INTO aircraft_listings (
      user_id,
      title,
      manufacturer,
      model,
      year,
      registration,
      serial_number,
      category,
      total_time,
      engine_time,
      price,
      location_city,
      location_state,
      location_country,
      description,
      avionics,
      interior_condition,
      exterior_condition,
      logs_status,
      damage_history,
      financing_available,
      partnership_available,
      status,
      featured,
      views,
      inquiries_count,
      created_at,
      updated_at
    )
    SELECT
      (SELECT id FROM user_pool ORDER BY random() LIMIT 1),
      CONCAT(m.manufacturer, ' ', m.model, ' ', m.variant),
      m.manufacturer,
      m.model,
      (2000 + (g % 24))::int,
      CONCAT('PT-', LPAD((g % 9999)::text, 4, '0')),
      CONCAT('SN-', LPAD(g::text, 6, '0')),
      m.category,
      800 + (g % 5000),
      200 + (g % 2500),
      (500000 + (g % 120) * 75000)::numeric,
      c.city,
      c.state,
      'BR',
      'Aeronave em ótimo estado, manutenção em dia e pronta para operação.',
      'Garmin G1000 / GTN, ADS-B, transponder modo S.',
      CASE WHEN g % 3 = 0 THEN 'excellent' WHEN g % 3 = 1 THEN 'good' ELSE 'fair' END,
      CASE WHEN g % 4 = 0 THEN 'excellent' WHEN g % 4 = 1 THEN 'good' ELSE 'fair' END,
      'complete',
      (g % 10 = 0),
      (g % 5 = 0),
      (g % 7 = 0),
      'active',
      (g % 12 = 0),
      (g % 200),
      (g % 40),
      NOW() - ((g % 90) || ' days')::interval,
      NOW()
    FROM generate_series(1, 220) g
    CROSS JOIN LATERAL (
      VALUES
        ('Cessna','172','Skyhawk','piston'),
        ('Cessna','182','Skylane','piston'),
        ('Piper','PA-28','Archer','piston'),
        ('Piper','PA-34','Seneca','piston'),
        ('Beechcraft','King Air','C90','turboprop'),
        ('Embraer','Phenom','100','jet'),
        ('Embraer','Phenom','300','jet'),
        ('Honda','Jet','HA-420','jet'),
        ('Pilatus','PC-12','NGX','turboprop'),
        ('Cirrus','SR22','G6','piston')
    ) AS m(manufacturer, model, variant, category)
    CROSS JOIN LATERAL (SELECT * FROM city_pool ORDER BY random() LIMIT 1) c
    WHERE NOT EXISTS (
      SELECT 1 FROM aircraft_listings a
      WHERE a.registration = CONCAT('PT-', LPAD((g % 9999)::text, 4, '0'))
        AND a.model = m.model
    );
  END IF;
END $$;

SELECT 'Bulk aircraft listings seeded successfully!' as message,
  CASE WHEN to_regclass('public.aircraft_listings') IS NOT NULL THEN (SELECT COUNT(*) FROM aircraft_listings) ELSE 0 END as total_aircraft;
