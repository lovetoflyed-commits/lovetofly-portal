-- Migration: Add diverse hangars for testing booking and pricing calculations
-- Description: 15+ hangars with varied pricing models (hourly, daily, weekly, monthly, annual)

-- Add more airports for diversity
INSERT INTO airport_icao (icao_code, iata_code, airport_name, city, state, country, latitude, longitude, is_public, has_facilities) VALUES
('SBKP', 'VCP', 'Viracopos/Campinas', 'Campinas', 'SP', 'Brasil', -23.007222, -47.134444, true, true),
('SBCT', 'CWB', 'Curitiba/Afonso Pena', 'Curitiba', 'PR', 'Brasil', -25.528333, -49.175833, true, true),
('SBPA', 'POA', 'Porto Alegre/Salgado Filho', 'Porto Alegre', 'RS', 'Brasil', -29.994444, -51.171389, true, true),
('SBSV', 'SSA', 'Salvador/Dep. Luís Eduardo Magalhães', 'Salvador', 'BA', 'Brasil', -12.908611, -38.331111, true, true),
('SBRF', 'REC', 'Recife/Guararapes', 'Recife', 'PE', 'Brasil', -8.126389, -34.923056, true, true),
('SBRP', 'RAO', 'Ribeirão Preto/Leite Lopes', 'Ribeirão Preto', 'SP', 'Brasil', -21.134167, -47.774167, true, true),
('SBJV', 'JOI', 'Joinville/Lauro Carneiro de Loyola', 'Joinville', 'SC', 'Brasil', -26.224444, -48.797500, true, true),
('SBLO', 'LDB', 'Londrina/Governador José Richa', 'Londrina', 'PR', 'Brasil', -23.333611, -51.130139, true, true),
('SBMG', 'MGF', 'Maringá/Sílvio Name Júnior', 'Maringá', 'PR', 'Brasil', -23.479167, -52.012222, false, true),
('SBCX', 'CXJ', 'Caxias do Sul/Hugo Cantergiani', 'Caxias do Sul', 'RS', 'Brasil', -29.197056, -51.187500, false, true)
ON CONFLICT (icao_code) DO UPDATE SET
  airport_name = EXCLUDED.airport_name,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  updated_at = CURRENT_TIMESTAMP;

-- Insert diverse hangar listings
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
  hourly_rate,
  daily_rate,
  weekly_rate,
  monthly_rate,
  available_from,
  available_until,
  is_available,
  operating_hours,
  services,
  description,
  special_notes,
  accepts_online_payment,
  accepts_payment_on_arrival,
  photos,
  status
) VALUES 

-- 1. SBKP - Hangar econômico (APENAS DIÁRIA)
(
  1, 'SBKP', 'Viracopos/Campinas', 'Campinas', 'SP', 'Brasil',
  'H-1', 'Próximo ao pátio de aviação geral',
  80.00, 12.00, 10.00, 4.00,
  '["monomotor"]'::jsonb,
  NULL, 150.00, 900.00, 3200.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '6 months'),
  true,
  '{"monday": {"open": "07:00", "close": "19:00"}, "tuesday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "friday": {"open": "07:00", "close": "19:00"}, "saturday": {"open": "08:00", "close": "16:00"}, "sunday": "closed"}'::jsonb,
  '["eletricidade", "iluminacao", "seguranca"]'::jsonb,
  'Hangar econômico ideal para estacionamento diário de monomotores pequenos. Estrutura simples mas segura.',
  'Ideal para pernoite ou curta duração. Acesso durante horário comercial.',
  false, true, '[]'::jsonb, 'active'
),

