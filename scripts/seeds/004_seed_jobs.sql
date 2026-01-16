-- Seed Job Postings for Recruitment Features
-- Creates diverse aviation job opportunities linked to companies

-- Note: company_id is obtained by looking up company names
INSERT INTO jobs (
  company_id, title, description, requirements, location, job_type,
  experience_level, salary_min, salary_max, currency, benefits,
  application_deadline, status, posted_at, created_at, updated_at
) 
SELECT 
  c.id as company_id,
  job_data.title,
  job_data.description,
  job_data.requirements,
  job_data.location,
  job_data.job_type,
  job_data.experience_level,
  job_data.salary_min,
  job_data.salary_max,
  job_data.currency,
  job_data.benefits,
  job_data.application_deadline,
  job_data.status,
  job_data.posted_at,
  job_data.created_at,
  job_data.updated_at
FROM companies c
CROSS JOIN LATERAL (
  VALUES
    -- LATAM Airlines Jobs
    (
      'LATAM Airlines Group',
      'First Officer - Airbus A320',
      'Procuramos Primeiro Oficial experiente para operar aeronaves A320 em voos domésticos e internacionais. Responsabilidades incluem operação segura da aeronave, comunicação com ATC, e trabalho em equipe com comandante.',
      ARRAY['CPL/ATPL válido', 'Type Rating A320', 'Mínimo 1500 horas totais', '500 horas em Multi-Engine', 'Inglês ICAO nível 4+', 'CMA Classe 1 válido'],
      'São Paulo, SP - Base GRU',
      'full-time',
      'mid-level',
      18000.00,
      25000.00,
      'BRL',
      ARRAY['Plano de Saúde Premium', 'Vale Alimentação R$1200', 'Previdência Privada', '30 dias de férias', 'Descontos em passagens para família'],
      CURRENT_DATE + INTERVAL '45 days',
      'active',
      NOW() - INTERVAL '15 days',
      NOW() - INTERVAL '15 days',
      NOW()
    ),
    (
      'LATAM Airlines Group',
      'Captain - Boeing 777',
      'Buscamos Comandante experiente em widebody para liderar operações internacionais de longo curso. Experiência em gestão de tripulação e tomada de decisões críticas essencial.',
      ARRAY['ATPL válido', 'Type Rating B777', 'Mínimo 5000 horas totais', '1000 horas como PIC em widebody', 'Inglês ICAO nível 5+', 'CMA Classe 1 válido', 'Experiência em voos intercontinentais'],
      'São Paulo, SP - Base GRU',
      'full-time',
      'senior',
      35000.00,
      50000.00,
      'BRL',
      ARRAY['Plano de Saúde Premium', 'Bônus por Performance', 'Previdência Privada', 'Auxílio Moradia', 'Passagens ilimitadas para família'],
      CURRENT_DATE + INTERVAL '60 days',
      'active',
      NOW() - INTERVAL '10 days',
      NOW() - INTERVAL '10 days',
      NOW()
    ),
    
    -- Azul Airlines Jobs
    (
      'Azul Linhas Aéreas',
      'Pilot Trainee Program',
      'Programa de formação de pilotos para cadetes com PPL/CPL. Treinamento completo em A320neo com possibilidade de efetivação após conclusão.',
      ARRAY['CPL válido', 'Mínimo 200 horas totais', 'Inglês ICAO nível 4+', 'CMA Classe 1 válido', 'Menos de 30 anos', 'Disponibilidade para relocação'],
      'Campinas, SP - Base VCP',
      'full-time',
      'entry-level',
      8000.00,
      12000.00,
      'BRL',
      ARRAY['Treinamento pago pela empresa', 'Type Rating incluído', 'Assistência Médica', 'Vale Refeição', 'Progressão de carreira garantida'],
      CURRENT_DATE + INTERVAL '30 days',
      'active',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '5 days',
      NOW()
    ),
    (
      'Azul Linhas Aéreas',
      'Flight Dispatcher',
      'Responsável pelo planejamento e acompanhamento de voos, incluindo cálculos de combustível, rotas alternativas, e coordenação com tripulações.',
      ARRAY['Certificado de Despachante Operacional de Voo', 'Experiência mínima de 2 anos', 'Conhecimento em sistemas de planejamento de voo', 'Inglês intermediário', 'Disponibilidade para turnos'],
      'Campinas, SP - Centro de Operações',
      'full-time',
      'mid-level',
      6000.00,
      9000.00,
      'BRL',
      ARRAY['Assistência Médica', 'Vale Refeição R$800', 'PLR', 'Treinamento continuado'],
      CURRENT_DATE + INTERVAL '40 days',
      'active',
      NOW() - INTERVAL '20 days',
      NOW() - INTERVAL '20 days',
      NOW()
    ),
    
    -- GOL Airlines Jobs
    (
      'GOL Linhas Aéreas',
      'First Officer - Boeing 737-800',
      'Primeiro Oficial para B737-800 em voos domésticos. Ambiente dinâmico com foco em eficiência operacional.',
      ARRAY['CPL/ATPL válido', 'Type Rating B737', 'Mínimo 1500 horas totais', 'Inglês ICAO nível 4+', 'CMA Classe 1 válido'],
      'São Paulo, SP - Base CGH',
      'full-time',
      'mid-level',
      16000.00,
      22000.00,
      'BRL',
      ARRAY['Plano Médico e Dental', 'Vale Transporte', 'PPR', 'Descontos em passagens'],
      CURRENT_DATE + INTERVAL '50 days',
      'active',
      NOW() - INTERVAL '8 days',
      NOW() - INTERVAL '8 days',
      NOW()
    ),
    
    -- Executive Jets Brasil
    (
      'Executive Jets Brasil',
      'Corporate Pilot - Citation Latitude',
      'Piloto executivo para jatos Citation, atendendo clientes corporativos premium. Flexibilidade e discrição essenciais.',
      ARRAY['CPL/ATPL válido', 'Type Rating Citation (qualquer modelo)', 'Mínimo 2000 horas totais', '500 horas em jatos executivos', 'Inglês fluente', 'Apresentação impecável', 'Disponibilidade 24/7'],
      'São Paulo, SP - SBMT',
      'full-time',
      'mid-level',
      25000.00,
      35000.00,
      'BRL',
      ARRAY['Salário acima do mercado', 'Bônus por voo', 'Plano de Saúde Premium', 'Uniformes fornecidos', 'Treinamento internacional'],
      CURRENT_DATE + INTERVAL '35 days',
      'active',
      NOW() - INTERVAL '12 days',
      NOW() - INTERVAL '12 days',
      NOW()
    ),
    
    -- Helibras Jobs
    (
      'Helibras Helicopters',
      'Helicopter Pilot - EC225',
      'Piloto de helicóptero para operações offshore e transporte corporativo. Experiência em EC225 Super Puma preferencial.',
      ARRAY['PCH válido', 'Type Rating EC225 ou similar', 'Mínimo 1500 horas em helicópteros', 'Experiência offshore desejável', 'Inglês ICAO nível 4+', 'CMA Classe 1'],
      'Macaé, RJ - Base Offshore',
      'full-time',
      'mid-level',
      20000.00,
      28000.00,
      'BRL',
      ARRAY['Escala 15x15', 'Alojamento fornecido', 'Plano de Saúde', 'Seguro de Vida', 'Transporte'],
      CURRENT_DATE + INTERVAL '55 days',
      'active',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days',
      NOW()
    ),
    (
      'Helibras Helicopters',
      'Avionics Technician',
      'Técnico especializado em aviônicos para helicópteros, responsável por manutenção e troubleshooting de sistemas eletrônicos.',
      ARRAY['Certificado de Mecânico de Manutenção Aeronáutica (Aviônicos)', 'Experiência mínima de 3 anos', 'Conhecimento em Garmin, Honeywell', 'Inglês técnico'],
      'Itajubá, MG',
      'full-time',
      'mid-level',
      8000.00,
      12000.00,
      'BRL',
      ARRAY['Plano de Saúde', 'Vale Alimentação', 'Transporte Fretado', 'Auxílio Educação', 'PLR'],
      CURRENT_DATE + INTERVAL '40 days',
      'active',
      NOW() - INTERVAL '18 days',
      NOW() - INTERVAL '18 days',
      NOW()
    ),
    
    -- AeroClube SP Jobs
    (
      'AeroClube de São Paulo',
      'Certified Flight Instructor - CFI',
      'Instrutor de voo para cursos de PPL e CPL. Paixão por ensino e paciência com alunos iniciantes essenciais.',
      ARRAY['INVA válido', 'CPL com habilitação de Instrutor', 'Mínimo 500 horas de voo', '200 horas de instrução', 'Experiência em aeronaves monomotoras', 'Disponibilidade fins de semana'],
      'São Paulo, SP - Campo de Marte',
      'full-time',
      'mid-level',
      5000.00,
      8000.00,
      'BRL',
      ARRAY['Desconto em cursos avançados', 'Uso de aeronaves do clube', 'Networking na aviação', 'Eventos exclusivos'],
      CURRENT_DATE + INTERVAL '25 days',
      'active',
      NOW() - INTERVAL '22 days',
      NOW() - INTERVAL '22 days',
      NOW()
    ),
    
    -- TAM Aviação Executiva
    (
      'TAM Aviação Executiva',
      'Chief Pilot - Gulfstream Fleet',
      'Piloto-chefe responsável por gerenciar frota de Gulfstream, incluindo supervisão de tripulações, treinamento, e padrões operacionais.',
      ARRAY['ATPL válido', 'Type Rating Gulfstream (G450/G550/G650)', 'Mínimo 7000 horas totais', '2000 horas como PIC em jatos executivos', 'Experiência em gestão de equipes', 'Inglês fluente', 'Habilidades de liderança'],
      'São Paulo, SP - SBSP',
      'full-time',
      'executive',
      45000.00,
      65000.00,
      'BRL',
      ARRAY['Pacote salarial premium', 'Bônus anual', 'Plano de Saúde diferenciado', 'Carro executivo', 'Viagens internacionais'],
      CURRENT_DATE + INTERVAL '70 days',
      'active',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days',
      NOW()
    ),
    
    -- VASP Manutenção
    (
      'VASP Manutenção Aeronáutica',
      'Aircraft Mechanic - Airframe',
      'Mecânico de célula para manutenção preventiva e corretiva de aeronaves comerciais e executivas.',
      ARRAY['Certificado de Mecânico de Manutenção Aeronáutica (Célula)', 'Experiência mínima de 5 anos', 'Conhecimento em Boeing e Airbus', 'Inglês técnico', 'Disponibilidade para turnos'],
      'São Paulo, SP - GRU Airport',
      'full-time',
      'mid-level',
      7000.00,
      10000.00,
      'BRL',
      ARRAY['Plano de Saúde', 'Vale Refeição R$900', 'PLR', 'Treinamento técnico', 'Seguro de Vida'],
      CURRENT_DATE + INTERVAL '45 days',
      'active',
      NOW() - INTERVAL '14 days',
      NOW() - INTERVAL '14 days',
      NOW()
    ),
    (
      'VASP Manutenção Aeronáutica',
      'Quality Control Inspector',
      'Inspetor de qualidade responsável por auditorias de manutenção e conformidade com regulamentações ANAC/FAA.',
      ARRAY['Certificado de Mecânico ou Engenharia Aeronáutica', 'Experiência mínima de 7 anos em manutenção', 'Conhecimento em normativas RBAC/FAR', 'Atenção aos detalhes', 'Inglês avançado'],
      'São Paulo, SP',
      'full-time',
      'senior',
      12000.00,
      18000.00,
      'BRL',
      ARRAY['Plano de Saúde Premium', 'Vale Refeição', 'PLR Diferenciado', 'Certificações pagas pela empresa'],
      CURRENT_DATE + INTERVAL '50 days',
      'active',
      NOW() - INTERVAL '25 days',
      NOW() - INTERVAL '25 days',
      NOW()
    ),
    
    -- Embraer Jobs
    (
      'Embraer Executive Jets',
      'Test Pilot - Phenom Series',
      'Piloto de testes para desenvolvimento e certificação de aeronaves Phenom. Experiência em teste de voo essencial.',
      ARRAY['ATPL válido', 'Experiência como piloto de testes', 'Mínimo 3000 horas totais', 'Type Rating em jatos leves', 'Formação em Engenharia Aeronáutica desejável', 'Inglês fluente'],
      'São José dos Campos, SP',
      'full-time',
      'senior',
      30000.00,
      45000.00,
      'BRL',
      ARRAY['Salário competitivo internacional', 'Previdência Privada', 'PPR', 'Treinamento avançado', 'Orgulho de trabalhar na Embraer'],
      CURRENT_DATE + INTERVAL '65 days',
      'active',
      NOW() - INTERVAL '6 days',
      NOW() - INTERVAL '6 days',
      NOW()
    ),
    
    -- SkyDive Brasil
    (
      'SkyDive Brasil',
      'Jump Pilot - Caravan',
      'Piloto para operações de paraquedismo em Cessna Caravan. Ambiente descontraído e dinâmico.',
      ARRAY['CPL válido', 'Mínimo 500 horas totais', 'Experiência em Caravan desejável', 'Disponibilidade fins de semana', 'Espírito aventureiro'],
      'Boituva, SP',
      'part-time',
      'mid-level',
      3000.00,
      5000.00,
      'BRL',
      ARRAY['Ambiente descontraído', 'Flexibilidade de horários', 'Saltos gratuitos', 'Eventos e competições'],
      CURRENT_DATE + INTERVAL '20 days',
      'active',
      NOW() - INTERVAL '30 days',
      NOW() - INTERVAL '30 days',
      NOW()
    ),
    
    -- Helisul Jobs
    (
      'Helisul Táxi Aéreo',
      'Commercial Helicopter Pilot',
      'Piloto comercial para táxi aéreo e transporte executivo. Flexibilidade e atendimento ao cliente são essenciais.',
      ARRAY['PCH válido', 'Mínimo 1000 horas em helicópteros', 'Experiência em transporte executivo', 'Inglês intermediário', 'Disponibilidade total', 'Boa apresentação'],
      'Porto Alegre, RS',
      'full-time',
      'mid-level',
      15000.00,
      22000.00,
      'BRL',
      ARRAY['Salário + comissões', 'Plano de Saúde', 'Flexibilidade', 'Treinamento'],
      CURRENT_DATE + INTERVAL '30 days',
      'active',
      NOW() - INTERVAL '11 days',
      NOW() - INTERVAL '11 days',
      NOW()
    ),
    
    -- Aeromot Jobs
    (
      'Aeromot Aircraft',
      'Production Engineer - Aircraft Assembly',
      'Engenheiro de produção para linha de montagem de aeronaves leves. Foco em qualidade e eficiência.',
      ARRAY['Engenharia Mecânica/Aeronáutica', 'Experiência em manufatura aeronáutica', 'Conhecimento em Lean Manufacturing', 'Inglês técnico', 'Liderança de equipes'],
      'Porto Alegre, RS',
      'full-time',
      'mid-level',
      10000.00,
      15000.00,
      'BRL',
      ARRAY['Plano de Saúde', 'Vale Alimentação', 'PLR', 'Estacionamento', 'Ambiente industrial moderno'],
      CURRENT_DATE + INTERVAL '55 days',
      'active',
      NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '4 days',
      NOW()
    ),
    
    -- Some closed/filled positions for variety
    (
      'LATAM Airlines Group',
      'Captain - Airbus A320',
      'Comandante experiente para A320 em rotas domésticas. Vaga preenchida.',
      ARRAY['ATPL válido', 'Type Rating A320', 'Mínimo 3000 horas totais', '1000 horas como PIC'],
      'Rio de Janeiro, RJ',
      'full-time',
      'senior',
      28000.00,
      38000.00,
      'BRL',
      ARRAY['Plano de Saúde', 'Previdência Privada', 'Descontos em passagens'],
      CURRENT_DATE - INTERVAL '10 days',
      'filled',
      NOW() - INTERVAL '90 days',
      NOW() - INTERVAL '90 days',
      NOW() - INTERVAL '15 days'
    ),
    (
      'Azul Linhas Aéreas',
      'Flight Attendant - Domestic Routes',
      'Comissária de bordo para voos domésticos. Processo seletivo encerrado.',
      ARRAY['Ensino médio completo', 'Curso de Comissário ANAC', 'Inglês intermediário', 'Boa apresentação'],
      'Campinas, SP',
      'full-time',
      'entry-level',
      3500.00,
      5000.00,
      'BRL',
      ARRAY['Assistência Médica', 'Vale Refeição', 'Uniformes fornecidos'],
      CURRENT_DATE - INTERVAL '5 days',
      'closed',
      NOW() - INTERVAL '60 days',
      NOW() - INTERVAL '60 days',
      NOW() - INTERVAL '8 days'
    )
) AS job_data(
  company_name, title, description, requirements, location, job_type,
  experience_level, salary_min, salary_max, currency, benefits,
  application_deadline, status, posted_at, created_at, updated_at
)
WHERE c.name = job_data.company_name

ON CONFLICT DO NOTHING;

-- Output summary
SELECT 'Jobs seeded successfully!' as message, 
       COUNT(*) as total_jobs,
       COUNT(*) FILTER (WHERE status = 'active') as active_jobs,
       COUNT(*) FILTER (WHERE status = 'filled') as filled_jobs,
       COUNT(*) FILTER (WHERE status = 'closed') as closed_jobs
FROM jobs;
