# HangarShare Complete System Analysis
**Date:** January 20, 2026  
**Analysis Type:** Comprehensive System Audit  
**Purpose:** Identify actual system state, workflows, and prevent duplicate/conflicting implementations

---

## Executive Summary

This analysis reveals **TWO SEPARATE VERIFICATION SYSTEMS** operating in parallel with **DIFFERENT DATA TABLES** and **INDEPENDENT WORKFLOWS**. Recent development attempted to fix issues but inadvertently created connections to the wrong verification system.

### Critical Findings

1. **TWO VERIFICATION SYSTEMS EXIST:**
   - System A: `hangar_owner_verification` table (EMPTY - 0 records)
   - System B: `hangar_owners.is_verified` + `verification_status` columns (IN USE - 4 owners)

2. **DUAL ADMIN PAGES for same function:**
   - `/admin/verifications` → Uses `hangar_owner_verification` table
   - `/admin/hangarshare` → Uses `hangar_owners` table directly

3. **RECENT FIXES CONNECTED TO WRONG SYSTEM:**
   - New admin routes created for `/admin/hangarshare/owners/[id]/*`
   - These correctly query `hangar_owners` table
   - But page `/admin/hangarshare/users/approve` redirects to `/admin/verifications` (WRONG TABLE)

---

## Database Architecture - ACTUAL STATE

### Core Tables

#### 1. `hangar_owners` (4 records) - **IN ACTIVE USE**
```sql
Table Structure:
- id: integer (PK)
- user_id: integer (FK → users.id)
- company_name: varchar(255)
- cnpj: varchar(18)
- phone: varchar(20)
- address: text
- website: varchar(255)
- description: text
- is_verified: boolean DEFAULT false ← VERIFICATION FLAG
- verification_status: varchar(50) DEFAULT 'pending' ← STATUS FIELD
- created_at: timestamp
- updated_at: timestamp
- owner_type: varchar(20) DEFAULT 'company'
- cpf: varchar(14) (for individual owners)
- pix_key: varchar(100)
- pix_key_type: varchar(20)

Current Data:
├─ ID 1: Demo Owner (is_verified=false, status='pending')
├─ ID 2: Test Aviation (is_verified=true, status='pending')
├─ ID 3: Premium Hangars (is_verified=false, status='pending')
└─ ID 4: Sky Hangars (is_verified=false, status='pending')
```

**Purpose:** Main owner profiles. Verification happens via flags in THIS table.

#### 2. `hangar_owner_verification` (0 records) - **EMPTY/UNUSED**
```sql
Table Structure:
- id: uuid (PK)
- owner_id: integer (FK → hangar_owners.id)
- id_document_type: varchar(50)
- id_document_number: varchar(50)
- id_document_front_url: text
- id_document_back_url: text
- selfie_url: text
- ownership_proof_type: varchar(50)
- ownership_document_url: text
- company_registration_url: text
- tax_document_url: text
- verification_status: varchar(50)
- rejection_reason: text
- admin_notes: text
- verified_by: integer (FK → users.id)
- verified_at: timestamp
- created_at: timestamp

Current Data: NONE (0 rows)
```

**Purpose:** Separate verification documents system. NEVER POPULATED.

#### 3. `owner_documents` (7 records) - **DOCUMENT STORAGE**
```sql
Table Structure:
- id: integer (PK)
- owner_id: integer (FK → hangar_owners.id)
- document_type: varchar(50)
- document_url: text
- file_size: integer
- mime_type: varchar(100)
- uploaded_at: timestamp
- verified: boolean DEFAULT false
- verified_at: timestamp
- verified_by: integer

Current Usage: Stores uploaded documents for verification
```