-- 2. SBKP - Hangar com COBRANÇA HORÁRIA (ultraleve/helicóptero)
(
  1, 'SBKP', 'Viracopos/Campinas', 'Campinas', 'SP', 'Brasil',
  'H-UL1', 'Área de ultraleves, lateral norte',
  50.00, 10.00, 8.00, 3.50,
  '["ultralight", "helicopter"]'::jsonb,
  25.00, 180.00, 1050.00, 3800.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "22:00"}}'::jsonb,
  '["eletricidade", "seguranca24h"]'::jsonb,
  'Hangar especializado para ultraleves e helicópteros. Cobrança por hora para paradas rápidas.',
  'Perfeito para voos de instrução. Mínimo 2 horas. Desconto para pacotes de 10+ horas.',
  true, true, '[]'::jsonb, 'active'
),

-- 3. SBCT - Hangar premium (TODAS AS OPÇÕES)
(
  1, 'SBCT', 'Curitiba/Afonso Pena', 'Curitiba', 'PR', 'Brasil',
  'H-VIP', 'Terminal executivo, acesso direto à pista',
  250.00, 22.00, 18.00, 7.00,
  '["executive", "jet", "bimotor", "monomotor"]'::jsonb,
  80.00, 600.00, 3600.00, 12000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 years'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "lounge_vip"]'::jsonb,
  'Hangar premium de alto padrão. Capacidade para jatos executivos até médio porte. Infraestrutura VIP completa com lounge, sala de reuniões e serviço de concierge.',
  'Operação 24/7. Valet service incluído. Desconto de 10% para contratos anuais.',
  true, true, '[]'::jsonb, 'active'
),

-- 4. SBPA - Hangar APENAS MENSAL (longa duração)
(
  1, 'SBPA', 'Porto Alegre/Salgado Filho', 'Porto Alegre', 'RS', 'Brasil',
  'H-BASE', 'Hangar de base, área privativa',
  140.00, 16.00, 14.00, 5.50,
  '["monomotor", "bimotor"]'::jsonb,
  NULL, NULL, NULL, 4200.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '3 years'),
  true,
  '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "20:00"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "manutencao_disponivel"]'::jsonb,
  'Hangar para base permanente de aeronaves. Contrato mínimo de 3 meses. Ideal para proprietários residentes.',
  'Vaga fixa garantida. Contrato anual com desconto de 15%. Área exclusiva para manutenção.',
  false, true, '[]'::jsonb, 'active'
),

-- 5. SBSV - Hangar aviação agrícola (preço por dia/semana)
(
  1, 'SBSV', 'Salvador/Dep. Luís Eduardo Magalhães', 'Salvador', 'BA', 'Brasil',
  'H-AG1', 'Área agrícola, zona industrial',
  160.00, 18.00, 14.00, 6.00,
  '["agricola", "monomotor", "bimotor"]'::jsonb,
  NULL, 220.00, 1200.00, 4000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "05:00", "close": "20:00"}, "tuesday": {"open": "05:00", "close": "20:00"}, "wednesday": {"open": "05:00", "close": "20:00"}, "thursday": {"open": "05:00", "close": "20:00"}, "friday": {"open": "05:00", "close": "20:00"}, "saturday": {"open": "06:00", "close": "18:00"}, "sunday": "closed"}'::jsonb,
  '["eletricidade", "agua", "iluminacao", "lavagem", "area_carregamento", "oficina_basica"]'::jsonb,
  'Hangar robusto para aviação agrícola e utilitária. Piso químico resistente. Área externa para lavagem e carregamento.',
  'Desconto para pacotes semanais durante safra. Oficina básica no local.',
  false, true, '[]'::jsonb, 'active'
),

-- 6. SBRF - Hangar médio porte (diária/semanal/mensal)
(
  1, 'SBRF', 'Recife/Guararapes', 'Recife', 'PE', 'Brasil',
  'H-8', 'Setor alfa, próximo FBO',
  130.00, 15.00, 13.00, 5.00,
  '["monomotor", "bimotor", "executive"]'::jsonb,
  NULL, 280.00, 1680.00, 6000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "sunday": {"open": "08:00", "close": "20:00"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "combustivel_proximo"]'::jsonb,
  'Hangar versátil para diversos tipos de aeronaves. Boa localização próxima a serviços.',
  'Wi-Fi disponível. Desconto de 5% para reservas de 7+ dias.',
  true, true, '[]'::jsonb, 'active'
),

