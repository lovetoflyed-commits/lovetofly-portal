-- Seed Companies Table (minimal schema)

INSERT INTO companies (name, created_at)
SELECT c.name, c.created_at
FROM (
  VALUES
    ('LATAM Airlines', NOW() - INTERVAL '3 years'),
    ('Azul Linhas Aéreas', NOW() - INTERVAL '2 years'),
    ('GOL Linhas Aéreas', NOW() - INTERVAL '4 years'),
    ('Embraer', NOW() - INTERVAL '5 years'),
    ('TAM Aviação Executiva', NOW() - INTERVAL '1 year'),
    ('Lider Aviação', NOW() - INTERVAL '18 months'),
    ('Escola de Aviação EAN', NOW() - INTERVAL '2 years'),
    ('Aeroclube de São Paulo', NOW() - INTERVAL '6 years'),
    ('MRO Brasil', NOW() - INTERVAL '3 years'),
    ('Helicópteros do Brasil', NOW() - INTERVAL '2 years'),
    ('ABSA Cargo', NOW() - INTERVAL '4 years'),
    ('Skylab Aviation', NOW() - INTERVAL '8 months')
) AS c(name, created_at)
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = c.name);

SELECT 'Companies seeded successfully!' as message, COUNT(*) as total_companies FROM companies;
