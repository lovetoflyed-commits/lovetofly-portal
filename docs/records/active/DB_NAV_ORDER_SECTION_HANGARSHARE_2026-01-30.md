# Checklist — HangarShare — 2026-01-30

## Checkpoint — 2026-01-30
- Status: aguardando validação no navegador antes de executar correções.
- Pendências globais: /hangarshare/bookings, /shop e endpoint /api/hangarshare/bookings usado no BookingModal.

- [x] /hangarshare
  - Sem API/DB (redireciona para busca)
- [x] /hangarshare/owner/register
  - APIs: /api/user/profile, /api/hangarshare/owner/validate-documents
  - Tabelas: public.users, public.hangar_owners, public.user_documents
- [ ] /hangarshare/bookings
  - Observação: rota não encontrada no app (referenciada no menu lateral).
