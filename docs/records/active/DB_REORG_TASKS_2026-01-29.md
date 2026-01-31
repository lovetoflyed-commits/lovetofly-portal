# DB Reorganization Task List — 2026-01-29

## Objetivo
Aumentar eficiência, reduzir duplicidades e tornar o banco mais simples, confiável e escalável, sem perder performance nem funcionalidades.

## Passo 1 (em andamento) — Validação de tabelas sem uso
Confirmar com o time quais tabelas realmente são usadas e quais podem ser arquivadas/removidas.

Tabelas detectadas sem referência no código (escopo src/ + server.js):
- neon_auth."user"
- neon_auth.account
- neon_auth.invitation
- neon_auth.jwks
- neon_auth.member
- neon_auth.organization
- neon_auth.project_config
- neon_auth.session
- neon_auth.verification
- public.admin_activity_log
- public.aircraft_listings
- public.airport_icao
- public.avionics_listings
- public.bookings
- public.business_activity_log
- public.career_profiles
- public.classified_photos
- public.companies
- public.compliance_records
- public.contracts
- public.coupon_redemptions
- public.coupons
- public.email_logs
- public.financial_transactions
- public.flight_logs
- public.forum_replies
- public.forum_reply_likes
- public.forum_topic_likes
- public.forum_topics
- public.hangar_bookings
- public.hangar_favorites
- public.hangar_listings
- public.hangar_owners
- public.hangar_photos
- public.hangar_reviews
- public.invoices
- public.listing_inquiries
- public.listing_payments
- public.listing_photos
- public.marketing_campaigns
- public.marketplace_listings
- public.membership_plans
- public.notifications
- public.partnerships
- public.parts_listings
- public.pgmigrations
- public.portal_analytics
- public.shop_products
- public.storage_alerts
- public.user_access_status
- public.user_activity_log
- public.user_memberships
- public.user_moderation
- public.user_notifications
- public.users

## Passo 2 — Revisão de duplicidades/sobreposição
Avaliar e consolidar tabelas com estrutura muito parecida.

Pares similares:
- public.classified_photos ↔ public.hangar_photos (79%)
- public.bookings ↔ public.hangar_bookings (74%)
- public.contracts ↔ public.partnerships (67%)
- public.compliance_records ↔ public.partnerships (62%)
- public.forum_reply_likes ↔ public.forum_topic_likes (60%)
- public.forum_reply_likes ↔ public.hangar_favorites (60%)
- public.forum_topic_likes ↔ public.hangar_favorites (60%)

## Passo 3 — Definir tabelas oficiais por funcionalidade
Escolher uma única tabela oficial por domínio (HangarShare, Forum, Marketplace etc.) e migrar dados redundantes.

## Passo 4 — Atualizar código
Garantir que todas as rotas API e telas usem somente a tabela oficial.

## Passo 5 — Limpeza segura
Arquivar/remover tabelas obsoletas após backup e validação.

## Passo 6 — Documentação mínima
Criar um dicionário de dados com propósito, dono e dependências de cada tabela.
