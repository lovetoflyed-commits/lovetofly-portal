# Love to Fly Portal – Copilot Instructions

## 🚨 MANDATORY: Read These Files FIRST (In Order)
**STOP! Before making ANY changes, read these files in this exact order:**

1. **AGENT_START_HERE.md** (root) - Critical project context and onboarding
2. **logbook/AGENT_ACTIONS_LOG.md** - History of all agent actions, errors, and resolutions
3. **docs/records/active/PROJECT_SNAPSHOT_2026-01-29.md** - Current project state
4. **docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md** - All routes and APIs
5. **docs/records/active/DB_REORG_TASKS_2026-01-29.md** - Database reorganization tasks
6. **docs/records/active/AGENT_MANDATORY_UPDATE_RULES_2026-01-29.md** - Agent workflow rules

**After EVERY action you complete, you MUST update logbook/AGENT_ACTIONS_LOG.md with:**
- What was done
- Result achieved
- Errors encountered (or "No errors")
- Investigation steps
- How it was fixed
- How to verify the fix

## 🗄️ DATABASE CONFIGURATION (Critical - Read Carefully)

### ⚠️ IMPORTANT: Dual Database Configuration
**This project supports TWO database configurations:**

1. **Production/Cloud**: Neon PostgreSQL (Cloud) - Used in production via `DATABASE_URL`
2. **Local Development**: Local PostgreSQL - Database name MUST be `lovetofly-portal` (with hyphen)

**DO NOT use mock databases or different database names. Use only these two configurations.**

### Database Connection Details

#### Production/Cloud Database (Neon PostgreSQL)
- **Host**: `ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech`
- **Port**: `5432`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **SSL**: Required (`sslmode=require`)
- **Connection**: Configured via `DATABASE_URL` environment variable

#### Local Development Database (PostgreSQL)
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `lovetofly-portal` (⚠️ MUST use hyphen, not underscore)
- **User**: `postgres` (or your local user)
- **Connection**: Configured via individual `DB_*` environment variables when `DATABASE_URL` is not set

### Database Connection File
```typescript
// src/config/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback for local development when DATABASE_URL not set
  ...(process.env.DATABASE_URL ? {} : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lovetofly-portal', // ⚠️ MUST be 'lovetofly-portal'
    password: process.env.DB_PASSWORD || 'Master@51',
    port: Number(process.env.DB_PORT) || 5432,
  }),
});

export default pool;
```

### Environment Variables

**For Production/Cloud (Neon)**:
```bash
DATABASE_URL=postgresql://neondb_owner:password@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**For Local Development**:
```bash
# Option 1: Use DATABASE_URL pointing to local database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/lovetofly-portal

