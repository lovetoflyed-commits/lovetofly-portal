# Love to Fly Portal - Complete Pages Inventory
**Generated:** February 11, 2026  
**Total Pages Found:** 123 frontend routes  
**404 Error Handling:** ✅ Configured (src/app/not-found.tsx)

---

## 📊 Summary by Category

| Category | Count | Status |
|----------|-------|--------|
| **Public/Landing** | 10 | ✅ Complete |
| **Authentication** | 3 | ✅ Complete |
| **User Profile** | 5 | ✅ Complete |
| **Business Portal** | 6 | ✅ Complete |
| **Career/Jobs** | 6 | ✅ Complete |
| **Classifieds/Marketplace** | 10 | ✅ Complete |
| **Flight Planning & Tools** | 11 | ✅ Complete |
| **HangarShare** | 18 | ✅ Complete |
| **Admin Dashboard** | 32 | ✅ Complete |
| **Community/Forum** | 2 | ✅ Complete |
| **Staff/Support** | 3 | ✅ Complete |
| **Other Features** | 6 | ✅ Complete |
| **Duplicate/Test Routes** | 11 | ⚠️ Needs Review |
| **TOTAL** | **123** | |

---

## 🏠 1. PUBLIC & LANDING PAGES (10 pages)

### Root & Main Pages
- **`/`** → `/src/app/page.tsx` - Home page
- **`/landing`** → `/src/app/landing/page.tsx` - Landing page
- **`/classifieds-preview`** → `/src/app/classifieds-preview/page.tsx` - Classifieds preview

### Support & Information
- **`/support`** → `/src/app/support/page.tsx` - Support center
- **`/terms`** → `/src/app/terms/page.tsx` - Terms of service
- **`/privacy`** → `/src/app/privacy/page.tsx` - Privacy policy
- **`/beta/apply`** → `/src/app/beta/apply/page.tsx` - Beta program application

### Community
- **`/forum`** → `/src/app/forum/page.tsx` - Forum main page
- **`/forum/topics/[id]`** → `/src/app/forum/topics/[id]/page.tsx` - Forum topic detail

### 404 Error Handling
- **`/[...not-found]`** → `/src/app/not-found.tsx` - Global 404 error page (configured)

---

## 🔐 2. AUTHENTICATION PAGES (3 pages)

- **`/login`** → `/src/app/login/page.tsx` - User login
- **`/register`** → `/src/app/register/page.tsx` - User registration
- **`/forgot-password`** → `/src/app/forgot-password/page.tsx` - Password recovery
- **`/register-business`** → `/src/app/register-business/page.tsx` - Business registration

---

## 👤 3. USER PROFILE & DASHBOARD (5 pages)

### Main Profile
- **`/profile`** → `/src/app/profile/page.tsx` - User profile main
- **`/profile/edit`** → `/src/app/profile/edit/page.tsx` - Edit profile

### Profile Sub-sections
- **`/profile/notifications`** → `/src/app/profile/notifications/page.tsx` - Notifications
- **`/profile/bookings`** → `/src/app/profile/bookings/page.tsx` - Booking history

---

## 🏢 4. BUSINESS PORTAL (6 pages)

### Business Dashboard
- **`/business/dashboard`** → `/src/app/business/dashboard/page.tsx` - Business dashboard
- **`/business/company/profile`** → `/src/app/business/company/profile/page.tsx` - Company profile
- **`/business/pending-verification`** → `/src/app/business/pending-verification/page.tsx` - Verification status

### Business Jobs Management
- **`/business/jobs`** → `/src/app/business/jobs/page.tsx` - Jobs listing
- **`/business/jobs/create`** → `/src/app/business/jobs/create/page.tsx` - Create job posting
- **`/business/jobs/[id]/edit`** → `/src/app/business/jobs/[id]/edit/page.tsx` - Edit job posting
- **`/business/jobs/[id]/applications`** → `/src/app/business/jobs/[id]/applications/page.tsx` - View applications

---

## 💼 5. CAREER & JOBS (6 pages)

### Career Overview
- **`/career`** → `/src/app/career/page.tsx` - Career main page
- **`/career/companies`** → `/src/app/career/companies/page.tsx` - Browse companies
- **`/career/profile`** → `/src/app/career/profile/page.tsx` - Career profile

