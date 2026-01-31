-- Seed additional job postings for Career marketplace
-- Generates 500+ realistic jobs across existing companies

DO $$
BEGIN
  IF to_regclass('public.jobs') IS NOT NULL THEN
    WITH company_pool AS (
      SELECT id, name
      FROM companies
      ORDER BY id
    ),
    job_templates AS (
      SELECT * FROM (VALUES
        ('First Officer', 'pilot', 'mid', 'airline'),
        ('Captain', 'pilot', 'senior', 'airline'),
        ('Flight Instructor', 'training', 'mid', 'training'),
        ('Maintenance Technician', 'maintenance', 'mid', 'maintenance'),
        ('Avionics Specialist', 'maintenance', 'mid', 'maintenance'),
        ('Dispatcher', 'operations', 'junior', 'airline'),
        ('Safety Analyst', 'safety', 'mid', 'airline'),
        ('Chief Pilot', 'pilot', 'executive', 'corporate'),
        ('Cabin Crew', 'crew', 'junior', 'airline'),
        ('Operations Coordinator', 'operations', 'mid', 'corporate')
      ) AS t(title_prefix, category, seniority_level, operation_type)
    ),
    locations AS (
      SELECT * FROM (VALUES
        ('São Paulo, SP'),
        ('Rio de Janeiro, RJ'),
        ('Belo Horizonte, MG'),
        ('Brasília, DF'),
        ('Curitiba, PR'),
        ('Porto Alegre, RS'),
        ('Florianópolis, SC'),
        ('Recife, PE'),
        ('Salvador, BA'),
        ('Fortaleza, CE'),
        ('Goiânia, GO'),
        ('Manaus, AM')
      ) AS l(base_location)
    )
    INSERT INTO jobs (
      company_id,
      title,
      category,
      seniority_level,
      base_location,
      operation_type,
      salary_min_usd,
      salary_max_usd,
      benefits_description,
      status,
      posted_at,
      created_at,
      updated_at
    )
    SELECT
      c.id,
      CONCAT(jt.title_prefix, ' - ', c.name),
      jt.category,
      jt.seniority_level,
      l.base_location,
      jt.operation_type,
      3000 + (g % 20) * 250,
      6000 + (g % 30) * 350,
      'Plano de saúde, vale alimentação, treinamento recorrente, bônus anual',
      CASE WHEN g % 12 = 0 THEN 'closed' WHEN g % 10 = 0 THEN 'filled' ELSE 'open' END,
      NOW() - ((g % 45) || ' days')::interval,
      NOW() - ((g % 45) || ' days')::interval,
      NOW()
    FROM generate_series(1, 520) AS g
    CROSS JOIN LATERAL (
      SELECT * FROM company_pool ORDER BY random() LIMIT 1
    ) c
    CROSS JOIN LATERAL (
      SELECT * FROM job_templates ORDER BY random() LIMIT 1
    ) jt
    CROSS JOIN LATERAL (
      SELECT * FROM locations ORDER BY random() LIMIT 1
    ) l
    WHERE NOT EXISTS (
      SELECT 1 FROM jobs j WHERE j.company_id = c.id AND j.title = CONCAT(jt.title_prefix, ' - ', c.name)
    );
  END IF;
END $$;

SELECT 'Bulk jobs seeded successfully!' as message,
  CASE WHEN to_regclass('public.jobs') IS NOT NULL THEN (SELECT COUNT(*) FROM jobs) ELSE 0 END as total_jobs;