-- 7. SBRP - Hangar compacto (pernoite/diária)
(
  1, 'SBRP', 'Ribeirão Preto/Leite Lopes', 'Ribeirão Preto', 'SP', 'Brasil',
  'H-2A', 'Lado oeste, acesso rápido',
  70.00, 11.00, 9.00, 4.00,
  '["monomotor"]'::jsonb,
  NULL, 130.00, 780.00, 2800.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "06:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "friday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "18:00"}, "sunday": "closed"}'::jsonb,
  '["eletricidade", "iluminacao", "seguranca"]'::jsonb,
  'Hangar compacto e econômico. Ideal para monomotores pequenos em trânsito.',
  'Tarifa especial de pernoite: R$ 100 (18h-08h). Check-in/out flexível.',
  false, true, '[]'::jsonb, 'active'
),

-- 8. SBJV - Hangar escola de voo (horária/diária)
(
  1, 'SBJV', 'Joinville/Lauro Carneiro de Loyola', 'Joinville', 'SC', 'Brasil',
  'H-ESC', 'Área de instrução',
  90.00, 12.00, 10.00, 4.50,
  '["monomotor", "ultralight"]'::jsonb,
  18.00, 140.00, 840.00, 3000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 years'),
  true,
  '{"monday": {"open": "06:00", "close": "21:00"}, "tuesday": {"open": "06:00", "close": "21:00"}, "wednesday": {"open": "06:00", "close": "21:00"}, "thursday": {"open": "06:00", "close": "21:00"}, "friday": {"open": "06:00", "close": "21:00"}, "saturday": {"open": "06:00", "close": "21:00"}, "sunday": {"open": "07:00", "close": "19:00"}}'::jsonb,
  '["eletricidade", "iluminacao", "seguranca", "wifi", "sala_briefing"]'::jsonb,
  'Hangar voltado para escolas de aviação e aeronaves de instrução. Pacotes especiais para escolas.',
  'Pacote escola: 100 horas por R$ 1.500. Sala de briefing incluída.',
  true, true, '[]'::jsonb, 'active'
),

-- 9. SBLO - Hangar executivo (diária/mensal com desconto)
(
  1, 'SBLO', 'Londrina/Governador José Richa', 'Londrina', 'PR', 'Brasil',
  'H-EXEC', 'Terminal executivo',
  180.00, 18.00, 15.00, 6.00,
  '["executive", "bimotor", "jet"]'::jsonb,
  NULL, 380.00, 2280.00, 8000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza"]'::jsonb,
  'Hangar executivo com serviços premium. Operação 24 horas. Ideal para aviação corporativa.',
  'Contrato semestral: 10% desconto. Contrato anual: 20% desconto.',
  true, true, '[]'::jsonb, 'active'
),

-- 10. SBMG - Hangar táxi aéreo (todas opções + desconto volume)
(
  1, 'SBMG', 'Maringá/Sílvio Name Júnior', 'Maringá', 'PR', 'Brasil',
  'H-TAXI', 'Base de táxi aéreo',
  110.00, 14.00, 12.00, 5.00,
  '["monomotor", "bimotor"]'::jsonb,
  30.00, 200.00, 1200.00, 4200.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "combustivel_proximo", "lavagem"]'::jsonb,
  'Hangar para operações de táxi aéreo. Base operacional com alta rotatividade. Acesso 24/7.',
  'Descontos progressivos: 7 dias (-5%), 15 dias (-10%), 30 dias (-15%).',
  true, true, '[]'::jsonb, 'active'
),

-- 11. SBCX - Hangar compartilhado (apenas mensal/anual)
(
  1, 'SBCX', 'Caxias do Sul/Hugo Cantergiani', 'Caxias do Sul', 'RS', 'Brasil',
  'H-SHARE', 'Hangar coletivo',
  200.00, 20.00, 16.00, 6.50,
  '["monomotor", "bimotor", "executive"]'::jsonb,
  NULL, NULL, NULL, 2500.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '5 years'),
  true,
  '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "sunday": {"open": "08:00", "close": "20:00"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi"]'::jsonb,
  'Hangar compartilhado para até 4 aeronaves. Economia com custo rateado. Vaga garantida.',
  'Contrato mínimo 6 meses. Anual: R$ 28.000 (economia de R$ 2.000).',
  true, true, '[]'::jsonb, 'active'
),