#### 4. `hangar_listings` (20 records) - **ALL PENDING APPROVAL**
```sql
Key Status Columns:
- status: varchar(50) DEFAULT 'active'
- approval_status: varchar(50) DEFAULT 'pending_approval' ← VISIBILITY FLAG
- verification_status: varchar(50) DEFAULT 'pending'
- is_available: boolean DEFAULT true
- availability_status: varchar(50) DEFAULT 'available'

Current Data:
└─ ALL 20 listings: status='active', approval_status='pending_approval'

Visibility Logic:
- Listings with approval_status='pending_approval' → NOT visible to customers
- Listings with approval_status='approved' → Visible to customers
```

#### 5. `bookings` (17 records) - **ALL PENDING**
```sql
Table Structure:
- id: integer (PK)
- hangar_id: integer (FK → hangar_listings.id)
- user_id: integer (FK → users.id)
- check_in: date
- check_out: date
- nights: integer
- subtotal: numeric(10,2)
- fees: numeric(10,2)
- total_price: numeric(10,2)
- status: varchar(20) DEFAULT 'pending' ← BOOKING STATUS
- payment_method: varchar(50)
- stripe_payment_intent_id: varchar(255)
- stripe_charge_id: varchar(255)
- payment_date: timestamp
- notes: text
- created_at: timestamp
- updated_at: timestamp

Current Data:
└─ ALL 17 bookings: status='pending'

Note: NO 'booking_status' column exists (old code used wrong name)
```

#### 6. `hangar_bookings` - **SEPARATE BOOKING TABLE**
Status: Unknown - Need to verify if this is duplicate or different purpose

---

## System Workflows - ACTUAL IMPLEMENTATION

### Workflow 1: Owner Registration & Verification

**Current Path (Working):**
```
Step 1: User creates account
├─ Table: users
└─ Standard authentication

Step 2: Owner setup
├─ Page: /hangarshare/owner/setup
├─ API: POST /api/hangarshare/owner/setup
├─ Creates record in: hangar_owners
└─ Sets: verification_status='pending_approval'

Step 3: Document upload (IF IMPLEMENTED)
├─ Page: /hangarshare/owner/documents
├─ API: POST /api/hangarshare/owner/documents
├─ Saves to: owner_documents table
└─ Links to: hangar_owners.id

Step 4: Admin verification (DUAL PATHS - CONFLICT)
├─ Path A (WRONG): /admin/verifications
│   ├─ Queries: hangar_owner_verification (EMPTY)
│   ├─ API: GET /api/admin/verifications
│   └─ Result: Shows NOTHING (table empty)
│
└─ Path B (CORRECT): /admin/hangarshare
    ├─ Tab: "Verificações Pendentes"
    ├─ Queries: hangar_owners WHERE is_verified=false
    ├─ Displays: List of unverified owners
    ├─ Click "Verificar" → Modal with owner details
    ├─ API: GET /api/admin/hangarshare/owners/[id]/details
    ├─ Action: Approve → POST /api/admin/hangarshare/owners/[id]/verify
    │   └─ Updates: hangar_owners.is_verified=true
    └─ Action: Reject → POST /api/admin/hangarshare/owners/[id]/reject
        └─ Deletes owner record
```

**PROBLEM IDENTIFIED:**
- Page `/admin/hangarshare/users/approve` redirects to `/admin/verifications`
- But `/admin/verifications` queries `hangar_owner_verification` (EMPTY)
- Should redirect to `/admin/hangarshare` tab or query `hangar_owners` directly

### Workflow 2: Listing Creation & Approval

**Current Path (Working):**
```
Step 1: Owner creates listing
├─ Page: /hangarshare/listing/create
├─ API: POST /api/hangarshare/listing/create
├─ Creates record in: hangar_listings
├─ Sets: status='active', approval_status='pending_approval'
└─ Result: NOT visible to customers

Step 2: Admin approval (NO UI YET)
├─ Expected page: /admin/hangarshare/listings/pending (EXISTS but not linked)
├─ Current access: Via /admin/hangarshare → "Hangares" tab
├─ Shows: Listings with approval_status='pending_approval'
├─ Action needed: Approve listing
│   ├─ API: POST /api/admin/hangarshare/listings/[id]/approve (EXISTS)
│   └─ Updates: approval_status='approved', availability_status='available'
└─ Result: Listing becomes visible to customers

Alternative approval (Payment-based):
├─ API: POST /api/hangarshare/listings/pay (EXISTS)
├─ Updates same fields when payment confirmed
└─ Used by: Stripe webhook or manual payment confirmation
```

