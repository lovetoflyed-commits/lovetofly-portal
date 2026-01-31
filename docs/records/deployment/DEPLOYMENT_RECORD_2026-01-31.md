# Deployment Record — 2026-01-31

## Resumo
- **Método**: Push para GitHub (main) com auto-deploy no Netlify.
- **Commit**: 8496b6a
- **Charts**: **Excluídos** do deploy (não enviados).

## O que foi com este deploy (escopo alto nível)
- Ajuste do dashboard do usuário: remoção do carrossel duplicado do HangarShare na primeira linha.
- Admin HangarShare: relatórios completos (aeródromos, receita por anunciante, tendências, satisfação) com páginas e APIs.
- Admin HangarShare: redirecionamento da página de verificações para o painel principal.
- Admin: novas áreas e rotas (inbox, tarefas, moderação, marketing) e endpoints associados.
- HangarShare: novos endpoints e páginas de leases, waitlist e documentos de proprietários.
- Classificados: endpoints de escrow e webhook de pagamentos.
- Migrations adicionais (080–091) e organização de migrações anteriores em backup.
- Atualizações extensas de documentação e registros em docs/records/ e logbook/.

## Exclusões confirmadas (charts)
- public/charts/
- dist/charts/
- charts*.tar.gz
- scripts/deploy-charts-*.sh
- scripts/generate-charts-manifest.js
- scripts/prepare-charts-deploy.sh

## Verificação
- Push realizado para origin/main.
- Deploy deve iniciar automaticamente no Netlify.
