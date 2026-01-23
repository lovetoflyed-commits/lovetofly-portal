# Love to Fly Portal – AI Agent Instructions

## Core Architecture
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Neon PostgreSQL, Stripe, Resend
- **Co-location:** API routes live alongside features (`src/app/api/**/route.ts`), not in a global services folder
- **State Management:** 
  - Auth via `src/context/AuthContext.tsx` → `useAuth()` hook (user, token via localStorage)
  - i18n via `src/context/LanguageContext.tsx` → `useLanguage()` hook (pt, en, es)
- **Database:** Singleton `pg.Pool` in `src/config/db.ts`, migrations in `src/migrations/` (sequential: `00X_description.sql`)
- **UI Components:** Shared in `src/components/` (Header, Sidebar, AuthGuard, HangarCarousel, LanguageSelector)
- **Translations:** `src/translations/` (pt.json, en.json, es.json - 300+ keys each)
- **Pages:** All in `src/app/`, interactive components use `'use client'`. Root `layout.tsx` wraps `<LanguageProvider><AuthProvider>`

## Essential Workflows

### Development Commands
```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # ESLint check
npm run seed:dev     # Seed database with test data
```

### Database Operations
```bash
npm run migrate:up      # Run next pending migration
npm run migrate:down    # Rollback last migration
npm run migrate:create  # Create new migration file
```

**Migration Pattern:** Always create new file in `src/migrations/00X_description.sql`. Use `IF NOT EXISTS` for safety. Create indexes for all foreign keys. Update `src/types/db.d.ts` after schema changes.

### Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET`, `NEXTAUTH_SECRET` - Authentication
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` - Payments
- `RESEND_API_KEY` - Email service

For Netlify deployment: Add same variables in Settings → Environment Variables

## Project Patterns

### API Routes
Pattern for all routes in `src/app/api/**/route.ts`:
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // validation, business logic
    const result = await pool.query('SELECT ...', [params]);
    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Descriptive error:', error);
    return NextResponse.json({ message: 'Error message' }, { status: 500 });
  }
}
```
- Always use `try/catch` with descriptive `console.error()`
- Return format: `NextResponse.json({ message|data }, { status })`
- Auth: JWT in `Authorization: Bearer <token>` header

### Authentication Flow
- Login endpoint: `/api/auth/login` returns `{ token, user: { id, name, email, plan } }`
- State persisted in localStorage via `AuthContext`
- Protected routes: Use `<AuthGuard>` component or validate `useAuth()` on client
- Session expires → auto-redirect to `/login`

### UI Components
- **Styling:** Tailwind CSS (see `tailwind.config.js`)
- **Reusable Components:** `src/components/` (Header, Sidebar, BookingModal, HangarCarousel)
- **Dashboard Pattern:** See `src/app/page.tsx` - modular with plan-based access control (free/premium/pro)

### Internationalization (i18n)
```typescript
import { useLanguage } from '@/context/LanguageContext';

export function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  return <h1>{t('section.key')}</h1>;
}
```
- Add new keys to **all 3 files**: `src/translations/pt.json`, `en.json`, `es.json`
- Auto-detects browser language, persists in localStorage
- SSR-safe with fallback handling

### Database Seeding
- Seed scripts in `scripts/seeds/` with realistic test data
- Run `npm run seed:dev` to populate local database
- Local assets in `public/seed-assets/` (avatars, hangars, company logos)

## Integration Points

### Payments (Stripe)
- **Client:** `@stripe/react-stripe-js` + `@stripe/stripe-js` (CardElement, confirmPayment)
- **Server:** `stripe` lib creates PaymentIntent
- **Webhook:** `/api/hangarshare/webhook/stripe` handles payment events
- **Guides:** `STRIPE_SETUP.md`, `PAYMENT_INTEGRATION.md`

### Email (Resend)
- **Utility:** `src/utils/email.ts` (booking confirmation, owner notification, payment failures)
- **Trigger:** Stripe webhook dispatches emails
- **Guide:** `EMAIL_SETUP_GUIDE.md`

### WebSocket (Real-time)
- **Server:** `server.js` with Socket.io integration
- **Client Utils:** `src/utils/websocket-client.ts`, `src/hooks/useRealtimeMetrics.tsx`
- **Features:** JWT auth, 30s heartbeat, auto-reconnect
- **Test Console:** `public/test-websocket.html` (browser-based testing)

### HangarShare Marketplace
- **Routes:** `src/app/hangarshare/*` (owner setup, listing create, owner dashboard)
- **Admin Routes:** `src/app/admin/hangarshare-v2/*` (management interface)
- **APIs:** Airport search, owner management, listing approval
- **Reports:** PDF/CSV export via jsPDF + jspdf-autotable

## Admin System

### Role-Based Access Control (RBAC)
- **Permissions:** `src/utils/admin-permissions.ts` - complete permission matrix
- **Audit Logging:** `src/utils/admin-audit.ts` - tracks all admin actions
- **Components:** `src/components/admin-v2/` - reusable admin UI (MetricsCard, DataTable, FilterPanel, SearchBar, ActivityFeed)

### Admin Dashboard V2
- **Status:** Phase 1 complete (foundation components)
- **Location:** `/admin/v2/*` routes
- **Documentation:** See `ADMIN_DASHBOARD_V2_*` files (8 docs, 100KB total)
- **Features:** Real-time updates, advanced search/filtering, audit trails

## Critical Conventions

### Migrations
- ✅ Always create new file, never edit existing migrations
- ✅ Use `IF NOT EXISTS` for idempotent operations
- ✅ Create indexes for all foreign keys
- ✅ Update TypeScript types in `src/types/db.d.ts`

### Security
- ❌ Never expose secrets or credentials to client
- ✅ Hash passwords with `bcryptjs` before storing
- ✅ Validate JWT tokens on protected endpoints
- ✅ Log all admin actions for audit compliance

### State Management
- ✅ localStorage is source of truth for auth state
- ✅ Sync auth token with `JWT_SECRET`
- ✅ Clear storage on logout

### Known TODOs
- ⚠️ Some APIs use mock data - replace with real DB queries before production
- ⚠️ Photo upload not implemented - plan for S3 or local storage
- ⚠️ Some listing edit endpoints missing

## Reference Files

### Example Patterns
- **Auth Flow:** `src/app/login/page.tsx`
- **Dashboard Modules:** `src/app/page.tsx`
- **Admin Logic:** `src/app/admin/README.md`, `src/utils/admin-permissions.ts`

### Documentation
- **Quick Start:** `documentation/QUICK_START.md`, `documentation/START_HERE.md`
- **Features:** HangarShare, Email, Payment guides in `documentation/`
- **Setup:** `NEON_SETUP.md` (database), `DEPLOYMENT.md` (Netlify)
- **Status:** `SYSTEM_STATUS_REPORT_2026-01-23.md` (current state)

### Tool Assets
- **E6B Calculator:** `src/app/tools/e6b` (analog/digital flight computer)
- **Jeppesen Assets:** `public/e6b/jeppesen/README.md` (asset instructions)

---

**For complete documentation index, see:** `documentation/README.md`  
**For latest system status, see:** `SYSTEM_STATUS_REPORT_2026-01-23.md`