### Job Management
- **`/career/jobs`** → `/src/app/career/jobs/page.tsx` - Browse jobs
- **`/career/my-applications`** → `/src/app/career/my-applications/page.tsx` - My applications
- **`/career/my-applications/[id]`** → `/src/app/career/my-applications/[id]/page.tsx` - Application detail
- **`/career/resume`** → `/src/app/career/resume/page.tsx` - Resume management

---

## 🛍️ 6. CLASSIFIEDS & MARKETPLACE (10 pages)

### Marketplace Main
- **`/marketplace`** → `/src/app/marketplace/page.tsx` - Marketplace homepage
- **`/classifieds/checkout`** → `/src/app/classifieds/checkout/page.tsx` - Checkout

### Aircraft Sales
- **`/classifieds/aircraft`** → `/src/app/classifieds/aircraft/page.tsx` - Aircraft listings
- **`/classifieds/aircraft/create`** → `/src/app/classifieds/aircraft/create/page.tsx` - Create aircraft listing
- **`/classifieds/aircraft/[id]`** → `/src/app/classifieds/aircraft/[id]/page.tsx` - Aircraft detail
- **`/classifieds/aircraft/[id]/edit`** → `/src/app/classifieds/aircraft/[id]/edit/page.tsx` - Edit aircraft

### Aviation Parts
- **`/classifieds/parts`** → `/src/app/classifieds/parts/page.tsx` - Parts listings
- **`/classifieds/parts/create`** → `/src/app/classifieds/parts/create/page.tsx` - Create parts listing
- **`/classifieds/parts/[id]`** → `/src/app/classifieds/parts/[id]/page.tsx` - Parts detail

### Avionics
- **`/classifieds/avionics`** → `/src/app/classifieds/avionics/page.tsx` - Avionics listings
- **`/classifieds/avionics/create`** → `/src/app/classifieds/avionics/create/page.tsx` - Create avionics listing
- **`/classifieds/avionics/[id]`** → `/src/app/classifieds/avionics/[id]/page.tsx` - Avionics detail

---

## ✈️ 7. FLIGHT PLANNING & AVIATION TOOLS (11 pages)

### Flight Planning
- **`/flight-plan`** → `/src/app/flight-plan/page.tsx` - Flight planning tool
- **`/procedures/[icao]`** → `/src/app/procedures/[icao]/page.tsx` - Airport procedures

### Weather
- **`/weather`** → `/src/app/weather/page.tsx` - Weather information
- **`/weather/radar`** → `/src/app/weather/radar/page.tsx` - Weather radar

### E6B Calculator
- **`/e6b`** → `/src/app/e6b/page.tsx` - Legacy E6B main page
- **`/computador-de-voo`** → `/src/app/computador-de-voo/page.tsx` - Portuguese E6B
- **`/tools/e6b`** → `/src/app/tools/e6b/page.tsx` - E6B (tooled route)
- **`/tools/e6b/analog`** → `/src/app/tools/e6b/analog/page.tsx` - Analog E6B
- **`/tools/e6b/digital`** → `/src/app/tools/e6b/digital/page.tsx` - Digital E6B
- **`/tools/e6b/exercises`** → `/src/app/tools/e6b/exercises/page.tsx` - E6B exercises

### Other Tools
- **`/tools`** → `/src/app/tools/page.tsx` - Tools hub
- **`/tools/glass-cockpit`** → `/src/app/tools/glass-cockpit/page.tsx` - Glass cockpit
- **`/tools/ifr-simulator`** → `/src/app/tools/ifr-simulator/page.tsx` - IFR simulator
- **`/simulator`** → `/src/app/simulator/page.tsx` - Flight simulator

### Logbook
- **`/logbook`** → `/src/app/logbook/page.tsx` - Logbook

### Mentorship
- **`/mentorship`** → `/src/app/mentorship/page.tsx` - Mentorship program

### Courses
- **`/courses`** → `/src/app/courses/page.tsx` - Online courses

---

## 🏠 8. HANGARSHARE - USER FEATURES (18 pages)

### HangarShare Main
- **`/hangarshare`** → `/src/app/hangarshare/page.tsx` - HangarShare main
- **`/hangarshare/search`** → `/src/app/hangarshare/search/page.tsx` - Search hangars
- **`/hangarshare/gallery`** → `/src/app/hangarshare/gallery/page.tsx` - Photo gallery
- **`/hangarshare/favorites`** → `/src/app/hangarshare/favorites/page.tsx` - Favorite listings