### Workflow 3: Booking Management

**Current Path (Working):**
```
Step 1: Customer books hangar
├─ Page: /hangarshare/listing/[id]
├─ API: POST /api/hangarshare/booking/confirm
├─ Creates record in: bookings table
└─ Sets: status='pending'

Step 2: Payment processing
├─ Stripe integration
└─ Webhook: /api/hangarshare/webhook/stripe

Step 3: Admin management
├─ Page: /admin/hangarshare → "Reservas" tab
├─ OR: /admin/bookings (general bookings page)
├─ Shows: All bookings
└─ Can update status
```

---

## Admin Dashboard Structure

### Main Admin Dashboard: `/admin/page.tsx`
```
Modules:
├─ HangarShare (priority: high)
│   ├─ Link: /admin/hangarshare
│   ├─ Metrics: pendingVerifications, pendingListings
│   └─ Alert: "Novos documentos aguardam revisão"
│
├─ Reservas (priority: high)
│   ├─ Link: /admin/bookings
│   └─ Metrics: activeBookings
│
├─ Anúncios (priority: normal)
│   ├─ Link: /admin/listings
│   └─ Metrics: totalHangars
│
└─ [Other modules...]
```

### HangarShare Admin: `/admin/hangarshare/page.tsx`
```
Tabs:
├─ Overview
│   └─ Statistics dashboard
│
├─ Verificações Pendentes ← CORE VERIFICATION TAB
│   ├─ Query: hangar_owners WHERE is_verified=false
│   ├─ Displays: Owner list with verification status
│   ├─ Action: Click owner → Opens VerificationDetailModal
│   └─ Modal actions:
│       ├─ View documents
│       ├─ Approve (verify)
│       └─ Reject
│
├─ Hangares
│   ├─ Query: hangar_listings (all statuses)
│   └─ Shows: All listings with stats
│
└─ Reservas
    ├─ Query: bookings
    └─ Shows: Booking list
```

### Quick Actions Section (Bottom of HangarShare page)
```
"Ações Rápidas" Cards:
├─ Verificações Pendentes
│   ├─ Link: /admin/hangarshare/users/approve
│   ├─ REDIRECTS TO: /admin/verifications?status=pending
│   └─ ⚠️ PROBLEM: Wrong table (hangar_owner_verification)
│
├─ Hangares Pendentes
│   ├─ Link: /admin/hangarshare/listings/pending
│   └─ ✅ Shows pending listings correctly
│
├─ Conflitos de Reservas
│   ├─ Link: /admin/hangarshare/bookings/conflicts
│   └─ ✅ Ready for implementation
│
└─ Relatórios
    ├─ Link: /admin/hangarshare/reports
    └─ ✅ Analytics dashboard
```

### General Verifications Page: `/admin/verifications/page.tsx`
```
Purpose: Unified verification management
Data Source: hangar_owner_verification table
Status: ⚠️ QUERIES EMPTY TABLE
Access Control: Role-based (master/compliance only)

Query:
SELECT ... FROM hangar_owner_verification hov
JOIN hangar_owners ho ON hov.owner_id = ho.id
JOIN users u ON ho.user_id = u.id
WHERE hov.verification_status = $1

Result: Returns 0 records (table empty)
```

---

## API Routes Inventory

### Owner Verification APIs

#### Working (Correct Table):
```
POST /api/admin/hangarshare/owners/[id]/verify
├─ Updates: hangar_owners.is_verified = true
├─ Status: ✅ FIXED (Next.js 16+ params)
└─ Table: hangar_owners

POST /api/admin/hangarshare/owners/[id]/reject
├─ Deletes: hangar_owners record
├─ Status: ✅ FIXED (Next.js 16+ params)
└─ Table: hangar_owners

GET /api/admin/hangarshare/owners/[id]/details
├─ Returns: Owner + documents data
├─ Status: ✅ FIXED (Next.js 16+ params)
├─ Tables: hangar_owners + owner_documents
└─ Join: LEFT JOIN to get documents
```

