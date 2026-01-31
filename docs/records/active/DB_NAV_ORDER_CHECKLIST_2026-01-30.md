# Checklist de Revisão por Ordem de Navegação — 2026-01-30

## Checkpoint — 2026-01-30
- Status: aguardando validação no navegador antes de executar correções.
- Pendências globais: /hangarshare/bookings, /shop e endpoint /api/hangarshare/bookings usado no BookingModal.

Objetivo: revisar tabelas e dependências seguindo a ordem da navegação do site para evitar retrabalho e garantir que tabelas já usadas sejam priorizadas.

## 1) Landing Page (público)
- [x] Identificar componentes e dados carregados na landing page.
- [x] Mapear tabelas consultadas direta/indiretamente.
- [x] Verificar se há tabelas com dados sem referência no código.

Achados:
- Componentes: LandingPage, HangarCarousel.
- API: /api/hangarshare/listing/highlighted.
- Tabelas envolvidas: public.hangar_listings, public.hangar_photos, public.hangar_bookings, public.users.
- Observação: login/cadastro acionam /api/auth/* (tabela users), porém o conteúdo principal é estático.

## 2) Dashboard do Usuário (corpo principal)
- [x] Mapear módulos e cards do dashboard inicial.
- [x] Listar tabelas usadas em métricas e listas principais.
- [x] Validar coerência com tabelas core já mapeadas.

Achados:
- Módulos principais: boas-vindas, procedimentos/NOTAMs (link), HangarCarousel, clima (METAR), notícias de aviação, classificados (mock local).
- APIs usadas: /api/hangarshare/listing/highlighted, /api/weather/metar, /api/news/aviation.
- Tabelas envolvidas: public.hangar_listings, public.hangar_photos, public.hangar_bookings, public.users (via HangarCarousel/owner). Weather/News não usam DB.
- Observação: dados de usuário vêm do `useAuth` (tabela users já coberta nas core).

## 3) Menu Lateral (ordem de cima para baixo)
### Conta
- [x] /profile — dados do usuário e preferências.

Achados (/profile):
- API: /api/user/profile.
- Tabelas envolvidas: public.users, public.flight_logs, public.hangar_listings.
- Observação: edição de perfil atualiza users; horas totais vêm de flight_logs.

### Carreira
- [x] /career
- [x] /career/jobs
- [x] /career/my-applications
- [x] /career/companies
- [x] /mentorship

Achados:
- API: /api/career/profile para verificar perfil existente.
- Tabelas envolvidas: public.users, public.career_profiles.
- /career/jobs: dados mock locais (sem DB).

### Classificados
- [x] /classifieds/aircraft
  - API: /api/classifieds/aircraft
  - Tabelas: public.aircraft_listings, public.classified_photos, public.users
- [x] /classifieds/parts
  - API: /api/classifieds/parts
  - Tabelas: public.parts_listings, public.classified_photos, public.users
- [x] /classifieds/avionics
  - API: /api/classifieds/avionics
  - Tabelas: public.avionics_listings, public.classified_photos, public.users

### Traslados
- [x] /traslados
  - API: /api/traslados/quote
  - Tabelas: public.traslados_requests
- [x] /traslados/messages
  - API: /api/traslados/messages
  - Tabelas: public.traslados_requests, public.traslados_messages, public.traslados_service_fees, public.users
- [x] /traslados/status
  - API: /api/traslados/updates
  - Tabelas: public.traslados_operation_updates
- [x] /traslados/owners
  - API: /api/traslados/pilots
  - Tabelas: public.traslados_pilots, public.traslados_pilot_documents
- [x] /traslados/pilots
  - API: /api/traslados/pilots
  - Tabelas: public.traslados_pilots, public.traslados_pilot_documents

### Comunidade
- [x] /forum
  - APIs: /api/forum/topics, /api/forum/topics/[id], /api/forum/topics/[id]/replies, /api/forum/topics/[id]/likes
  - Tabelas: public.forum_topics, public.forum_replies, public.forum_topic_likes, public.forum_reply_likes, public.users

### Cursos e Treinamento
- [x] /courses
  - Sem API/DB (dados mock locais)
- [x] /simulator
  - Sem API/DB (dados mock locais)

### Ferramentas de Voo
- [x] /tools/e6b
  - Sem API/DB (conteúdo estático)
- [x] /tools
  - Sem API/DB (conteúdo estático)
- [x] /tools/glass-cockpit
  - Sem API/DB (conteúdo estático)
- [x] /tools/ifr-simulator
  - Sem API/DB (conteúdo estático)

### HangarShare
- [x] /hangarshare
  - Sem API/DB (redireciona para busca)
- [x] /hangarshare/owner/register
  - APIs: /api/user/profile, /api/hangarshare/owner/validate-documents
  - Tabelas: public.users, public.hangar_owners, public.user_documents
- [ ] /hangarshare/bookings
  - Observação: rota não encontrada no app (referenciada no menu lateral).

### Logbook
- [x] /logbook
  - APIs: /api/logbook, /api/logbook/deleted
  - Tabelas: public.flight_logs

### Meteorologia
- [x] /weather
  - API: /api/weather/metar (sem DB)
- [x] /weather/radar
  - Sem API/DB (imagens externas)

### Navegação
- [x] / (Dashboard)
  - Coberto no item 2 (Dashboard do Usuário)

### Shop
- [ ] /shop
  - Observação: rota não encontrada no app (referenciada no menu lateral).

## 4) Consolidação por Página
Para cada item acima:
- [x] Listar tabelas lidas/escritas.
- [x] Verificar se a tabela já foi coberta em etapas anteriores.
- [x] Marcar se a tabela contém dados no dump.
- [x] Classificar ação: manter / revisar / arquivar.

Relatório: docs/records/active/DB_NAV_ORDER_CONSOLIDATION_2026-01-30.md

## 5) Entregáveis
- [x] Atualizar relatório de revisão de tabelas não-core com achados da navegação.
- [x] Gerar PDF A4 único com checklist e status.

Addendum: docs/records/active/DB_NON_CORE_TABLES_REVIEW_ADDENDUM_2026-01-30.md
PDF: docs/records/active/DB_NAV_ORDER_CHECKLIST_2026-01-30.pdf