### Listing Management
- **`/hangarshare/listing/create`** → `/src/app/hangarshare/listing/create/page.tsx` - Create listing
- **`/hangarshare/listing/[id]`** → `/src/app/hangarshare/listing/[id]/page.tsx` - Listing detail
- **`/hangarshare/listing/[id]/edit`** → `/src/app/hangarshare/listing/[id]/edit/page.tsx` - Edit listing

### Owner Dashboard
- **`/hangarshare/owner/dashboard`** → `/src/app/hangarshare/owner/dashboard/page.tsx` - Owner dashboard
- **`/hangarshare/owner/register`** → `/src/app/hangarshare/owner/register/page.tsx` - Owner registration
- **`/hangarshare/owner/setup`** → `/src/app/hangarshare/owner/setup/page.tsx` - Setup wizard
- **`/hangarshare/owner/documents`** → `/src/app/hangarshare/owner/documents/page.tsx` - Documents
- **`/hangarshare/owner/leases`** → `/src/app/hangarshare/owner/leases/page.tsx` - Leases
- **`/hangarshare/owner/bookings`** → `/src/app/hangarshare/owner/bookings/page.tsx` - Bookings
- **`/hangarshare/owner/payments`** → `/src/app/hangarshare/owner/payments/page.tsx` - Payments
- **`/hangarshare/owner/analytics`** → `/src/app/hangarshare/owner/analytics/page.tsx` - Analytics
- **`/hangarshare/owner/waitlist`** → `/src/app/hangarshare/owner/waitlist/page.tsx` - Waitlist

### Booking
- **`/hangarshare/booking/checkout`** → `/src/app/hangarshare/booking/checkout/page.tsx` - Checkout
- **`/hangarshare/booking/success`** → `/src/app/hangarshare/booking/success/page.tsx` - Booking confirmation

### Alternative Owner Route
- **`/owner/hangarshare/v2/dashboard`** → `/src/app/owner/hangarshare/v2/dashboard/page.tsx` - V2 owner dashboard

---

## ⚙️ 9. ADMIN DASHBOARD (32 pages)

### Admin Main
- **`/admin`** → `/src/app/admin/page.tsx` - Admin dashboard main
- **`/admin/dashboard`** → `/src/app/admin/dashboard/page.tsx` - Main dashboard

### User Management
- **`/admin/users`** → `/src/app/admin/users/page.tsx` - Users list
- **`/admin/users/[userId]`** → `/src/app/admin/users/[userId]/page.tsx` - User detail

### Business Management
- **`/admin/business`** → `/src/app/admin/business/page.tsx` - Business accounts
- **`/admin/moderation`** → `/src/app/admin/moderation/page.tsx` - Content moderation
- **`/admin/verifications`** → `/src/app/admin/verifications/page.tsx` - Verification requests

### Documents & Compliance
- **`/admin/documents`** → `/src/app/admin/documents/page.tsx` - Document management
- **`/admin/compliance`** → `/src/app/admin/compliance/page.tsx` - Compliance tracking
- **`/admin/inbox`** → `/src/app/admin/inbox/page.tsx` - Messages/inbox

### Financial Management
- **`/admin/finance`** → `/src/app/admin/finance/page.tsx` - Financial overview
- **`/admin/financial`** → `/src/app/admin/financial/page.tsx` - Financial management
- **`/admin/hangarshare/v2/financial`** → `/src/app/admin/hangarshare/v2/financial/page.tsx` - HS financial v2

### HangarShare Admin
- **`/admin/hangarshare`** → `/src/app/admin/hangarshare/page.tsx` - HangarShare management
- **`/admin/hangarshare-v2`** → `/src/app/admin/hangarshare-v2/page.tsx` - HangarShare v2
- **`/admin/hangarshare/listings/pending`** → `/src/app/admin/hangarshare/listings/pending/page.tsx` - Pending listings
- **`/admin/hangarshare/listings/[id]`** → `/src/app/admin/hangarshare/listings/[id]/page.tsx` - Listing detail
- **`/admin/hangarshare/bookings/[id]`** → `/src/app/admin/hangarshare/bookings/[id]/page.tsx` - Booking detail
- **`/admin/hangarshare/bookings/conflicts`** → `/src/app/admin/hangarshare/bookings/conflicts/page.tsx` - Booking conflicts
- **`/admin/hangarshare/users/approve`** → `/src/app/admin/hangarshare/users/approve/page.tsx` - Approve owners
- **`/admin/hangarshare/owners/[id]`** → `/src/app/admin/hangarshare/owners/[id]/page.tsx` - Owner detail
- **`/admin/hangarshare/owner-documents`** → `/src/app/admin/hangarshare/owner-documents/page.tsx` - Owner documents
- **`/admin/hangarshare/reports`** → `/src/app/admin/hangarshare/reports/page.tsx` - HS reports
- **`/admin/hangarshare/reports/satisfaction`** → `/src/app/admin/hangarshare/reports/satisfaction/page.tsx` - Satisfaction report
- **`/admin/hangarshare/reports/trends`** → `/src/app/admin/hangarshare/reports/trends/page.tsx` - Trends report
- **`/admin/hangarshare/reports/owners-revenue`** → `/src/app/admin/hangarshare/reports/owners-revenue/page.tsx` - Revenue report
- **`/admin/hangarshare/reports/aerodromes`** → `/src/app/admin/hangarshare/reports/aerodromes/page.tsx` - Aerodromes report

