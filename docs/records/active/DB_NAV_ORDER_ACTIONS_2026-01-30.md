# Ações Pendentes — Checklist Navegação e Consolidação DB — 2026-01-30

Objetivo: listar todas as ações necessárias para concluir o trabalho do DB a partir do checklist de navegação e das seções de consolidação/entregáveis.

## Ações por Itens do Checklist
### Rotas ausentes
- [x] Decidir se /hangarshare/bookings será criada ou removida do menu lateral. (Menu aponta para /profile/bookings)
- [ ] Decidir se /shop será criada ou removida do menu lateral.

### Fluxo de reservas HangarShare
- [x] Evitar duplicidade de reservas confirmadas para o mesmo período.
- [x] Bloquear seleção de dias indisponíveis no calendário de reserva.
- [x] Exibir mensagem amigável quando datas estiverem indisponíveis (HTTP 409).

### Favoritos HangarShare
- [x] Corrigir erro 500 ao carregar favoritos (campo airport_name).
- [x] Adicionar acesso de favoritos no menu lateral.
- [x] Ajustar campos exibidos em favoritos (preço e dimensões com fallback).
- [x] Normalizar campos na página de detalhes do hangar (ICAO/tamanho/dimensões) para evitar dados vazios.

### Relatórios HangarShare
- [x] Implementar relatório “Desempenho por Aeródromo” com filtros, gráficos e tabela.

### Tabelas em uso com lacunas de dados no dump
- [x] Revisar por que public.hangar_photos aparece com 0 linhas apesar do uso (fonte dos dados/seed).
- [x] Revisar por que public.forum_topic_likes e public.forum_reply_likes estão com 0 linhas (uso real vs. feature não ativa).
- [x] Revisar por que public.user_documents não aparece no dump (migração, schema ou dump incompleto).

### Tabelas em uso sem contagem no dump (traslados)
- [x] Verificar existência real e dados de: public.traslados_requests, public.traslados_messages, public.traslados_service_fees, public.traslados_operation_updates, public.traslados_pilots, public.traslados_pilot_documents.

Relatório: docs/records/active/DB_NAV_ORDER_DUMP_CHECK_2026-01-30.md
- [ ] Confirmar se essas tabelas devem ser mantidas e em qual estágio de uso estão.

## Ações por Consolidação (Seção 4)
- [ ] Consolidar decisão final por tabela: manter / revisar / arquivar.
- [ ] Atualizar a lista de “candidatas a arquivar” removendo as já confirmadas em uso.
- [ ] Marcar dependências cruzadas (ex.: users em múltiplos domínios) para evitar remoções indevidas.

## Ações por Entregáveis (Seção 5)
- [x] Checklist PDF gerado (DB_NAV_ORDER_CHECKLIST_2026-01-30.pdf).
- [ ] Revisar e validar o relatório de consolidação com o time antes da decisão final.
- [ ] Criar plano de migração/arquivamento após aprovação (sem execução ainda).
- [ ] Configurar templates de e-mails do sistema para notificações (ex.: reenvio de documentos HangarShare).

## Próxima execução sugerida
1) Resolver rotas ausentes (/hangarshare/bookings, /shop).
2) Validar dados ausentes no dump (hangar_photos, likes, user_documents, traslados_*).
3) Fechar decisão por tabela (manter/revisar/arquivar) e preparar plano final.