# Option 2: Use individual variables (DATABASE_URL takes precedence if set)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=yourpassword
DB_PORT=5432
```

### Database Usage Rules
1. **ALWAYS** import from `src/config/db.ts` - never create new connections
2. **For Production**: Set `DATABASE_URL` to Neon PostgreSQL
3. **For Local Development**: Either set `DATABASE_URL` to local PostgreSQL OR use `DB_*` variables
4. **Local database name MUST be** `lovetofly-portal` (with hyphen, cannot be changed)
5. **ALWAYS** use parameterized queries to prevent SQL injection
6. **NEVER** edit existing migration files - create new ones only
7. Check `docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md` for table status

## 📁 DOCUMENTATION ORGANIZATION (Critical)

### Document Storage Rules
- **NEVER** create new .md/.pdf/.txt files in the root directory
- **ALWAYS** create new docs in `docs/records/active/`
- Duplicates and outdated docs are in `docs/records/archive/`
- 366 .md files exist in root (legacy) - DO NOT add more

### Key Documentation Locations
- **Active Records**: `docs/records/active/` - Current, authoritative documentation
- **Archive**: `docs/records/archive/` - Old/duplicate files
- **Logbook**: `logbook/` - Agent action logs and history
- **General Docs**: `documentation/` - User guides and setup instructions

### Documentation Hierarchy
```
Root Level (Read-Only - Don't Add Files Here):
├── AGENT_START_HERE.md (START HERE!)
├── README.md
└── [366 legacy .md files]

Active Documentation (Write Here):
├── docs/records/active/ (✅ Add new docs here)
├── logbook/ (✅ Update action logs here)
└── documentation/ (User-facing guides)
```

## 🏗️ PROJECT STRUCTURE

### Big Picture
- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Neon (Cloud)
- **Auth**: JWT with localStorage token, useAuth() hook
- **i18n**: useLanguage() hook, translations in JSON files
- **Deployment**: Netlify (https://lovetofly.com.br)
- **Domain**: lovetofly.com.br (GoDaddy DNS, Netlify hosting)

### Major Feature Areas
- **HangarShare** - Hangar rental marketplace (part of this portal, NOT a separate domain)
- **Classifieds** - Aircraft, avionics, parts listings
- **Careers** - Job board for aviation industry
- **Courses** - Aviation training courses
- **Logbook** - Digital flight logbook
- **Marketplace** - General aviation marketplace
- **Weather** - Aviation weather tools
- **Flight Planning** - Route planning tools
- **E6B Tools** - Aviation calculators
- **Admin System** - Admin dashboard v2, permissions, audit logs

### API Architecture
- API routes in `src/app/api/` (colocated with route handlers)
- All APIs return: `NextResponse.json({ data|message }, { status })`
- All APIs use try/catch with descriptive console.error
- Auth via `Authorization: Bearer <token>` headers
- Client state from `useAuth()` context

### File Structure
```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/               # API route handlers
│   └── [feature]/         # Feature pages
├── components/            # Shared React components
├── config/                # Configuration (db.ts, etc.)
│   └── db.ts             # ⚠️ ONLY database connection
├── context/              # React contexts (AuthContext, LanguageContext)
├── migrations/           # Database migrations (never edit existing!)
├── types/                # TypeScript definitions
└── utils/                # Utility functions
```

## 🔄 KEY WORKFLOWS

### Development Commands
```bash
npm run dev          # Start dev server (uses server.js)
npm run dev:debug    # Debug mode
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e     # Playwright E2E tests
npm run test:all     # All tests
```

### Database Commands
```bash
npm run migrate:up     # Run new migrations
npm run migrate:down   # Rollback migration
npm run migrate:create # Create new migration
npm run seed:dev       # Seed development data
```

### Migration Rules
1. Migrations are in `src/migrations/` as `00X_description.sql`
2. **NEVER** edit existing migration files
3. Always create NEW migrations for schema changes
4. Migrations must be idempotent (safe to run multiple times)
5. Create indexes for all foreign keys
6. Update TypeScript types in `src/types/` after schema changes

## ⚠️ COMMON PITFALLS & HOW TO AVOID THEM

### 1. Database Confusion
❌ **DON'T**: Create new pg.Pool() instances or use different database names  
✅ **DO**: Always use `import pool from '@/config/db'` and database name `lovetofly-portal` for local dev

### 2. Documentation Clutter
❌ **DON'T**: Create new .md files in root directory  
✅ **DO**: Create files in `docs/records/active/` and update logbook

### 3. Migration Errors
❌ **DON'T**: Edit existing migration files  
✅ **DO**: Create a new migration file with the changes

### 4. Incomplete Action Logs
❌ **DON'T**: Skip updating `logbook/AGENT_ACTIONS_LOG.md`  
✅ **DO**: Update the log after EVERY action with full details

### 5. Wrong Project Context
❌ **DON'T**: Treat HangarShare as a separate domain/project  
✅ **DO**: Understand HangarShare is a feature within Love to Fly Portal

### 6. Ignoring Project State
❌ **DON'T**: Start work without reading mandatory files  
✅ **DO**: Read AGENT_START_HERE.md and logbook first

## 🔐 SECURITY & BEST PRACTICES

### Authentication
- JWT tokens stored in localStorage
- Protected routes use AuthGuard component
- Server validates tokens via `Authorization: Bearer <token>`
- Client state via `useAuth()` hook

### API Patterns
- Always use parameterized queries (never string concatenation)
- Validate all inputs server-side
- Return consistent error formats
- Log errors with console.error (descriptive messages)

### Data Validation
- Client-side validation for UX
- Server-side validation for security
- Use TypeScript types for compile-time safety

## 🔌 INTEGRATIONS

### Stripe Payment Processing
- Client: `@stripe/react-stripe-js`
- Server: `stripe` package
- Webhooks: API routes handle Stripe events
- **Never** use explicit `apiVersion` parameter (use SDK default)

### Email (Resend)
- Configured via `RESEND_API_KEY` environment variable
- Send transactional emails for notifications

### WebSocket (Real-time)
- WebSocket server in `server.js`
- Server manager and hooks for real-time statistics
- Used for live updates in admin dashboard

## 📊 PROJECT STATUS & INVENTORY

### Current Stats (as of 2026-01-29)
- **Pages**: 109 detected
- **API Routes**: 176 detected
- **Database Tables**: 65 in production (some unused, see DB_REORG_TASKS)
- **Documentation Files**: 366 .md files in root (being reorganized)

### Active Tasks
- Database reorganization (see `docs/records/active/DB_REORG_TASKS_2026-01-29.md`)
- Documentation consolidation (ongoing)
- Table validation and cleanup (in progress)

## 📚 ADDITIONAL REFERENCES

### For Detailed Information, See:
- **Setup**: `documentation/SETUP_AND_CONNECTIONS.md`
- **API Docs**: `documentation/API_DOCUMENTATION.md`
- **Deployment**: `documentation/DEPLOYMENT.md`
- **HangarShare**: `documentation/HANGARSHARE_COMPLETE_GUIDE.md`
- **Email Setup**: `documentation/EMAIL_SETUP_GUIDE.md`

### For Project State:
- **Route Inventory**: `docs/records/active/PROJECT_ROUTE_INVENTORY_2026-01-29.md`
- **Database Status**: `docs/records/active/DB_VALIDATION_REPORT_2026-01-29.md`
- **Functionality Report**: `docs/records/active/FUNCTIONALITY_REPORT_2026-01-28.md`

## 🎯 AGENT WORKFLOW CHECKLIST

Before starting any task:
- [ ] Read AGENT_START_HERE.md
- [ ] Review logbook/AGENT_ACTIONS_LOG.md for recent context
- [ ] Check docs/records/active/ for relevant documentation
- [ ] Understand which database to use (Neon PostgreSQL only)
- [ ] Know where to create new documentation files

After completing any action:
- [ ] Update logbook/AGENT_ACTIONS_LOG.md with full details
- [ ] Create/update relevant docs in docs/records/active/
- [ ] Test changes thoroughly
- [ ] Verify database connections use correct source
- [ ] Check for any unintended file creation in root

## 💡 QUICK TIPS

1. **When in doubt about the database**: Check `src/config/db.ts` and `.env.example`
2. **When in doubt about project structure**: Read `AGENT_START_HERE.md`
3. **When in doubt about what was done before**: Check `logbook/AGENT_ACTIONS_LOG.md`
4. **When in doubt about current tasks**: See `docs/records/active/DB_REORG_TASKS_2026-01-29.md`

---

**Remember**: This portal is a comprehensive aviation platform with multiple features. HangarShare is ONE feature within it, not a separate project. The database is Neon PostgreSQL in the cloud, and all documentation should go in organized folders, not in the root directory.