-- 12. SBSP - Hangar noturno (tarifa especial pernoite)
(
  1, 'SBSP', 'São Paulo/Congonhas', 'São Paulo', 'SP', 'Brasil',
  'H-NIGHT', 'Área norte, acesso 24h',
  100.00, 13.00, 11.00, 4.80,
  '["monomotor", "bimotor"]'::jsonb,
  NULL, 200.00, 1200.00, 4500.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "seguranca24h", "iluminacao"]'::jsonb,
  'Hangar com tarifa especial para pernoite. Ideal para quem chega tarde e sai cedo.',
  'Tarifa pernoite (18h-08h): R$ 120. Tarifa diurna (08h-18h): R$ 150. Diária completa: R$ 200.',
  true, true, '[]'::jsonb, 'active'
),

-- 13. SBGL - Hangar grande porte (jet/turbohélice)
(
  1, 'SBGL', 'Rio de Janeiro/Galeão - Antônio Carlos Jobim', 'Rio de Janeiro', 'RJ', 'Brasil',
  'H-LARGE', 'Hangar grande porte, pista principal',
  300.00, 25.00, 22.00, 8.00,
  '["jet", "turboprop", "executive"]'::jsonb,
  120.00, 800.00, 4800.00, 16000.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '3 years'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "lounge_vip", "handling"]'::jsonb,
  'Hangar de grande porte para jatos executivos e turbohélices. Infraestrutura completa de FBO. Serviços de handling disponíveis.',
  'Pacote semestral: R$ 90.000 (6% off). Pacote anual: R$ 170.000 (11% off).',
  true, true, '[]'::jsonb, 'active'
),

-- 14. SBBH - Hangar fim de semana (tarifa especial)
(
  1, 'SBBH', 'Belo Horizonte/Pampulha - Carlos Drummond de Andrade', 'Belo Horizonte', 'MG', 'Brasil',
  'H-WEEKEND', 'Próximo ao clube',
  85.00, 12.00, 10.00, 4.50,
  '["monomotor"]'::jsonb,
  NULL, 160.00, 900.00, 3200.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'),
  true,
  '{"monday": {"open": "07:00", "close": "19:00"}, "tuesday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "friday": {"open": "07:00", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "22:00"}}'::jsonb,
  '["eletricidade", "iluminacao", "seguranca", "wifi"]'::jsonb,
  'Hangar com tarifas especiais para finais de semana. Próximo ao aeroclube com restaurante.',
  'Tarifa fim de semana (sex-dom): R$ 250. Tarifa semanal: R$ 900. Clube de aviação ao lado.',
  true, true, '[]'::jsonb, 'active'
),

-- 15. SBBR - Hangar governamental/corporativo (longo prazo)
(
  1, 'SBBR', 'Brasília/Presidente Juscelino Kubitschek', 'Brasília', 'DF', 'Brasil',
  'H-CORP', 'Área corporativa isolada',
  220.00, 20.00, 17.00, 6.50,
  '["jet", "executive", "bimotor"]'::jsonb,
  NULL, 500.00, 3000.00, 10500.00,
  CURRENT_DATE, (CURRENT_DATE + INTERVAL '5 years'),
  true,
  '{"monday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "friday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}}'::jsonb,
  '["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "seguranca_reforçada"]'::jsonb,
  'Hangar corporativo de alto nível com segurança reforçada. Ideal para frotas governamentais e empresas. Área restrita.',
  'Contratos corporativos personalizados. Anual: R$ 115.000 (8% desconto). Segurança 24h com câmeras.',
  true, true, '[]'::jsonb, 'active'
);