#### Conflicting (Wrong Table):
```
GET /api/admin/verifications
├─ Queries: hangar_owner_verification (EMPTY)
├─ Result: Returns 0 records
└─ Used by: /admin/verifications page

POST /api/admin/verifications/[id]/approve
├─ Updates: hangar_owner_verification.verification_status
├─ Status: Not functional (table empty)
└─ Should update: hangar_owners.is_verified instead
```

### Listing Management APIs

```
GET /api/admin/hangarshare/listings
├─ Returns: All hangar listings with owner data
└─ Status: ✅ Working

POST /api/admin/hangarshare/listings/[id]/approve
├─ Updates: hangar_listings.approval_status='approved'
└─ Status: ⚠️ Needs params Promise fix

POST /api/admin/hangarshare/listings/[id]/reject
├─ Deletes: hangar_listings record
└─ Status: ⚠️ Needs params Promise fix
```

### Booking Management APIs

```
GET /api/admin/hangarshare/bookings
├─ Returns: All bookings
└─ Status: ✅ Working

GET /api/admin/hangarshare/bookings/conflicts
├─ Returns: Overlapping bookings
└─ Status: ✅ Ready (returns empty array)

POST /api/admin/hangarshare/bookings/[id]/resolve
├─ Resolves: Booking conflicts
└─ Status: ⚠️ Needs params Promise fix
```

### Statistics APIs

```
GET /api/admin/hangarshare/stats
├─ Returns: Comprehensive statistics
└─ Status: ✅ Working

GET /api/admin/hangarshare/reports
├─ Returns: Detailed analytics
├─ Query: Uses correct column names (status, not booking_status)
└─ Status: ✅ Working
```

---

## Data Flow Diagrams

### Owner Verification - ACTUAL FLOW
```
User Registration
    ↓
hangar_owners table
    ├─ is_verified: false
    ├─ verification_status: 'pending'
    └─ Stored here
    ↓
Document Upload (optional)
    ↓
owner_documents table
    └─ Links to hangar_owners.id
    ↓
Admin Views in TWO Places
    ↓
┌─────────────────────┬─────────────────────┐
│ /admin/verifications │  /admin/hangarshare │
│                     │                     │
│ Queries:            │ Queries:            │
│ hangar_owner_       │ hangar_owners       │
│ verification        │ (direct)            │
│                     │                     │
│ Result: EMPTY ✗     │ Result: 4 owners ✓  │
└─────────────────────┴─────────────────────┘
            │
            ↓
    Admin Approves
            ↓
    hangar_owners.is_verified = true
```

### Listing Approval - ACTUAL FLOW
```
Owner Creates Listing
    ↓
hangar_listings table
    ├─ status: 'active'
    ├─ approval_status: 'pending_approval' ← GATE
    ├─ is_available: true
    └─ availability_status: 'available'
    ↓
Customer Search/Browse
    ├─ API filters by: approval_status='approved'
    └─ NOT VISIBLE (still pending)
    ↓
Admin Approval Needed
    ├─ Via: /admin/hangarshare/listings/pending
    ├─ OR: Manual payment marking
    └─ Updates: approval_status='approved'
    ↓
Listing NOW VISIBLE
    ├─ GET /api/hangarshare/listing/highlighted
    ├─ GET /api/hangarshare/listings/with-images
    └─ Shows in customer search results
```

---

## Critical Issues & Recommendations

### Issue 1: Duplicate Verification Systems ⚠️ CRITICAL

**Problem:**
- Two tables for verification: `hangar_owner_verification` (empty) and `hangar_owners` (in use)
- Two admin pages querying different tables
- Redirect from HangarShare module goes to wrong system

