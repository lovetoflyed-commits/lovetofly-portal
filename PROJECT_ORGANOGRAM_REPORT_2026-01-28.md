# Love to Fly Portal — Full Project Organogram & Area Catalog (2026-01-28)

## 1) Executive Overview
This report maps the full project content into a hierarchical organogram and a categorized catalog of areas/sub-areas. It covers runtime application layers, APIs, shared infrastructure, assets, testing, tooling, and documentation.

## 2) Organogram (High‑Level Structure)
- Workspace Root
  - Application Source
    - App Routes (Next.js App Router)
    - API Routes (Route Handlers)
    - Shared UI Components
    - Context & Hooks
    - Lib/Services/Utils
    - Types & Config
  - Data Layer
    - Migrations & Archives
    - SQL & DB Setup Scripts
  - Static Assets
    - Public Assets (charts, logos, uploads, e6b, classifieds)
  - Testing
    - Unit/Integration/E2E (Jest/Playwright)
  - Tooling & Automation
    - Scripts, generators, verification tools
  - Infrastructure & Runtime
    - Server, Next.js, Sentry, Tailwind, PostCSS
  - Documentation & Reports
    - Docs / Documentation
    - Project reports and audit files

## 3) Organogram (Detailed Tree by Folders)
### 3.1 Application Source
- src/
  - app/
    - Public/Member Areas
      - landing/, login/, register/, forgot-password/
      - profile/ (bookings, edit, notifications)
      - support/, privacy/, terms/
      - forum/, forum/topics/
      - courses/
      - career/ (companies, jobs, profile, resume, my-applications)
      - mentorship/
      - marketplace/
      - classifieds/ (aircraft, avionics, parts, checkout)
      - classifieds-preview/
      - hangarshare/ (owner, booking, gallery, favorites, search, listing)
      - logbook/
      - weather/ (radar)
      - flight-plan/
      - simulator/
      - tools/ (e6b, ifr-simulator, glass-cockpit)
      - e6b/ and computador-de-voo/
      - traslados/ (owners, pilots, messages, status)
      - procedures/ ([icao])
    - Admin Areas
      - admin/ (dashboard, users, moderation, verifications)
      - admin/hangarshare/ and admin/hangarshare-v2/
      - admin/traslados/
      - admin/financial/, admin/finance/, admin/bookings/, admin/listings/
      - admin/business/, admin/commercial/, admin/marketing/, admin/compliance/, admin/documents/
    - Staff Areas
      - staff/ (dashboard, reservations, verifications, reports)
    - API Routes
      - api/auth/, api/login/, api/register/, api/user/
      - api/admin/ (admin capabilities)
      - api/traslados/, api/hangarshare/
      - api/classifieds/, api/career/, api/logbook/
      - api/weather/, api/notam/, api/charts/
      - api/notifications/, api/forum/, api/news/
      - api/coupons/, api/address/, api/membership/
      - api/analytics/, api/moderation/, api/ws/
  - components/
    - ads/, admin-v2/, hangarshare-v2/, tools/
  - context/
  - hooks/
  - lib/
  - services/
  - utils/
  - config/
  - types/
  - translations/
  - migrations/ + migrations_archive/
  - __tests__/ (api, integration, e2e)

### 3.2 Data Layer & DB Tooling
- src/migrations/
- src/migrations_archive/
- SQL/JS helpers at root (migration runners and setup files)

### 3.3 Static Assets
- public/
  - charts/ (aerodrome procedure charts by ICAO and type)
  - LOGOS_LTF/
  - e6b/ (Jeppesen + tools assets)
  - classifieds/
  - uploads/ (verification)
  - thumbnails/

### 3.4 Testing & QA
- src/__tests__/ (api, integration, e2e)
- tests/ (integration)
- playwright.config.ts + playwright-report/
- test scripts at root (shell/js)

### 3.5 Tooling & Automation
- scripts/
- data generators (e.g., e6b placeholders, images)
- verification tools and one-off utilities

### 3.6 Infrastructure & Runtime
- server.js (custom Next.js server)
- next.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js
- sentry.*.config.ts
- package.json, eslint.config.mjs

### 3.7 Documentation & Reports
- docs/
- documentation/
- Numerous top-level MD/PDF reports and audits

## 4) Area Catalog (Sorted by Category and Sub‑Category)
### 4.1 Product & User-Facing Areas
- Onboarding & Auth
  - Register, Login, Forgot Password
- User Account
  - Profile, Edit Profile, Notifications, Bookings
- Content & Community
  - Forum + Topics
  - Courses
- Career Module
  - Jobs, Companies, Resume, Profile, Applications
- Marketplace & Commerce
  - Marketplace
  - Classifieds (Aircraft, Avionics, Parts, Checkout)
- HangarShare
  - Search, Listing, Gallery, Favorites, Booking, Owner
- Logbook
- Weather
  - Radar
- Flight Planning & Tools
  - Flight Plan
  - E6B / Computer de Voo
  - IFR Simulator
  - Glass Cockpit
- Simulator
- Traslados (Aircraft Transfers)
  - Owners, Pilots, Messages, Status
- Procedures
  - ICAO-based procedure access

### 4.2 Admin Areas (Management & Oversight)
- Admin Dashboard
- User Management & Verification
- Moderation
- HangarShare Management (legacy + v2)
- Traslados Management
- Financial/Finance/Bookings
- Listings Management
- Business/Commercial/Marketing/Compliance/Docs

### 4.3 Staff Areas
- Staff Dashboard
- Reservations
- Verifications
- Reports

### 4.4 API & Backend Surface
- Authentication & Session
- User & Membership
- Admin Operations
- HangarShare
- Traslados
- Classifieds
- Career
- Logbook
- Weather / NOTAM / Charts
- Notifications
- Forum / News
- Coupons / Address
- Analytics / Moderation / Websocket

### 4.5 Shared UI & Frontend Infrastructure
- Components (ads, tools, admin-v2, hangarshare-v2)
- Context (auth/language)
- Hooks
- Utilities / Services / Lib
- Config / Types / Translations

### 4.6 Data, Migrations & Persistence
- Migrations (current + archive)
- DB setup / migration scripts
- Seed & setup utilities

### 4.7 Assets & Media
- Airport charts (procedures by ICAO)
- Logos, E6B assets, classifieds images
- Uploads and thumbnails

### 4.8 Testing & QA
- Jest unit/integration tests
- Playwright E2E config and reports
- Shell-based verification scripts

### 4.9 Tooling & Ops
- Build/lint/test configs
- Sentry configs
- Custom server
- Scripts and generators

### 4.10 Documentation & Knowledge Base
- docs/
- documentation/
- Top‑level reports, audits, and plans

## 5) Notable Cross‑Cutting Capabilities
- Internationalization via translations
- Admin + Staff separation of duties
- Multiple aviation domains (HangarShare, Traslados, Weather, Procedures, Tools)
- Extensive documentation and audit trail

## 6) Recommended Next Inventory Enhancements (Optional)
- Auto‑generated page index and API endpoint list
- Asset catalog size summary (charts count, uploads)
- Test coverage map by domain