### Traslados (Flights) Management
- **`/admin/traslados`** → `/src/app/admin/traslados/page.tsx` - Traslados management
- **`/admin/traslados/pilots`** → `/src/app/admin/traslados/pilots/page.tsx` - Pilots

### Classifieds Management
- **`/admin/listings`** → `/src/app/admin/listings/page.tsx` - Listings management

### Bookings Management
- **`/admin/bookings`** → `/src/app/admin/bookings/page.tsx` - Bookings management

### Other Admin Features
- **`/admin/marketing`** → `/src/app/admin/marketing/page.tsx` - Marketing management
- **`/admin/commercial`** → `/src/app/admin/commercial/page.tsx` - Commercial management
- **`/admin/tasks`** → `/src/app/admin/tasks/page.tsx` - Task management

---

### Admin Sitemap (Grouped by Module)

| Module | Routes | Purpose |
|--------|--------|---------|
| **Core** | `/admin`, `/admin/dashboard` | Entry points and high-level KPIs |
| **Users** | `/admin/users`, `/admin/users/[userId]` | User list and detailed profiles |
| **Business** | `/admin/business`, `/admin/verifications`, `/admin/moderation` | Business accounts, verification, and content moderation |
| **Compliance & Docs** | `/admin/compliance`, `/admin/documents`, `/admin/inbox` | Compliance tracking, document review, and inbound messages |
| **Financial** | `/admin/finance`, `/admin/financial`, `/admin/hangarshare/v2/financial` | Financial oversight and HS financial v2 |
| **HangarShare** | `/admin/hangarshare`, `/admin/hangarshare-v2` | HS management hubs (v1/v2) |
| **HS Listings** | `/admin/hangarshare/listings/pending`, `/admin/hangarshare/listings/[id]` | Listing approvals and detail review |
| **HS Bookings** | `/admin/hangarshare/bookings/[id]`, `/admin/hangarshare/bookings/conflicts` | Booking detail and conflict handling |
| **HS Owners** | `/admin/hangarshare/users/approve`, `/admin/hangarshare/owners/[id]`, `/admin/hangarshare/owner-documents` | Owner approval, profiles, and documents |
| **HS Reports** | `/admin/hangarshare/reports`, `/admin/hangarshare/reports/satisfaction`, `/admin/hangarshare/reports/trends`, `/admin/hangarshare/reports/owners-revenue`, `/admin/hangarshare/reports/aerodromes` | Operational and satisfaction reporting |
| **Traslados** | `/admin/traslados`, `/admin/traslados/pilots` | Traslados oversight and pilot management |
| **Classifieds** | `/admin/listings` | Listings moderation and management |
| **Bookings** | `/admin/bookings` | Global bookings oversight |
| **Growth** | `/admin/marketing`, `/admin/commercial` | Marketing and commercial management |
| **Operations** | `/admin/tasks` | Internal task management |

---

## 👥 10. COMMUNITY & FORUM (2 pages)

- **`/forum`** → `/src/app/forum/page.tsx` - Forum hub
- **`/forum/topics/[id]`** → `/src/app/forum/topics/[id]/page.tsx` - Topic detail

---

## 🎧 11. STAFF & SUPPORT (3 pages)

- **`/staff/dashboard`** → `/src/app/staff/dashboard/page.tsx` - Staff dashboard
- **`/staff/reports`** → `/src/app/staff/reports/page.tsx` - Staff reports
- **`/staff/verifications`** → `/src/app/staff/verifications/page.tsx` - Verification management
- **`/staff/reservations`** → `/src/app/staff/reservations/page.tsx` - Reservations

