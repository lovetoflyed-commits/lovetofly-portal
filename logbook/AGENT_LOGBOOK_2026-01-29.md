# Logbook — 2026-01-29

## Correção de contexto
- HangarShare é uma funcionalidade do portal Love to Fly (não é domínio separado).
- Domínio: https://lovetofly.com.br (GoDaddy). Hospedagem: Netlify. Deploy: GitHub.
- Banco de dados: Neon (PostgreSQL).

## Ações executadas
- Coleta de conteúdo da home em produção e localhost.
- Inventário de páginas e rotas da aplicação (App Router) por varredura de arquivos.
- Reorganização da documentação (.md/.pdf/.txt) em docs/records/.
- Criação de instruções centralizadas para novos agentes.
- Varredura automática das rotas públicas e geração de relatório de conteúdo por rota.
- Definida regra máxima de atualização contínua e prioridade de leitura iniciando por public/ads.txt.
- Correção: regra de atualização movida para logbook/AGENT_ACTIONS_LOG.md e ads.txt restaurado.

## Evidências
- Conteúdo local e produção retornam a mesma home page.
- Inventário de rotas gerado em docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md.
- Relatório de conteúdo por rota em docs/records/active/PROJECT_ROUTE_CONTENT_REPORT_2026-01-29.md.
- Regra formal: docs/records/active/AGENT_MANDATORY_UPDATE_RULES_2026-01-29.md.

## Pendências imediatas
- Revisar rotas protegidas (admin/staff/owner) com login válido.
- Verificar páginas não públicas via navegação automática (crawler interno).

## 2026-01-31 — Deploy
- Deploy preparado e enviado via GitHub (commit 8496b6a), com exclusão explícita de charts.
- Registro de deploy criado em docs/records/deployment/DEPLOYMENT_RECORD_2026-01-31.md.
