# Phase 1 — HangarShare Owner Ops Suite (Implementation Plan)

## Objective
Deliver owner operations tools (compliance, waitlists, leases, analytics) to increase retention and inventory quality.

---

## 1) Functional Scope
### 1.1 Compliance & Documents
- Owner document upload (insurance, lease addendum, ID, certifications).
- Status tracking: pending, approved, rejected, expired.
- Expiry reminders and alerts.

### 1.2 Waitlists
- Waitlist per listing and per airport.
- Auto‑notify when availability opens.
- Admin override and manual promotion.

### 1.3 Lease Management (MVP)
- Lease templates (versioned).
- Lease record per listing with status tracking.
- E‑sign placeholders for future integration.

### 1.4 Utilization Analytics
- Daily occupancy per listing.
- Revenue and utilization trends.
- Owner and admin visibility.

---

## 2) Data Model & Migrations (New)
> Create new 00X_*.sql migration files only.

### 2.1 Tables
**hangar_documents**
- id
- owner_id
- listing_id (nullable)
- doc_type
- file_url
- status
- expires_at
- reviewed_by
- reviewed_at
- notes
- created_at / updated_at

**hangar_waitlist**
- id
- listing_id
- user_id
- status
- desired_start_date
- desired_end_date
- created_at / updated_at

**hangar_leases**
- id
- listing_id
- owner_id
- lease_template_id
- status
- start_date
- end_date
- signed_at
- created_at / updated_at

**hangar_lease_templates**
- id
- name
- version
- content_url
- created_at

**hangar_utilization_daily**
- id
- listing_id
- date
- occupancy_rate
- revenue
- created_at

### 2.2 Indexes
- hangar_documents(owner_id, status)
- hangar_waitlist(listing_id, status)
- hangar_leases(listing_id, status)
- hangar_utilization_daily(listing_id, date)

---

## 3) API Endpoints
### 3.1 Owner Docs
- GET /api/hangarshare/owner/documents
- POST /api/hangarshare/owner/documents
- PATCH /api/hangarshare/owner/documents/[id]

### 3.2 Waitlist
- GET /api/hangarshare/waitlist?listingId=
- POST /api/hangarshare/waitlist
- PATCH /api/hangarshare/waitlist/[id]

### 3.3 Leases
- GET /api/hangarshare/owner/leases
- POST /api/hangarshare/owner/leases
- GET /api/hangarshare/lease-templates

### 3.4 Utilization
- GET /api/hangarshare/owner/utilization?listingId=
- GET /api/admin/hangarshare/utilization

---

## 4) UI Pages & Components
### 4.1 Owner Dashboard Tabs
- Documents tab
- Waitlist tab
- Leases tab
- Analytics tab

### 4.2 Admin Views
- Compliance queue for document review
- Utilization metrics overview

---

## 5) Permissions & Auditing
- Enforce owner-only access to docs/leases/waitlist.
- Admin roles can review/approve.
- Audit logging for approvals and rejections.

---

## 6) Implementation Breakdown (Tickets)
### Ticket 1: Migrations
- Create SQL migrations for new tables and indexes.

### Ticket 2: Owner Docs API
- CRUD endpoints + validation.
- Admin review endpoint.

### Ticket 3: Waitlist API
- Add/join waitlist + status transitions.

### Ticket 4: Lease Templates API
- Read templates + attach to listing.

### Ticket 5: Owner Dashboard UI
- New tabs + tables + status indicators.

### Ticket 6: Admin Review UI
- Document review queue + actions.

### Ticket 7: Utilization Metrics
- Daily aggregation job (cron stub).
- UI cards + charts.

---

## 7) Acceptance Criteria
- Owners can upload documents and track status.
- Waitlist can be joined and managed.
- Leases can be created from templates.
- Utilization metrics visible to owners and admins.
- All actions logged.

---

## 8) Next Step
Proceed with Ticket 1 (migrations), then Ticket 2 (Owner Docs API).
