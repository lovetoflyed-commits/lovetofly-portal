# Agent Start Here (2026-01-29)

> **🤖 AI Coding Agents**: Also read `.github/copilot-instructions.md` for comprehensive technical guidelines, database configuration, and workflow patterns.

## Contexto correto do projeto
- HangarShare é uma funcionalidade dentro do portal Love to Fly (não é um domínio separado).
- O portal usa o domínio https://lovetofly.com.br (GoDaddy), com arquivos hospedados na Netlify e deploy via GitHub.
- **Banco de dados**:
  - **Produção/Cloud**: Neon PostgreSQL (configurado via `DATABASE_URL`)
  - **Desenvolvimento Local**: PostgreSQL local com nome do banco `lovetofly-portal` (com hífen, não pode ser alterado)

## Ordem de leitura obrigatória (prioridade)
1. **.github/copilot-instructions.md** - Technical guidelines and critical context
2. **logbook/AGENT_ACTIONS_LOG.md** - Action history and error resolutions
3. **docs/records/active/PROJECT_SNAPSHOT_2026-01-29.md** - Current state overview
4. **docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md** - All routes and APIs
5. **docs/records/active/DB_REORG_TASKS_2026-01-29.md** - Database tasks
6. **docs/records/active/PROJECT_STATUS_TODO_AND_FLIGHTTOOLS_ANALYSIS_2026-01-28.md** - Status and TODOs
7. **docs/records/active/FUNCTIONALITY_REPORT_2026-01-28.md** - Feature analysis
8. **logbook/AGENT_LOGBOOK_2026-01-29.md** - Detailed work log

## O que foi feito na reorganização
- Toda a documentação solta em raiz foi movida para docs/records/ por categoria.
- Duplicados (com " 2" no nome) foram movidos para docs/records/archive/duplicates.
- Relatórios PDF/TXT foram organizados em docs/records/ por tema.
- Arquivos essenciais ficaram na raiz (README.md e este arquivo).

## Regra para novos agentes
- **NUNCA adicionar novos arquivos .md/.pdf/.txt na raiz** (366 arquivos legados já existem - não adicione mais).
- **SEMPRE criar/atualizar arquivos em docs/records/active/** e registrar mudanças no logbook.
- **Atualização obrigatória**: logbook/AGENT_ACTIONS_LOG.md deve ser atualizado após cada ação concluída, com detalhes do que foi feito, resultados, erros, tentativas, correções e como o erro foi resolvido.
- **Banco de dados**:
  - **Produção**: Use Neon PostgreSQL via `DATABASE_URL` (configurado em src/config/db.ts)
  - **Desenvolvimento local**: Use PostgreSQL local com banco `lovetofly-portal` (com hífen, não pode ser alterado)
  - **SEMPRE** importe de `src/config/db.ts` - nunca crie novas conexões
- **Cross-reference**: Leia .github/copilot-instructions.md para detalhes técnicos completos, padrões de API, e melhores práticas.
