# Love to Fly Portal – Copilot Instructions

## Big picture
- Next.js 16 App Router; API routes colocated with route handlers.
- Auth state via `useAuth()` with localStorage token; protected UI uses an auth guard.
- i18n via `useLanguage()`; strings live in translations.
- DB uses a singleton `pg.Pool`; migrations are new 00X_*.sql files only; update DB types when schema changes.
- Admin system includes admin routes, v2 UI, permissions, and audit logging.
- Major feature areas: careers, classifieds, courses, flight planning, logbook, marketplace, mentorship, procedures, simulator, weather, HangarShare.
- Aviation tools include E6B variants; related assets are bundled under public assets.

## Key workflows (package.json)
- Dev server: npm run dev (uses server.js); debug: npm run dev:debug.
- Build: npm run build; lint: npm run lint.
- Tests: npm run test, npm run test:integration, npm run test:e2e (Playwright), npm run test:all.
- Migrations: npm run migrate:up|migrate:down|migrate:create (node-pg-migrate).
- Seeds: npm run seed:dev; see the seeds README for accounts and data coverage.

## API & data patterns
- API handlers return NextResponse.json({ data|message }, { status }) with try/catch and descriptive console.error.
- Auth uses Authorization: Bearer <token> headers; client state comes from useAuth().
- Migrations should be idempotent and create indexes for foreign keys; never edit existing migration files.

## Integrations
- Stripe: client via @stripe/react-stripe-js; server via stripe; webhook handled in API routes.
- Email via Resend.
- WebSocket server in server.js; server manager and hooks exist for realtime stats.

## References
- Docs index and admin overview are documented in the repository docs.
- Entry points: root layout and global styles.
- AI guide lives in this file.
