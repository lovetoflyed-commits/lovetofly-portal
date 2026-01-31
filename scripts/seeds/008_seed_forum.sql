-- Seed Forum Topics and Replies

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
    'michael.johnson@test.local',
    'sofia.rodriguez@test.local'
  )
),
topic_seed AS (
  SELECT
    su.id AS user_id,
    v.title,
    v.category,
    v.content,
    v.views,
    v.is_pinned,
    v.is_locked,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('admin@test.local', 'Bem-vindo ao fórum Love to Fly', 'general',
       'Este espaço é dedicado a pilotos, proprietários e entusiastas. Compartilhe experiências e dúvidas!', 152, true, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
      ('maria.santos@test.local', 'Dúvidas sobre ANAC RBAC 61', 'regulations',
       'Alguém tem dicas sobre o processo de checagem e prazos atuais?', 84, false, false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days'),
      ('paulo.martins@test.local', 'Checklist de manutenção para pistão', 'technical',
       'Vamos compartilhar rotinas e melhores práticas de inspeção preventiva.', 67, false, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'),
      ('ana.ferreira@test.local', 'Eventos de aviação 2026 no Brasil', 'events',
       'Quais feiras e encontros vocês recomendam para 2026?', 91, false, false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
      ('roberto.costa@test.local', 'Classificados: dicas para anunciar', 'classifieds',
       'Como apresentar melhor fotos e histórico de manutenção para fechar negócio?', 123, false, false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'),
      ('lucas.almeida@test.local', 'Perguntas sobre horas de voo para PC', 'questions',
       'Qual a melhor estratégia para acumular horas PIC com segurança?', 58, false, false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
      ('sofia.rodriguez@test.local', 'Meteorologia: interpretação de METAR', 'technical',
       'Compartilhem materiais e dicas para leitura rápida de METAR e TAF.', 73, false, false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
      ('carlos.silva@test.local', 'Treinamento IFR: erros comuns', 'technical',
       'Quais erros vocês mais veem durante o treinamento IFR?', 65, false, false, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
  ) AS v(
    email, title, category, content, views, is_pinned, is_locked, created_at, updated_at
  )
  JOIN seed_users su ON su.email = v.email
)
INSERT INTO forum_topics (
  user_id, title, category, content, views, is_pinned, is_locked, created_at, updated_at
)
SELECT
  s.user_id, s.title, s.category, s.content, s.views, s.is_pinned, s.is_locked, s.created_at, s.updated_at
FROM topic_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM forum_topics t
  WHERE t.title = s.title AND t.user_id = s.user_id
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
    'michael.johnson@test.local',
    'sofia.rodriguez@test.local'
  )
),
reply_seed AS (
  SELECT
    t.id AS topic_id,
    su.id AS user_id,
    v.content,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('Bem-vindo ao fórum Love to Fly', 'carlos.silva@test.local', 'Obrigado pelo espaço! Animado para participar.', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
      ('Bem-vindo ao fórum Love to Fly', 'michael.johnson@test.local', 'Great initiative! Looking forward to sharing experiences.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
      ('Dúvidas sobre ANAC RBAC 61', 'admin@test.local', 'Verifique o portal da ANAC e mantenha a documentação digitalizada.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
      ('Checklist de manutenção para pistão', 'joao.oliveira@test.local', 'Sempre reviso magnetos e filtros a cada 50h.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
      ('Eventos de aviação 2026 no Brasil', 'juliana.rocha@test.local', 'O evento de Congonhas costuma ter boas palestras.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
      ('Classificados: dicas para anunciar', 'ana.ferreira@test.local', 'Fotos claras da cabine e histórico completo ajudam muito.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
      ('Perguntas sobre horas de voo para PC', 'maria.santos@test.local', 'Instrutoria e reboque são boas alternativas.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
      ('Meteorologia: interpretação de METAR', 'paulo.martins@test.local', 'Uso apps com decodificação e comparo com observações locais.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
      ('Treinamento IFR: erros comuns', 'sofia.rodriguez@test.local', 'Atenção à gestão de energia e briefing completo da aproximação.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
  ) AS v(topic_title, email, content, created_at, updated_at)
  JOIN forum_topics t ON t.title = v.topic_title
  JOIN seed_users su ON su.email = v.email
)
INSERT INTO forum_replies (
  topic_id, user_id, content, created_at, updated_at
)
SELECT
  s.topic_id, s.user_id, s.content, s.created_at, s.updated_at
FROM reply_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM forum_replies r
  WHERE r.topic_id = s.topic_id AND r.user_id = s.user_id AND r.content = s.content
);

-- Sync replies_count with actual replies
UPDATE forum_topics t
SET replies_count = sub.reply_count
FROM (
  SELECT topic_id, COUNT(*)::int AS reply_count
  FROM forum_replies
  WHERE is_deleted = false
  GROUP BY topic_id
) sub
WHERE t.id = sub.topic_id;

-- Output summary
SELECT 'Forum seeded successfully!' as message,
  (SELECT COUNT(*) FROM forum_topics) as topics,
  (SELECT COUNT(*) FROM forum_replies) as replies;
