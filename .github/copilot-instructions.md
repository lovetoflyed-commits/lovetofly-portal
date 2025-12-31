# Instruções Copilot para Agentes de IA

## Arquitetura do Projeto
- **Monorepo, Next.js 16.x, TypeScript-first**: Toda a lógica da aplicação está em `src/`. Utiliza Next.js App Router (`src/app/`), cada subpasta é uma rota (ex: `marketplace/`, `hangarshare/`).
- **Principais features**: Autenticação, marketplace, logbook, compartilhamento de hangares, ferramentas E6B, pagamentos Stripe. Veja guias como `HANGARSHARE_COMPLETE_GUIDE.md`, `PAYMENT_INTEGRATION.md` para detalhes.
- **Banco de Dados**: PostgreSQL (Neon). Migrações em `src/migrations/` (gerenciadas por `node-pg-migrate`). Conexão em `src/config/db.ts`. Tipos em `src/types/db.d.ts`.
- **API**: Todas as rotas em `src/app/api/`, seguindo REST. Coloque lógica junto da feature quando possível.
- **Componentes**: Componentes React compartilhados em `src/components/` (ex: `Header.tsx`, `Sidebar.tsx`, `AuthGuard.tsx`). Componentes específicos ficam nas pastas de rota em `src/app/`.
- **Estado**: Use React context para estado global (veja `src/context/`). Estado de auth em `AuthContext.tsx`.
- **Estilização**: Tailwind CSS via `tailwind.config.js`.
- **Utilitários**: Lógica compartilhada em `src/utils/` (ex: `e6bLogic.ts`).

## Fluxos de Trabalho do Desenvolvedor
- **Servidor dev**: `npm run dev` (hot reload)
- **Build produção**: `npm run build` e depois `npm run start`
- **Lint**: `npm run lint`
- **Migrações**:
  - Rodar todas: `npm run migrate`
  - Passo a passo: `npm run migrate:up` / `npm run migrate:down`
  - Criar: `npm run migrate:create <nome>`
- **Ambiente**: Use `.env` (veja `.env.example` para variáveis obrigatórias)

## Convenções e Padrões do Projeto
- **TypeScript em tudo**: Todo novo código deve ser TypeScript.
- **Estrutura de rotas API**: Em `src/app/api/feature/route.ts`.
- **Componentes por feature**: Componentes de feature ficam em `src/app/feature/`.
- **Migrações**: Sempre em SQL, um arquivo por mudança, numeração sequencial.
- **Stripe**: Lógica de pagamento em `src/app/marketplace/` e `src/app/api/`. Veja `STRIPE_SETUP.md` e `STRIPE_QUICK_START.md`.
- **Email (Resend)**: Veja pacote `resend` e guias de email na raiz.
- **Tipos do BD**: Atualize `src/types/db.d.ts` ao mudar o schema.
- **UI com estado**: Use hooks e context do React. Veja `src/app/page.tsx` para padrões de dashboard/landing.
- **Módulos de features**: Veja o objeto `modules` em `src/app/page.tsx` para agrupamento e gating por plano.

## Pontos de Integração
- **Stripe**: Pagamentos/assinaturas. Veja pacotes `@stripe/stripe-js`, `stripe` e pastas marketplace/api.
- **Neon**: PostgreSQL hospedado. Setup em `src/config/db.ts`, scripts na raiz (ex: `setup-neon-db.js`).
- **Resend**: Envio de emails. Veja guias de email na raiz e pacote `resend`.

## Referências-Chave
- **Guias de features**: `*_GUIDE.md` (ex: `HANGARSHARE_COMPLETE_GUIDE.md`)
- **Onboarding**: `README.md`, `QUICK_START.md`, `START_HERE.md`
- **Banco de Dados**: `src/config/db.ts`, `src/types/db.d.ts`, `src/migrations/`
- **Componentes**: `src/components/`, `src/context/`
- **API**: `src/app/api/`
- **Dashboard/Landing**: Veja `src/app/page.tsx` para dashboard modular, gating de features e widgets.

---

Para mais, veja [README.md](../README.md) e os guias na raiz. Em caso de dúvida, siga as melhores práticas de Next.js e TypeScript conforme adaptadas neste repositório.