**Impact:**
- Admins using `/admin/verifications` see no pending verifications (empty table)
- Only `/admin/hangarshare` tab shows actual pending owners
- Confusing UX with two different interfaces for same task

**Resolution Options:**

**Option A (RECOMMENDED): Consolidate to hangar_owners**
```sql
1. Remove hangar_owner_verification table (unused)
2. Remove /admin/verifications page (or repurpose)
3. Update redirect in /admin/hangarshare/users/approve:
   FROM: router.replace('/admin/verifications?status=pending')
   TO:   router.replace('/admin/hangarshare') // Stay on HangarShare page
4. All verification happens via hangar_owners.is_verified flag
```

**Option B: Migrate to hangar_owner_verification**
```sql
1. Create migration to populate hangar_owner_verification
2. Update all APIs to use new table
3. Keep separate verification documents system
4. More complex but better separation of concerns
```

### Issue 2: Column Name Inconsistencies ⚠️ MEDIUM

**Problem:**
- Old code used `verified` (doesn't exist)
- Actual column: `is_verified`
- Old code used `booking_status` (doesn't exist)
- Actual column: `status`

**Status:** ✅ FIXED in recent session

### Issue 3: Next.js 16+ params Breaking Change ⚠️ MEDIUM

**Problem:**
- Dynamic route params now return Promise
- Must `await params` before accessing properties
- Affects all `/[id]/` routes

**Status:** 🔄 PARTIALLY FIXED
- ✅ Fixed: `/owners/[id]/details`
- ✅ Fixed: `/owners/[id]/verify`
- ✅ Fixed: `/owners/[id]/reject`
- ⚠️ Need to check: `/listings/[id]/*` routes
- ⚠️ Need to check: `/bookings/[id]/*` routes

### Issue 4: Missing UI for Listing Approval ⚠️ LOW

**Problem:**
- API endpoints exist for listing approval/rejection
- Page exists: `/admin/hangarshare/listings/pending`
- But not prominently linked from main dashboard

**Resolution:**
- Link already exists in "Ações Rápidas" section
- Just needs visibility/testing

### Issue 5: Two Booking Tables ⚠️ UNKNOWN

**Discovery:**
- `bookings` table (17 records, in use)
- `hangar_bookings` table (unknown status)

**Action Required:**
- Investigate hangar_bookings table purpose
- Check if it's duplicate or serves different function
- Determine if migration/consolidation needed

---

## Page-to-API-to-Table Mapping

### Owner Verification Flow

| Page | API Endpoint | Database Table | Status |
|------|-------------|----------------|--------|
| `/admin/hangarshare` (Tab) | `GET /api/admin/hangarshare/owners` | `hangar_owners` | ✅ Working |
| Modal action | `GET /api/admin/hangarshare/owners/[id]/details` | `hangar_owners` + `owner_documents` | ✅ Fixed |
| Modal approve | `POST /api/admin/hangarshare/owners/[id]/verify` | `hangar_owners.is_verified` | ✅ Fixed |
| Modal reject | `POST /api/admin/hangarshare/owners/[id]/reject` | `hangar_owners` (DELETE) | ✅ Fixed |
| `/admin/verifications` | `GET /api/admin/verifications` | `hangar_owner_verification` | ⚠️ Wrong table |
| `/admin/hangarshare/users/approve` | Redirect to `/admin/verifications` | N/A | ⚠️ Wrong redirect |

### Listing Management Flow

| Page | API Endpoint | Database Table | Status |
|------|-------------|----------------|--------|
| `/admin/hangarshare` (Tab) | `GET /api/admin/hangarshare/listings` | `hangar_listings` | ✅ Working |
| `/admin/hangarshare/listings/pending` | Same as above | `hangar_listings` | ✅ Working |
| Approve action | `POST /api/admin/hangarshare/listings/[id]/approve` | `hangar_listings.approval_status` | ⚠️ Need params fix |
| Reject action | `POST /api/admin/hangarshare/listings/[id]/reject` | `hangar_listings` (DELETE) | ⚠️ Need params fix |

### Booking Management Flow

| Page | API Endpoint | Database Table | Status |
|------|-------------|----------------|--------|
| `/admin/hangarshare` (Tab) | `GET /api/admin/hangarshare/bookings` | `bookings` | ✅ Working |
| `/admin/bookings` | `GET /api/admin/bookings` | `bookings` | ✅ Working |
| `/admin/hangarshare/bookings/conflicts` | `GET /api/admin/hangarshare/bookings/conflicts` | `bookings` | ✅ Ready |
| Resolve conflict | `POST /api/admin/hangarshare/bookings/[id]/resolve` | `bookings.status` | ⚠️ Need params fix |

---

## Recommended Immediate Actions

### Priority 1: Fix Verification System Conflict
```
1. Update /admin/hangarshare/users/approve redirect
   FROM: /admin/verifications?status=pending
   TO:   /admin/hangarshare (stay on same page, switch to tab)

2. OR: Remove quick action card entirely
   Reason: Tab already exists on same page

3. Document that /admin/verifications is for different purpose
   OR: Remove /admin/verifications if unused
```

### Priority 2: Complete Next.js 16+ Params Fixes
```
Check and fix all remaining dynamic routes:
- /api/admin/hangarshare/listings/[id]/approve
- /api/admin/hangarshare/listings/[id]/reject  
- /api/admin/hangarshare/bookings/[id]/resolve
- Any other /[id]/ routes in hangarshare module
```

### Priority 3: Clarify Booking Tables
```
1. Query hangar_bookings table structure
2. Check if records exist
3. Determine purpose vs bookings table
4. Document or migrate/remove if duplicate
```

### Priority 4: Test Complete Workflow
```
1. Register new owner via /hangarshare/owner/setup
2. Verify appears in /admin/hangarshare "Verificações Pendentes" tab
3. Approve via modal
4. Confirm is_verified=true in database
5. Create listing
6. Verify appears in "Hangares" tab as pending
7. Approve listing
8. Confirm visible to customers
```

---

## System Health Status

| Component | Status | Notes |
|-----------|--------|-------|
| Owner Registration | ✅ Working | Creates hangar_owners record |
| Owner Verification (HangarShare) | ✅ Working | Uses correct table |
| Owner Verification (General) | ⚠️ Wrong table | Queries empty hangar_owner_verification |
| Document Upload | ⚠️ Unknown | Need to test |
| Listing Creation | ✅ Working | Creates hangar_listings record |
| Listing Approval UI | ⚠️ Exists but not linked | Page exists, needs prominence |
| Listing Approval API | ⚠️ Need params fix | Functionality ready |
| Booking Creation | ✅ Working | Creates bookings record |
| Booking Management | ✅ Working | Admin can view bookings |
| Conflict Detection | ✅ Ready | Returns empty array (no conflicts yet) |
| Statistics/Reports | ✅ Working | All metrics displaying correctly |

---

## Conclusion

The HangarShare system has **solid core functionality** but suffers from:
1. **Architectural confusion** - Two separate verification systems
2. **Incomplete migration** - Old table exists but empty, new implementation uses direct flags
3. **Navigation issues** - Redirects point to wrong subsystem

The system is **functional** when using the correct path (`/admin/hangarshare` page directly), but **confusing** due to dual verification interfaces and incorrect redirects.

**Recommended path forward:** 
- Consolidate to single verification system (hangar_owners table)
- Remove or repurpose /admin/verifications page
- Fix remaining Next.js 16+ params issues
- Document the ONE correct workflow path
- Avoid creating new pages when existing ones already exist

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-20 | Complete system analysis | User requested fresh analysis to prevent duplicate implementations |
| 2026-01-20 | Identified dual verification systems | Discovered hangar_owner_verification empty |
| 2026-01-20 | Fixed 3 owner API routes for Next.js 16+ | params Promise handling |
| 2026-01-20 | Documented actual data flow | Prevent future conflicting implementations |

