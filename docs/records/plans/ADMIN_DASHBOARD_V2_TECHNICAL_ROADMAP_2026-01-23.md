# Admin Dashboard V2 - Implementation Roadmap & Architecture
**Date:** January 23, 2026

---

## 🏗️ HIGH-LEVEL ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD V2 ARCHITECTURE                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER (React)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐   │
│  │ Admin Dashboard │  │ Real-Time Updates│  │ Notification Center     │   │
│  │                 │  │ (WebSocket)      │  │ (Toast/Modal Alerts)    │   │
│  │ - Tab: Overview │  │                  │  │                         │   │
│  │ - Tab: HangarS. │  │ Metrics stream   │  │ - Owner verified        │   │
│  │ - Tab: Users    │  │ Activity feed    │  │ - Listing approved      │   │
│  │ - Tab: Fin.     │  │ Instant alerts   │  │ - Booking conflict      │   │
│  │ - Tab: Comp.    │  │                  │  │ - Error notifications   │   │
│  └─────────────────┘  └──────────────────┘  └─────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   SHARED COMPONENT LIBRARY                          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ MetricsCard  │ DataTable  │ FilterPanel  │ SearchBar │ ActivityFeed │  │
│  │ ChartPanel   │ Modal      │ Pagination   │ Dropdown  │ Skeleton Loader│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STATE MANAGEMENT (Zustand)                       │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ - User context (permissions, role)                                  │  │
│  │ - Module state (activeTab, filters, pagination)                     │  │
│  │ - Real-time connection state (connected, latency)                   │  │
│  │ - Notifications queue                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  DATA FETCHING (TanStack Query)                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ - Caching: In-memory + localStorage                                 │  │
│  │ - Deduplication: Same request = one network call                   │  │
│  │ - Stale time: 30s (keep data fresh)                                │  │
│  │ - GC time: 5 min (clean unused cache)                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (REST)
                                    │ WebSocket (WS)
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API LAYER (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      REST API Routes                                │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ GET  /api/admin/v2/metrics/cached      (no DB hit, use cache)       │  │
│  │ GET  /api/admin/v2/search?q=term        (search across modules)     │  │
│  │ GET  /api/admin/v2/owners?page=1        (paginated + filtered)      │  │
│  │ POST /api/admin/v2/owners/[id]/verify   (action with audit log)     │  │
│  │ GET  /api/admin/v2/audit-log            (admin activity stream)     │  │
│  │ POST /api/admin/v2/export               (CSV, PDF export)           │  │
│  │ POST /api/admin/v2/saved-filters        (user's filter views)       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   WebSocket Handler                                 │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Event Subscriptions:                                                 │  │
│  │ - owner:verified → broadcast to all admins                          │  │
│  │ - listing:approved → update metrics cache                           │  │
│  │ - booking:conflict → alert specific admins                          │  │
│  │ - admin:action → log activity feed + audit trail                    │  │
│  │                                                                      │  │
│  │ Handlers (socket.io middleware):                                    │  │
│  │ - Authentication: JWT validation                                    │  │
│  │ - Authorization: Permission checks                                  │  │
│  │ - Rate limiting: 100 msgs/min per socket                            │  │
│  │ - Heartbeat: 30s ping/pong                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   Permission Middleware                             │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ - Check: user.can('view:hangarshare')                               │  │
│  │ - Check: user.can('approve:owners')                                 │  │
│  │ - Enforce: Role-based access (RBAC)                                 │  │
│  │ - Audit: Log all permission denials                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Caching Layer (Redis)                            │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Cache Keys:                                                          │  │
│  │ - metrics:overview → { pending, verified, revenue, ... }            │  │
│  │ - metrics:hangarshare → { occupancy, revenue_trend, ... }           │  │
│  │ - search:results:{term} → { users, listings, bookings, ... }        │  │
│  │ - user:permissions:{user_id} → [can_approve, can_export, ...]       │  │
│  │                                                                      │  │
│  │ TTL Strategy:                                                        │  │
│  │ - Metrics: 5 min (refresh often, data changes frequently)            │  │
│  │ - Permissions: 15 min (stable, change rarely)                       │  │
│  │ - Search results: 1 min (user might sort/filter, reduce stale)       │  │
│  │ - User data: 30 min (profile changes rarely)                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL Queries
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (PostgreSQL/Neon)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Existing Tables:                                                          │
│  - users, hangar_owners, hangar_listings, hangar_bookings                 │
│  - user_roles, user_permissions                                            │
│                                                                             │
│  NEW Tables (V2):                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ admin_metrics_cache                                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ id | metric_key | metric_value | last_updated | ttl (sec)           │  │
│  │ pk | UNIQUE     | JSONB        | timestamp    | int                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ audit_logs (new)                                                     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ id | admin_id | action | entity_type | entity_id | changes | ts     │  │
│  │ pk | FK users | str    | str         | UUID      | JSONB   | ts     │  │
│  │    | idx      | idx    | idx         | idx       |         | idx    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ admin_saved_filters                                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ id | admin_id | module | filter_name | filter_config | is_default   │  │
│  │ pk | FK       | str    | str         | JSONB         | bool         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ admin_activity_feed                                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ id | admin_id | event_type | message | severity | entity_* | ts     │  │
│  │ pk | FK       | str        | text    | enum     | FK, str  | ts idx │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

```

---

## 📋 DEVELOPMENT TIMELINE

### Phase 1: Foundation & Core Components (Week 1) - 16 hours
**Goal:** Build reusable component library and real-time infrastructure

```
Day 1-2 (8h): Component Library Setup
├─ MetricsCard.tsx (drill-down, status colors, trends)
├─ DataTable.tsx (pagination, sorting, filtering, row actions)
├─ FilterPanel.tsx (multi-field filters, save/load)
├─ SearchBar.tsx (global search, suggestions)
└─ ActivityFeed.tsx (real-time event stream)

Day 3-5 (8h): Real-Time Infrastructure
├─ WebSocket integration in server.js
├─ Metrics aggregator (caching, TTL management)
├─ Activity stream event listeners
├─ Audit logging system
└─ Permission middleware
```

**Deliverables:**
- [ ] 5+ reusable components in `/src/components/admin-v2/`
- [ ] WebSocket routes `/ws/admin/*`
- [ ] API route `/api/admin/v2/metrics/cached`
- [ ] Database tables: `audit_logs`, `admin_activity_feed`
- [ ] TypeScript types for all components

---

### Phase 2: HangarShare Management (Week 2) - 20 hours
**Goal:** Build complete HangarShare admin module with real-time updates

```
Day 1-2 (8h): Owner Management
├─ OwnersList.tsx (paginated table, verify/reject actions)
├─ OwnerDetail.tsx (full profile, documents, verification history)
├─ OwnerVerificationModal.tsx (approval workflow)
└─ OwnerAnalytics.tsx (revenue, listings, ratings)

Day 3-4 (8h): Listing Management
├─ ListingsList.tsx (filter by status, city, price range)
├─ ListingDetail.tsx (full listing view, edit, photos)
├─ ListingApprovalWorkflow.tsx (approval/rejection with notes)
└─ ListingAnalytics.tsx (views, bookings, occupancy)

Day 5 (4h): Booking Conflict Resolution
├─ BookingConflictList.tsx (highlight conflicts)
├─ ConflictResolutionModal.tsx (manual approval/denial)
└─ BookingAnalytics.tsx (revenue, completion rate)
```

**Deliverables:**
- [ ] `/admin/v2/hangarshare` routes (overview, owners, listings, bookings)
- [ ] 3 new API routes for HangarShare actions (verify owner, approve listing, resolve conflict)
- [ ] Real-time metrics updates for HangarShare module
- [ ] Comprehensive audit logs for all actions
- [ ] Mobile-responsive UI

---

### Phase 3: User Management & Advanced Search (Week 3) - 18 hours
**Goal:** Global search and user/role management

```
Day 1-2 (8h): Global Search System
├─ GlobalSearchBar.tsx (full-text search)
├─ SearchResults.tsx (users, listings, bookings, owners)
├─ SearchResultCard.tsx (context preview for each type)
└─ SearchSuggestions.tsx (autocomplete, recent searches)

Day 3-4 (8h): User Management
├─ UsersList.tsx (paginated, advanced filters)
├─ UserDetail.tsx (full profile, roles, permissions, activity)
├─ RoleAssignment.tsx (change user role, grant/revoke permissions)
└─ UserActivityLog.tsx (login history, actions, warnings)

Day 5 (2h): Admin Activity Dashboard
├─ AuditLogViewer.tsx (filter by admin, action, date range)
└─ AdminActivityStats.tsx (who did what, when)
```

**Deliverables:**
- [ ] `/api/admin/v2/search` endpoint with full-text search
- [ ] `/admin/v2/users` management pages
- [ ] Audit log viewer (`/admin/v2/audit-logs`)
- [ ] Advanced filtering across all modules
- [ ] Saved filter functionality

---

### Phase 4: Analytics & Reporting (Week 4) - 16 hours
**Goal:** Financial dashboards, charts, and data export

```
Day 1-2 (8h): Financial Dashboard
├─ RevenueChart.tsx (monthly trends, period comparison)
├─ TransactionList.tsx (bookings, payments, refunds)
├─ DisputeLog.tsx (chargeback tracking)
└─ FinancialMetrics.tsx (MRR, ARR, COGS, margin)

Day 3-4 (6h): Data Export
├─ ExportModal.tsx (CSV, PDF, Excel format selection)
├─ ExportService.ts (generate files, handle large datasets)
└─ ScheduledReports.tsx (email daily/weekly summaries)

Day 5 (2h): Custom Reports
├─ ReportBuilder.tsx (select metrics, date range, filters)
└─ SavedReports.tsx (manage custom reports)
```

**Deliverables:**
- [ ] `/admin/v2/finance` dashboard with charts
- [ ] Export API endpoint `/api/admin/v2/export`
- [ ] Report generation and email delivery
- [ ] Performance analysis tools

---

### Phase 5: Optimization & Polish (Week 5) - 12 hours
**Goal:** Performance, accessibility, and refinement

```
Day 1-2 (6h): Performance Optimization
├─ Profiling (React DevTools, Chrome Performance)
├─ Code splitting (lazy load admin modules)
├─ Image optimization (chart thumbnails, user avatars)
└─ Bundle size analysis (tree-shaking unused code)

Day 3-4 (4h): Accessibility & UX Polish
├─ Keyboard navigation (Tab, Enter, Escape, arrow keys)
├─ ARIA labels for screen readers
├─ Dark mode toggle (optional but nice)
└─ Mobile responsiveness testing (iPad, mobile view)

Day 5 (2h): Documentation & Handoff
├─ Component storybook
├─ Admin user guide (screenshots, workflow docs)
└─ Developer documentation (architecture, API docs)
```

**Deliverables:**
- [ ] < 1s page load time
- [ ] < 100ms WebSocket latency
- [ ] WCAG 2.1 AA compliance
- [ ] Mobile-first responsive design
- [ ] Complete documentation

---

## 🎯 SUCCESS CRITERIA (Gating Tests)

### Phase 1 Gate
- [ ] All 5 components render correctly in Storybook
- [ ] WebSocket connects with < 50ms latency
- [ ] Metrics cache TTL working (Redis or in-memory)
- [ ] Audit log captures all admin actions
- [ ] Permission checks block unauthorized access

### Phase 2 Gate
- [ ] Owner verification workflow works end-to-end
- [ ] Listing approval captures before/after state
- [ ] Booking conflicts display correctly
- [ ] All actions logged to audit_logs table
- [ ] Real-time metrics update in < 100ms

### Phase 3 Gate
- [ ] Global search returns results in < 500ms
- [ ] Search across users/listings/bookings/owners
- [ ] User role assignment persists
- [ ] Audit log filterable by admin/action/date
- [ ] Mobile view readable on iPhone 12

### Phase 4 Gate
- [ ] Financial dashboard loads in < 2s
- [ ] Export generates CSV for 10K+ records
- [ ] PDF export includes charts
- [ ] Scheduled reports email correctly
- [ ] Custom reports save and load

### Phase 5 Gate
- [ ] Lighthouse score > 90 (Performance)
- [ ] WCAG 2.1 AA validation passes
- [ ] Dark mode toggle works
- [ ] Keyboard-only navigation complete
- [ ] All documentation current

---

## 📦 FOLDER STRUCTURE

```
src/
├── components/
│   └── admin-v2/                      # NEW: V2 Components
│       ├── MetricsCard.tsx
│       ├── DataTable.tsx
│       ├── FilterPanel.tsx
│       ├── SearchBar.tsx
│       ├── ActivityFeed.tsx
│       ├── SkeletonLoader.tsx
│       └── index.ts                   # Barrel export
│
├── app/
│   └── admin/
│       ├── v2/                        # NEW: V2 Routes
│       │   ├── page.tsx               # Dashboard hub
│       │   ├── layout.tsx             # V2 layout
│       │   ├── hangarshare/
│       │   │   ├── page.tsx           # Overview
│       │   │   ├── owners/
│       │   │   │   ├── page.tsx       # List
│       │   │   │   └── [id]/          # Detail
│       │   │   ├── listings/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/
│       │   │   └── bookings/
│       │   │       ├── page.tsx
│       │   │       └── conflicts/     # NEW: Conflicts view
│       │   │
│       │   ├── users/
│       │   │   ├── page.tsx           # List
│       │   │   └── [id]/
│       │   │       └── page.tsx       # Detail
│       │   │
│       │   ├── finance/
│       │   │   └── page.tsx           # Financial dashboard
│       │   │
│       │   ├── audit-logs/
│       │   │   └── page.tsx           # Audit log viewer
│       │   │
│       │   └── settings/
│       │       └── page.tsx           # Admin settings
│       │
│       └── page.tsx                   # Current V1 (legacy)
│
├── api/
│   └── admin/
│       ├── v2/                        # NEW: V2 API Routes
│       │   ├── metrics/
│       │   │   └── cached/
│       │   │       └── route.ts       # GET cached metrics
│       │   ├── search/
│       │   │   └── route.ts           # GET global search
│       │   ├── owners/
│       │   │   ├── route.ts           # GET/POST owners
│       │   │   └── [id]/
│       │   │       ├── verify/route.ts
│       │   │       └── reject/route.ts
│       │   ├── listings/
│       │   ├── bookings/
│       │   ├── export/
│       │   │   └── route.ts           # POST export
│       │   ├── saved-filters/
│       │   ├── audit-log/
│       │   │   └── route.ts           # GET audit logs
│       │   └── ws/                    # WebSocket routes
│       │       ├── metrics/route.ts
│       │       └── activity/route.ts
│       │
│       └── stats/                     # Current V1 (legacy)
│           └── route.ts
│
├── types/
│   ├── admin.ts                       # NEW: Admin types
│   ├── api.ts                         # API response types
│   └── permissions.ts                 # Permission types
│
├── utils/
│   ├── websocket.ts                   # WS client utilities
│   ├── admin-cache.ts                 # NEW: Cache utilities
│   ├── permissions.ts                 # Permission checks
│   └── audit.ts                       # NEW: Audit logging
│
├── hooks/
│   ├── useAdminSearch.ts              # NEW: Search hook
│   ├── useMetrics.ts                  # NEW: Metrics hook
│   ├── useFilters.ts                  # NEW: Filter hook
│   ├── useWebSocket.ts                # Existing WS hook
│   └── usePermissions.ts              # Permission hook
│
├── context/
│   ├── AdminContext.tsx               # NEW: Admin state
│   ├── AuthContext.tsx                # Existing
│   └── LanguageContext.tsx            # Existing
│
├── migrations/
│   ├── ...
│   └── 0XX_admin_dashboard_v2_schema.sql  # NEW: Tables
│
└── public/
    └── test-websocket.html            # Existing: WS test
```

---

## 🔐 PERMISSION MATRIX

```
Role       | view:admin | manage:owners | manage:listings | manage:users | view:finance | export:data
-----------|------------|---------------|-----------------|--------------|--------------|------------
master     | ✓         | ✓             | ✓               | ✓            | ✓            | ✓
admin      | ✓         | ✓             | ✓               | ✓            | ✗            | ✓
staff      | ✓         | ✓             | ✓               | ✗            | ✗            | ✗
moderator  | ✓         | ✗             | ✗               | ✗            | ✗            | ✗
user       | ✗         | ✗             | ✗               | ✗            | ✗            | ✗
```

---

## 💡 KEY FEATURES BREAKDOWN

### Real-Time Metrics (WebSocket)
- Owner verification events → broadcast to all admins
- Listing approval/rejection → update metrics cache
- Booking creation/conflict → alert relevant admins
- Admin actions → activity feed + audit log

### Search System
- Global search bar with autocomplete
- Index across: users, owners, listings, bookings
- Filters: status, date range, city, price, rating
- Saved filter views (named, shareable)
- Search history + frequently used

### Audit System
- Every admin action logged: `{ admin_id, action, entity, before/after, timestamp }`
- Queryable by: admin, action type, entity, date range
- Exportable for compliance
- Real-time activity feed

### Caching Strategy
```
Cache Level 1: In-Memory (React Query)
├─ User state, filter state, search results
├─ TTL: 5 min (auto-refetch stale)
└─ Size: ~5MB

Cache Level 2: Redis (backend)
├─ Metrics cache (metrics:overview, metrics:hangarshare:...)
├─ Permission cache (user:permissions:{user_id})
├─ Search results (search:results:{term})
└─ TTL: 5-30 min (depends on data volatility)

Cache Level 3: Database
└─ Source of truth (PostgreSQL)
```

---

## 🧪 TESTING STRATEGY

```
Unit Tests:
└─ Component rendering, data transformations, utilities

Integration Tests:
├─ API route + database (verify owner workflow)
├─ WebSocket + real-time updates
├─ Permission enforcement
└─ Audit logging

E2E Tests (Cypress):
├─ Admin login → dashboard load
├─ Search users → click result → view profile
├─ Verify owner → check audit log
├─ Export data → download CSV
└─ Filter saved → reload page → filter persists

Performance Tests:
├─ Page load time < 1s
├─ WebSocket latency < 100ms
├─ Cache hit rate > 80%
├─ Memory usage < 50MB
└─ List rendering (1000+ items) < 1s
```

---

## ✨ NICE-TO-HAVE FEATURES (Post-MVP)

1. **Keyboard Shortcuts**
   - `Cmd+K` → Global search
   - `?` → Shortcuts help
   - `Esc` → Close modals

2. **Notifications**
   - Browser push notifications
   - Email alerts for critical events

3. **Webhooks**
   - Outbound webhooks for external systems
   - Event filtering + retry logic

4. **Advanced Analytics**
   - Predictive trends
   - Anomaly detection
   - Custom dashboards

5. **Team Collaboration**
   - Comments on entities (owners, listings)
   - @mentions notifications
   - Shared workspaces

6. **API Integration**
   - Integrate with Slack for notifications
   - Zapier webhook support
   - Bulk import/export tools

---

**Report Status:** ✅ COMPLETE & ACTIONABLE
**Next Action:** Executive approval + Phase 1 sprint planning