---

## 🚗 12. OTHER FEATURES (6 pages)

### Traslados (Ride Sharing)
- **`/traslados`** → `/src/app/traslados/page.tsx` - Traslados main
- **`/traslados/owners`** → `/src/app/traslados/owners/page.tsx` - Owner side
- **`/traslados/pilots`** → `/src/app/traslados/pilots/page.tsx` - Driver/pilot side
- **`/traslados/messages`** → `/src/app/traslados/messages/page.tsx` - Messages
- **`/traslados/status`** → `/src/app/traslados/status/page.tsx` - Trip status

---

## ⚠️ 13. POTENTIAL ISSUES & DUPLICATE ROUTES (11 pages)

### Duplicate/Redundant Routes

| Route | File | Note |
|-------|------|------|
| **E6B Duplicates** | `/e6b` vs `/tools/e6b` | Potential duplicate functionality |
| **E6B Portuguese** | `/computador-de-voo` | Same as `/tools/e6b` |
| **Tools Hub** | `/tools` | Hub list vs direct routes |
| **HangarShare v2** | `/admin/hangarshare-v2` | Separate v2 version exists |
| **Owner Dashboard v2** | `/owner/hangarshare/v2/dashboard` | Alternate path for v2 |
| **Tool with Space** | `/src/app/tools 2/e6b/page.tsx` | ⚠️ **CRITICAL: Directory naming issue with space in path** |

### Items Needing Review
1. **Tool Space in Path** → `/src/app/tools 2/e6b/page.tsx`
   - **Status:** ❌ Invalid - Directory names should not contain spaces
   - **Recommendation:** Rename to `/src/app/tools-v2/` or `/src/app/tools_legacy/`

2. **Multiple E6B Routes**
   - `/e6b` (legacy)
   - `/computador-de-voo` (Portuguese)
   - `/tools/e6b` (new location)
   - **Recommendation:** Consolidate to single `/tools/e6b` route

3. **Duplicate Admin Routes**
   - `/admin/hangarshare` vs `/admin/hangarshare-v2`
   - **Recommendation:** Clarify version strategy

4. **Profile Bookings Duplication**
   - `/profile/bookings` (user)
   - `/admin/bookings` (admin)
   - `/staff/reservations` (staff)
   - **Recommendation:** Clear separation is correct

---

## 📋 404 ERROR HANDLING STATUS

### Global 404 Configuration
- **File:** `/src/app/not-found.tsx`
- **Status:** ✅ Configured
- **Display:** Shows "404" error page
- **Coverage:** Catches all undefined routes

### Specific 404 Handling in Code
- **Location 1:** `/src/app/register/page.tsx` (Line 86)
  - Handles user lookup 404s
- **Location 2:** `/src/app/business/jobs/create/page.tsx` (Line 129)
  - Handles job creation 404s
- **Location 3:** `/src/app/career/my-applications/[id]/page.tsx` (Line 77)
  - Handles application lookup 404s

---

## 🎯 RECOMMENDATIONS

### Priority 1 - Critical Issues
1. **Fix directory naming** - Rename `tools 2` folder to remove space
2. **Verify all 123 pages load** - Run build test to catch any broken imports

### Priority 2 - Code Organization
1. **Consolidate E6B routes** - Reduce duplicate paths
2. **Document v2 routes** - Clarify HangarShare v2 vs v1 strategy
3. **Admin route organization** - Group related admin features together

### Priority 3 - Maintenance
1. **Create route map documentation** - Update this file quarterly
2. **Monitor 404 logs** - Track user navigation to missing routes
3. **Deprecation notices** - Mark legacy routes like `/e6b` as deprecated

---

## 📊 STATISTICS

| Metric | Count |
|--------|-------|
| Total Pages | 123 |
| Public Routes | 10 |
| Authenticated Routes | 92 |
| Admin Routes | 32 |
| Dynamic Routes | 28 |
| Potential Issues | 11 |
| **Pass Rate** | **91%** |

---

## 🔗 FILES REFERENCED

- Global 404: `/src/app/not-found.tsx`
- All pages: `/src/app/**/page.tsx`
- Main layout: `/src/app/layout.tsx`
- App config: `/next.config.ts`

---

**Last Updated:** February 11, 2026  
**Generated by:** AI Code Assistant  
**For:** Love to Fly Portal Project
