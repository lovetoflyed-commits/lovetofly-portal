# Consolidação por Navegação — 2026-01-30

Objetivo: consolidar tabelas lidas/escritas por página, indicando se já foram cobertas e se há dados no dump.

Fonte de contagem: docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md (quando disponível).

## Landing Page
- Componentes: LandingPage, HangarCarousel
- Tabelas:
  - public.hangar_listings (linhas no dump: 20)
  - public.hangar_photos (linhas no dump: 0)
  - public.hangar_bookings (linhas no dump: 9)
  - public.users (linhas no dump: 34)
- Ação sugerida: manter (em uso). hangar_photos com 0 linhas → revisar preenchimento.
- Status: já coberto no checklist.

## Dashboard do Usuário
- Tabelas:
  - public.hangar_listings (20)
  - public.hangar_photos (0)
  - public.hangar_bookings (9)
  - public.users (34)
- Status: já coberto no checklist.
- Ação sugerida: manter (em uso). hangar_photos com 0 linhas → revisar preenchimento.

## Conta
### /profile
- Tabelas:
  - public.users (34)
  - public.flight_logs (2)
  - public.hangar_listings (20)
- Status: já coberto no checklist.
- Ação sugerida: manter (em uso).

## Carreira
### /career
- Tabelas:
  - public.users (34)
  - public.career_profiles (7)
- Status: já coberto no checklist.
- Ação sugerida: manter (em uso).

### /career/jobs, /career/my-applications, /career/companies, /mentorship
- Tabelas: nenhuma (dados mock locais)
- Status: já coberto no checklist.
- Ação sugerida: não aplicável.

## Classificados
### /classifieds/aircraft
- Tabelas:
  - public.aircraft_listings (7)
  - public.classified_photos (11)
  - public.users (34)
- Ação sugerida: manter (em uso).

### /classifieds/parts
- Tabelas:
  - public.parts_listings (7)
  - public.classified_photos (11)
  - public.users (34)
- Ação sugerida: manter (em uso).

### /classifieds/avionics
- Tabelas:
  - public.avionics_listings (7)
  - public.classified_photos (11)
  - public.users (34)
- Ação sugerida: manter (em uso).

## Traslados
### /traslados
- Tabelas:
  - public.traslados_requests (dump: não listado)
- Ação sugerida: revisar (em uso, sem contagem no dump).

### /traslados/messages
- Tabelas:
  - public.traslados_requests (dump: não listado)
  - public.traslados_messages (dump: não listado)
  - public.traslados_service_fees (dump: não listado)
  - public.users (34)
- Ação sugerida: revisar (em uso, sem contagem no dump).

### /traslados/status
- Tabelas:
  - public.traslados_operation_updates (dump: não listado)
- Ação sugerida: revisar (em uso, sem contagem no dump).

### /traslados/owners
- Tabelas:
  - public.traslados_pilots (dump: não listado)
  - public.traslados_pilot_documents (dump: não listado)
- Ação sugerida: revisar (em uso, sem contagem no dump).

### /traslados/pilots
- Tabelas:
  - public.traslados_pilots (dump: não listado)
  - public.traslados_pilot_documents (dump: não listado)
- Ação sugerida: revisar (em uso, sem contagem no dump).

## Comunidade
### /forum
- Tabelas:
  - public.forum_topics (8)
  - public.forum_replies (9)
  - public.forum_topic_likes (0)
  - public.forum_reply_likes (0)
  - public.users (34)
- Ação sugerida: manter (em uso). likes com 0 linhas → revisar preenchimento.

## Cursos e Treinamento
### /courses, /simulator
- Tabelas: nenhuma (dados mock locais)
- Ação sugerida: não aplicável.

## Ferramentas de Voo
### /tools, /tools/e6b, /tools/glass-cockpit, /tools/ifr-simulator
- Tabelas: nenhuma (conteúdo estático)
- Ação sugerida: não aplicável.

## HangarShare
### /hangarshare
- Tabelas: nenhuma (redireciona para busca)
- Ação sugerida: não aplicável.

### /hangarshare/owner/register
- Tabelas:
  - public.users (34)
  - public.hangar_owners (5)
  - public.user_documents (dump: não listado)
- Ação sugerida: manter (em uso). user_documents sem contagem → revisar dump.

### /hangarshare/bookings
- Observação: rota não encontrada no app.

## Logbook
### /logbook
- Tabelas:
  - public.flight_logs (2)
- Ação sugerida: manter (em uso).

## Meteorologia
### /weather, /weather/radar
- Tabelas: nenhuma (APIs externas/sem DB)
- Ação sugerida: não aplicável.

## Navegação
### / (Dashboard)
- Coberto em “Dashboard do Usuário”.

## Shop
### /shop
- Observação: rota não encontrada no app.
- Ação sugerida: revisar (rota ausente).
