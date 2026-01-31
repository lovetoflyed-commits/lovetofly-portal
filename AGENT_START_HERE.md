# Agent Start Here (2026-01-29)

## Contexto correto do projeto
- HangarShare é uma funcionalidade dentro do portal Love to Fly (não é um domínio separado).
- O portal usa o domínio https://lovetofly.com.br (GoDaddy), com arquivos hospedados na Netlify e deploy via GitHub.
- O banco de dados web está na Neon (PostgreSQL).

## Ordem de leitura obrigatória (prioridade)
1. logbook/AGENT_ACTIONS_LOG.md
2. docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md
3. docs/records/active/DB_REORG_TASKS_2026-01-29.md
4. docs/records/active/PROJECT_STATUS_TODO_AND_FLIGHTTOOLS_ANALYSIS_2026-01-28.md
5. docs/records/active/FUNCTIONALITY_REPORT_2026-01-28.md
6. docs/records/active/PROJECT_SNAPSHOT_2026-01-29.md
7. logbook/AGENT_LOGBOOK_2026-01-29.md

## O que foi feito na reorganização
- Toda a documentação solta em raiz foi movida para docs/records/ por categoria.
- Duplicados (com " 2" no nome) foram movidos para docs/records/archive/duplicates.
- Relatórios PDF/TXT foram organizados em docs/records/ por tema.
- Arquivos essenciais ficaram na raiz (README.md e este arquivo).

## Regra para novos agentes
- Nunca adicionar novos arquivos .md/.pdf/.txt na raiz.
- Sempre criar/atualizar arquivos em docs/records/active e registrar mudanças no logbook.
- Atualização obrigatória: logbook/AGENT_ACTIONS_LOG.md deve ser atualizado após cada ação concluída, com detalhes do que foi feito, resultados, erros, tentativas, correções e como o erro foi resolvido.
