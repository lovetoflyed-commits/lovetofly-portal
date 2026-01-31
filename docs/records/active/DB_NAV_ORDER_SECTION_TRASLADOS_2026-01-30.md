# Checklist — Traslados — 2026-01-30

## Checkpoint — 2026-01-30
- Status: aguardando validação no navegador antes de executar correções.
- Pendências globais: /hangarshare/bookings, /shop e endpoint /api/hangarshare/bookings usado no BookingModal.

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
