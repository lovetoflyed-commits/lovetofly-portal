# Validação de Tabelas — 2026-01-29

Gerado em: 2026-01-29 09:34:10

## Critérios de validação
- Existe uso no código (referência textual)
- Existe dado na tabela (contagem no dump)
- Priorizar tabelas com dados e sem referência para revisão manual

## Resultado resumido

| Tabela | Linhas (dump) | Referência no código | Status sugerido | Evidência |
| --- | --- | --- | --- | --- |
| neon_auth."user" | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.account | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.invitation | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.jwks | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.member | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.organization | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.project_config | 1 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| neon_auth.session | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| neon_auth.verification | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.admin_activity_log | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.aircraft_listings | 7 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.airport_icao | 26 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.avionics_listings | 7 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.bookings | 17 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.business_activity_log | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.career_profiles | 7 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.classified_photos | 11 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.companies | 12 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.compliance_records | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.contracts | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.coupon_redemptions | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.coupons | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.email_logs | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.financial_transactions | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.flight_logs | 2 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.forum_replies | 9 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.forum_reply_likes | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.forum_topic_likes | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.forum_topics | 8 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.hangar_bookings | 9 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.hangar_favorites | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.hangar_listings | 20 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.hangar_owner_verification | 5 | Sim | Manter (há dados e uso) | src/app/api/admin/verifications/route.ts, src/app/api/admin/hangarshare/owners/[id]/details/route.ts |
| public.hangar_owners | 5 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.hangar_photos | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.hangar_reviews | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.invoices | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.listing_inquiries | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.listing_payments | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.listing_photos | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.marketing_campaigns | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.marketplace_listings | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.membership_plans | 4 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.notifications | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.partnerships | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.parts_listings | 7 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.pgmigrations | 35 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.portal_analytics | 1 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.shop_products | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.storage_alerts | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.user_access_status | 1 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.user_activity_log | 1 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.user_memberships | 4 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.user_moderation | 4 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
| public.user_notifications | 0 | Não | Candidata a arquivar (sem dados e sem uso) | Sem referência encontrada |
| public.users | 34 | Não | Revisar (há dados, sem uso no código) | Sem referência encontrada |
