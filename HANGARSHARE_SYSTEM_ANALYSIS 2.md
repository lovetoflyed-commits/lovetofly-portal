# HangarShare System - Complete Technical Analysis
**Generated:** January 13, 2026  
**Document:** System Architecture & Workflow Analysis

---

## Executive Summary

This document provides a complete analysis of the current HangarShare system implementation, including data flow, storage architecture, approval workflow, and identified gaps requiring decisions before further development.

---

## Table of Contents

1. [Current Registration & Approval Flow](#1-current-registration--approval-flow)
2. [Database Architecture](#2-database-architecture)
3. [Data Storage Locations](#3-data-storage-locations)
4. [Approval Methods](#4-approval-methods)
5. [Customer Visibility Rules](#5-customer-visibility-rules)
6. [Critical System Gaps](#6-critical-system-gaps)
7. [Working Features](#7-working-features)
8. [Technical Recommendations](#8-technical-recommendations)

---

## 1. Current Registration & Approval Flow

### Step 1: Owner Registration
```
User Action:
├─ Creates account → Login successful
├─ Navigates to: /hangarshare/owner/setup
├─ Fills company information form (6 required fields):
│   ├─ Company name
│   ├─ CNPJ (Brazilian company ID)
│   ├─ Contact email
│   ├─ Contact phone
│   ├─ Full address
│   └─ City
└─ Data saved to: hangar_owners table
    └─ Initial status: 'pending'
```

### Step 2: Create Hangar Listing
```
User Action:
├─ Owner navigates to: /hangarshare/listing/create
├─ API Endpoint: POST /api/hangarshare/listing/create
├─ Fills hangar details form (23 fields):
│   ├─ Location: ICAO code, aerodrome name, city, state
│   ├─ Physical: hangar number, size (sqm), dimensions
│   ├─ Specifications: max wingspan, length, height
│   ├─ Pricing: hourly, daily, weekly, monthly rates
│   ├─ Availability: dates, operating hours
│   ├─ Payment options: online, on arrival, on departure
│   ├─ Policies: cancellation policy
│   └─ Description: text description, special notes
└─ Submitted via authenticated API call
```

### Step 3: Automatic Data Storage
```
System Action (Immediate):
├─ Data saved to: hangar_listings table
├─ Automatic field values set:
│   ├─ is_available = TRUE
│   ├─ status = 'active'
│   ├─ approval_status = 'pending' ← CRITICAL
│   ├─ availability_status = NULL
│   ├─ is_paid = FALSE
│   └─ created_at = NOW()
└─ Response: "Listing created successfully! Pending admin approval."
```

### Step 4: Waiting Period (Pending Approval)
```
Current State:
├─ Listing exists in database ✓
├─ Has unique ID ✓
├─ All owner data stored ✓
├─ Status flags:
│   ├─ approval_status = 'pending'
│   ├─ is_paid = FALSE
│   └─ availability_status = NULL
└─ Visibility:
    ├─ NOT visible to customers ✗
    ├─ Filtered out by approval_status check
    └─ Waiting for admin action
```

### Step 5: Admin Approval (Manual Action Required)
```
Three possible methods:

METHOD 1: Admin Dashboard Approval (NOT IMPLEMENTED)
├─ Expected: Admin UI with pending listings queue
├─ Expected: "Approve" and "Reject" buttons
├─ Current Status: ⚠️ UI DOES NOT EXIST
└─ Must use Method 2 or 3 instead

METHOD 2: Payment API (WORKING)
├─ API: POST /api/hangarshare/listings/pay
├─ Authorization: Admin/Master/Staff token required
├─ Action: Admin marks listing as paid
└─ System updates:
    ├─ approval_status → 'approved'
    ├─ availability_status → 'available'
    ├─ is_paid → TRUE
    ├─ paid_at → NOW()
    ├─ paid_amount → amount provided
    ├─ paid_currency → 'BRL'
    └─ Creates financial_transactions record (INCOME)

METHOD 3: Stripe Payment (WORKING)
├─ Step 1: Create payment intent
│   ├─ API: POST /api/hangarshare/owner/payment-intent
│   ├─ System creates Stripe payment intent
│   └─ Returns client_secret to owner
├─ Step 2: Owner completes Stripe checkout
│   └─ Stripe processes payment
└─ Step 3: Confirm payment
    ├─ API: POST /api/hangarshare/owner/confirm-payment
    ├─ System verifies payment with Stripe
    └─ Same database updates as Method 2
```

### Step 6: Listing Goes Live (Automatic After Approval)
```
System State After Approval:
├─ approval_status = 'approved'
├─ availability_status = 'available'
├─ is_available = TRUE
├─ is_paid = TRUE
└─ NOW VISIBLE TO CUSTOMERS
    ├─ Appears in: GET /api/hangarshare/listing/highlighted
    ├─ Appears in: GET /api/hangarshare/listings/with-images
    └─ Available for booking (if booking system exists)
```

---

## 2. Database Architecture

### Entity Relationship Overview
```
users (authentication)
  ↓ (1:1)
hangar_owners (owner profiles)
  ↓ (1:N)
hangar_listings (all hangar data) ← MAIN TABLE
  ↓ (1:N)
hangar_bookings (future - not implemented)
  ↓
financial_transactions (payment records)
```

### Table Relationships
```sql
users
├─ id (PK)
├─ email, name, password_hash
├─ role ('master', 'admin', 'staff', 'user')
└─ plan ('free', 'standard', 'premium', 'pro')

hangar_owners
├─ id (PK)
├─ user_id (FK → users.id)
├─ company_name, company_cnpj
├─ contact_email, contact_phone
├─ address, city, state, country
├─ verification_status ('pending', 'verified', 'rejected')
└─ created_at, updated_at

hangar_listings ← MAIN DATA STORAGE
├─ id (PK)
├─ owner_id (FK → hangar_owners.id)
├─ [67 columns total - see Section 3 for details]
└─ Contains ALL hangar data

financial_transactions
├─ id (PK)
├─ company_id (FK → companies.id)
├─ transaction_type ('INCOME', 'EXPENSE')
├─ category ('HANGARSHARE', 'MEMBERSHIP', etc.)
├─ amount, currency
├─ status ('confirmed', 'pending', 'failed')
├─ user_id (FK → users.id - who processed)
└─ transaction_date
```

---

## 3. Data Storage Locations

### Primary Table: hangar_listings (67 columns)

#### Basic Information
```
id                             INTEGER (PK)
owner_id                       INTEGER (FK → hangar_owners.id)
created_at                     TIMESTAMP
updated_at                     TIMESTAMP
```

#### Location Data
```
icao_code                      VARCHAR(10)
airport_icao                   VARCHAR(10) (duplicate field)
aerodrome_name                 VARCHAR(200)
city                          VARCHAR(100)
state                         VARCHAR(100)
country                       VARCHAR(100)
hangar_number                 VARCHAR(50)
hangar_location_description   TEXT
```

#### Physical Specifications
```
hangar_size_sqm               NUMERIC(10,2)
hangar_size                   VARCHAR(50) (duplicate field)
max_wingspan_meters           NUMERIC(10,2)
max_length_meters             NUMERIC(10,2)
max_height_meters             NUMERIC(10,2)
dimensions_length             NUMERIC(10,2) (duplicate)
dimensions_width              NUMERIC(10,2)
dimensions_height             NUMERIC(10,2) (duplicate)
door_dimensions               TEXT
maximum_aircraft_weight       NUMERIC(10,2)
accepted_aircraft_categories  JSONB
```

#### Facility Features
```
floor_type                    VARCHAR(50)
lighting                      VARCHAR(100)
climate_control               BOOLEAN
electricity                   BOOLEAN
water_access                  BOOLEAN
fuel_nearby                   BOOLEAN
maintenance_facilities        BOOLEAN
security_features             TEXT
services                      JSONB
```

#### Pricing Structure
```
hourly_rate                   NUMERIC(10,2)
daily_rate                    NUMERIC(10,2)
price_per_day                 NUMERIC(10,2) (duplicate)
weekly_rate                   NUMERIC(10,2)
price_per_week                NUMERIC(10,2) (duplicate)
monthly_rate                  NUMERIC(10,2)
price_per_month               NUMERIC(10,2) (duplicate)
```

#### Availability & Scheduling
```
is_available                  BOOLEAN
availability_status           VARCHAR(50)
  └─ Values: 'available', 'unavailable', 'pending', NULL
available_from                DATE
available_until               DATE
operating_hours               JSONB
minimum_rental_period         VARCHAR(50)
```

#### Payment Options
```
accepts_online_payment        BOOLEAN
accepts_payment_on_arrival    BOOLEAN
accepts_payment_on_departure  BOOLEAN
cancellation_policy           VARCHAR(100)
insurance_required            BOOLEAN
```

#### Status & Approval (CRITICAL FIELDS)
```
status                        VARCHAR(50)
  └─ Values: 'active', 'inactive', 'suspended'

approval_status               VARCHAR(50) ← DETERMINES VISIBILITY
  └─ Values: 'pending', 'approved', 'rejected'

verification_status           VARCHAR(50)
  └─ Values: 'pending', 'verified', 'rejected'

approved_by                   INTEGER (FK → users.id)
approved_at                   TIMESTAMP
rejection_reason              TEXT
```

#### Payment Tracking
```
is_paid                       BOOLEAN
paid_at                       TIMESTAMP
paid_amount                   NUMERIC(10,2)
paid_currency                 VARCHAR(3)
stripe_payment_intent_id      VARCHAR(255)
payment_status                VARCHAR(50)
  └─ Values: 'pending', 'succeeded', 'failed'
```

#### Media & Description
```
image_url                     VARCHAR(500)
  └─ Current: Stock photos from Unsplash
photos                        JSONB
  └─ Array of photo URLs
description                   TEXT
special_notes                 TEXT
special_instructions          TEXT
```

---

## 4. Approval Methods

### Method 1: Manual Admin Approval
```
Status: ⚠️ NOT IMPLEMENTED

Expected Workflow:
├─ Admin logs into dashboard: /admin
├─ Navigates to "Pending Listings" section
├─ Sees list of all listings where approval_status = 'pending'
├─ For each listing:
│   ├─ View full details
│   ├─ Click "Approve" button
│   │   └─ Updates: approval_status → 'approved'
│   │             availability_status → 'available'
│   └─ OR Click "Reject" button
│       └─ Updates: approval_status → 'rejected'
│                   rejection_reason → (admin input)
└─ Listing becomes visible to customers (if approved)

Current Reality:
└─ ✗ No UI exists for this workflow
    └─ Must use API methods (Method 2 or 3) instead
```

### Method 2: Payment API (Admin Marks as Paid)
```
Status: ✅ WORKING

API Endpoint: POST /api/hangarshare/listings/pay
Authorization: Bearer token (role: master/admin/staff)

Request Body:
{
  "listing_id": 123,
  "amount": 2500,
  "currency": "BRL",
  "description": "HangarShare listing activation fee"
}

Process Flow:
1. Validates admin authorization
2. Begins database transaction
3. Updates hangar_listings table:
   ├─ approval_status = 'approved'
   ├─ availability_status = 'available'
   ├─ is_paid = TRUE
   ├─ paid_at = CURRENT_TIMESTAMP
   ├─ paid_amount = 2500
   ├─ paid_currency = 'BRL'
   └─ updated_at = CURRENT_TIMESTAMP
4. Creates financial_transactions record:
   ├─ transaction_type = 'INCOME'
   ├─ category = 'HANGARSHARE'
   ├─ amount = 2500
   ├─ currency = 'BRL'
   ├─ status = 'confirmed'
   └─ description = request.description
5. Commits transaction
6. Returns success response

Result: Listing immediately visible to customers
```

### Method 3: Stripe Payment Integration
```
Status: ✅ WORKING

STEP 1: Create Payment Intent
API: POST /api/hangarshare/owner/payment-intent

Request:
{
  "listing_id": 123,
  "amount": 2500  // Optional, defaults to 2500 BRL
}

Process:
├─ Creates Stripe PaymentIntent
├─ Updates hangar_listings:
│   ├─ stripe_payment_intent_id = 'pi_xxxxx'
│   └─ payment_status = 'pending'
└─ Returns:
    {
      "payment_intent_id": "pi_xxxxx",
      "client_secret": "pi_xxxxx_secret_yyyy",
      "status": "pending"
    }

STEP 2: Owner Completes Payment
├─ Frontend displays Stripe payment form
├─ Owner enters card details
├─ Stripe processes payment
└─ Returns to confirmation page

STEP 3: Confirm Payment
API: POST /api/hangarshare/owner/confirm-payment

Request:
{
  "payment_intent_id": "pi_xxxxx",
  "listing_id": 123
}

Process:
├─ Verifies payment with Stripe API
├─ If payment.status === 'succeeded':
│   ├─ Updates hangar_listings (same as Method 2):
│   │   ├─ approval_status = 'approved'
│   │   ├─ availability_status = 'available'
│   │   ├─ is_paid = TRUE
│   │   ├─ paid_at = CURRENT_TIMESTAMP
│   │   ├─ paid_amount = payment.amount
│   │   ├─ paid_currency = payment.currency
│   │   └─ payment_status = 'succeeded'
│   └─ Creates financial_transactions record
└─ Returns confirmation

Result: Automatic approval upon successful payment
```

---

## 5. Customer Visibility Rules

### Public Listing Query Logic
```sql
-- API: GET /api/hangarshare/listing/highlighted
SELECT 
  h.id,
  h.hangar_number,
  h.aerodrome_name,
  h.city,
  h.hourly_rate,
  h.daily_rate,
  h.monthly_rate,
  h.image_url,
  h.description,
  COUNT(b.id) as bookings_count
FROM hangar_listings h
LEFT JOIN hangar_bookings b ON h.id = b.listing_id
WHERE 
  h.approval_status = 'approved'  -- MUST BE APPROVED
  AND h.is_available = true       -- MUST BE AVAILABLE
GROUP BY h.id
ORDER BY bookings_count DESC
LIMIT 20;
```

### Visibility Matrix
```
┌────────────────────┬──────────────┬────────────┬──────────────────┐
│ approval_status    │ is_available │ is_paid    │ Customer Visible │
├────────────────────┼──────────────┼────────────┼──────────────────┤
│ 'pending'          │ true         │ FALSE      │ ✗ NO             │
│ 'pending'          │ true         │ TRUE       │ ✗ NO             │
│ 'approved'         │ false        │ TRUE       │ ✗ NO             │
│ 'approved'         │ true         │ FALSE      │ ✗ NO (blocked)   │
│ 'approved'         │ true         │ TRUE       │ ✓ YES            │
│ 'rejected'         │ any          │ any        │ ✗ NO             │
└────────────────────┴──────────────┴────────────┴──────────────────┘

VISIBILITY REQUIREMENTS (ALL must be true):
✓ approval_status = 'approved'
✓ is_available = true
✓ is_paid = true (implicit in most workflows)
```

### Owner's Own Listings
```
Owners can view their own listings regardless of status via:
GET /api/hangarshare/owner/dashboard

Returns ALL listings where owner_id = current_user_owner_id:
├─ Pending listings
├─ Approved listings
├─ Rejected listings
└─ Payment status for each
```

---

## 6. Critical System Gaps

### Gap 1: No Admin Approval UI
```
Problem:
├─ Admins cannot manually review and approve listings
├─ No interface to view pending listings queue
├─ No "Approve" or "Reject" buttons
└─ Must use API calls directly (not user-friendly)

Impact:
├─ Manual quality control not possible
├─ Payment = automatic approval (no quality check)
└─ Poor admin user experience

Required Solution:
├─ Build admin dashboard section: /admin?section=pending-listings
├─ Display table of pending listings with:
│   ├─ ID, Hangar Number, Location, Owner Name
│   ├─ Created Date, Payment Status
│   └─ Action buttons: [Approve] [Reject] [View Details]
├─ Modal for rejection reason input
└─ API: POST /api/admin/listings/approve
         POST /api/admin/listings/reject
```

### Gap 2: No Owner Image Upload
```
Problem:
├─ Owners cannot upload photos of their hangar
├─ All images are stock photos (set by system)
├─ No image validation or processing
└─ No image storage strategy defined

Impact:
├─ Listings lack authenticity
├─ Customers cannot see actual hangar
└─ Reduces trust and booking conversion

Required Decision:
Option A: Store images in Neon Database
├─ Table: hangar_images
├─ Column: image_data BYTEA (binary image data)
├─ Pros: Single source of truth, easier backup
└─ Cons: Database bloat, slower queries

Option B: Store in Cloud (S3/Cloudinary)
├─ Database stores: image_url (reference only)
├─ Actual files: AWS S3 or Cloudinary
├─ Pros: Scalable, faster loading, CDN
└─ Cons: External dependency, additional cost

Required Components:
├─ Upload form in /hangarshare/listing/create
├─ Image validation (size, type, dimensions)
├─ Storage implementation (database or cloud)
├─ API: POST /api/hangarshare/listings/[id]/upload-image
└─ Component: <HangarImageUpload />
```

### Gap 3: Payment = Automatic Approval
```
Problem:
├─ Stripe payment immediately approves listing
├─ No admin review after payment
├─ Low-quality listings can get approved if paid
└─ No mechanism for quality control

Impact:
├─ Risk of fake/misleading listings
├─ Customers may book inappropriate hangars
└─ Damages platform reputation

Required Solution (Choose One):
Option A: Payment + Manual Review
├─ Owner pays → listing marked 'paid_pending_review'
├─ Admin reviews → approves or rejects (refund)
└─ Two-step approval process

Option B: Pre-approval + Payment
├─ Admin reviews listing first
├─ If approved → request payment
├─ Payment confirmed → goes live
└─ Better quality control

Option C: Current (Keep Automatic)
├─ Payment = instant approval
├─ Rely on customer reports for bad listings
└─ Faster onboarding, less control
```

### Gap 4: No Booking System
```
Problem:
├─ Listings are "available" but no booking workflow
├─ Customers cannot make actual reservations
├─ No calendar system for availability
└─ No booking status tracking

Impact:
├─ Platform is display-only (not functional)
├─ Cannot generate booking revenue
└─ Owners cannot manage reservations

Required Components:
├─ Table: hangar_bookings
│   ├─ id, listing_id, user_id
│   ├─ check_in_date, check_out_date
│   ├─ aircraft_registration, aircraft_type
│   ├─ total_price, payment_status
│   ├─ booking_status ('pending', 'confirmed', 'cancelled')
│   └─ created_at, updated_at
│
├─ APIs:
│   ├─ POST /api/hangarshare/bookings/create
│   ├─ GET /api/hangarshare/bookings/my-bookings
│   ├─ PATCH /api/hangarshare/bookings/[id]/confirm
│   └─ PATCH /api/hangarshare/bookings/[id]/cancel
│
└─ UI Components:
    ├─ Calendar availability viewer
    ├─ Booking request form
    ├─ Owner booking management dashboard
    └─ Customer booking history page
```

### Gap 5: Duplicate/Redundant Columns
```
Problem:
├─ Multiple columns storing same data:
│   ├─ airport_icao vs icao_code
│   ├─ daily_rate vs price_per_day
│   ├─ weekly_rate vs price_per_week
│   ├─ monthly_rate vs price_per_month
│   ├─ max_height_meters vs dimensions_height
│   └─ hangar_size_sqm vs hangar_size
└─ Creates confusion and potential data inconsistency

Impact:
├─ Wasted database storage
├─ Unclear which field to use in queries
└─ Risk of conflicting data

Recommended Action:
├─ Database cleanup migration to remove duplicates
├─ Standardize on one set of column names
└─ Update all queries to use standardized names
```

### Gap 6: No Notification System for Owners
```
Problem:
├─ Owners don't know when listing is approved/rejected
├─ No email notification on status change
└─ Must manually check dashboard

Required Solution:
├─ Email notification on approval
├─ Email notification on rejection (with reason)
├─ In-app notification badge
└─ Integration with existing notification system
```

---

## 7. Working Features

### ✅ Fully Functional
```
1. User Authentication
   ├─ JWT token-based
   ├─ Role management (master, admin, staff, user)
   └─ Secure password hashing (bcrypt)

2. Owner Registration
   ├─ hangar_owners table operational
   ├─ Company profile creation
   └─ API: POST /api/hangarshare/owners

3. Listing Creation
   ├─ hangar_listings table (67 columns)
   ├─ All hangar data stored
   └─ API: POST /api/hangarshare/listing/create

4. Payment Processing
   ├─ Stripe integration working
   ├─ Payment intent creation
   ├─ Payment confirmation
   └─ APIs: /payment-intent, /confirm-payment

5. Financial Tracking
   ├─ financial_transactions table
   ├─ Income categorization
   └─ Transaction history

6. Status Management
   ├─ approval_status tracking
   ├─ availability_status tracking
   └─ is_paid flag system

7. Customer Listing Display
   ├─ Filtered by approval_status
   ├─ Only shows approved listings
   └─ API: GET /api/hangarshare/listing/highlighted

8. Test Data
   ├─ 20 hangar listings in database
   ├─ All with stock images
   └─ Various cities across Brazil
```

---

## 8. Technical Recommendations

### Immediate Priorities (High Impact)

#### Priority 1: Build Admin Approval UI
```
Urgency: HIGH
Effort: Medium (2-3 days)
Impact: Enables quality control

Tasks:
1. Create admin dashboard section
2. Build pending listings table component
3. Add approve/reject action buttons
4. Create APIs for approve/reject
5. Add rejection reason modal
6. Send email notifications on status change

Files to create:
├─ src/app/admin/pending-listings/page.tsx
├─ src/components/PendingListingsTable.tsx
├─ src/app/api/admin/listings/approve/route.ts
└─ src/app/api/admin/listings/reject/route.ts
```

#### Priority 2: Image Upload System
```
Urgency: HIGH
Effort: Large (3-5 days)
Impact: Authentic listings, better conversions

Decision Required:
Choose storage method: Database BYTEA vs Cloud Storage

If Database (BYTEA):
├─ Create table: hangar_images
├─ Store raw image data in PostgreSQL
├─ Serve via API: GET /api/hangarshare/listings/[id]/image
└─ Simple architecture, single database

If Cloud Storage (S3/Cloudinary):
├─ Store only URLs in database
├─ Upload files to S3 or Cloudinary
├─ Serve via CDN (faster)
└─ More scalable, requires external service

Recommended: Start with Database BYTEA for simplicity,
             migrate to S3 later if needed.
```

#### Priority 3: Two-Step Approval Process
```
Urgency: MEDIUM
Effort: Medium (2 days)
Impact: Better quality control

Workflow:
1. Owner creates listing → status: 'pending'
2. Admin reviews → status: 'reviewed_approved' or 'rejected'
3. If approved, owner pays → status: 'approved'
4. Listing goes live

New status values:
├─ 'pending' (awaiting review)
├─ 'reviewed_approved' (approved but unpaid)
├─ 'approved' (approved AND paid)
└─ 'rejected' (with rejection_reason)
```

### Secondary Priorities (Medium Impact)

#### Priority 4: Database Cleanup
```
Urgency: LOW
Effort: Small (1 day)
Impact: Data consistency

Tasks:
1. Identify duplicate columns
2. Create migration to remove duplicates
3. Update all queries to use standardized names
4. Run migration on production

Example duplicates to remove:
├─ Keep: icao_code → Remove: airport_icao
├─ Keep: daily_rate → Remove: price_per_day
├─ Keep: weekly_rate → Remove: price_per_week
└─ Keep: monthly_rate → Remove: price_per_month
```

#### Priority 5: Owner Notification System
```
Urgency: MEDIUM
Effort: Small (1 day)
Impact: Better user experience

Tasks:
1. Send email on approval
2. Send email on rejection
3. Create email templates
4. Integrate with existing notification system

Email triggers:
├─ Listing approved → "Congratulations! Your listing is live"
├─ Listing rejected → "Review needed: Your listing"
└─ Payment received → "Payment confirmed"
```

#### Priority 6: Booking System (Future)
```
Urgency: LOW (post-launch)
Effort: Very Large (2-3 weeks)
Impact: Platform functionality completion

This is a complete subsystem requiring:
├─ Database schema for bookings
├─ Calendar availability system
├─ Booking request workflow
├─ Payment integration for bookings
├─ Owner dashboard for booking management
└─ Customer booking history

Recommend: Launch marketplace first,
           add booking system in phase 2.
```

---

## 9. Decision Points for Discussion

### Decision 1: Image Storage Strategy
```
Question: Where should owner-uploaded images be stored?

Option A: Neon Database (BYTEA columns)
Pros:
  ✓ Single database = single backup
  ✓ No external dependencies
  ✓ Simple architecture
  ✓ Free (no additional costs)
Cons:
  ✗ Database bloat (images are large)
  ✗ Slower queries
  ✗ Not ideal for image processing

Option B: AWS S3
Pros:
  ✓ Scalable for large volumes
  ✓ Fast CDN delivery
  ✓ Image optimization available
  ✓ Industry standard
Cons:
  ✗ Additional cost (~$20-30/month)
  ✗ External dependency
  ✗ More complex setup

Option C: Cloudinary
Pros:
  ✓ Free tier (25 GB)
  ✓ Built-in optimization
  ✓ Automatic CDN
  ✓ Easy setup
Cons:
  ✗ Third-party dependency
  ✗ Less control than S3

Recommendation:
Start with Database (BYTEA) for MVP launch.
Migrate to S3 if scaling becomes an issue.
```

### Decision 2: Approval Workflow
```
Question: When should listings be approved?

Current: Payment = Instant Approval
├─ Owner pays via Stripe
├─ System automatically approves
└─ No quality review

Option A: Keep Current (Automatic)
Pros:
  ✓ Fastest onboarding
  ✓ No admin workload
Cons:
  ✗ No quality control
  ✗ Risk of fake listings

Option B: Two-Step (Payment + Review)
Pros:
  ✓ Quality control
  ✓ Admin can review before going live
Cons:
  ✗ Slower onboarding
  ✗ Admin workload

Option C: Review First, Then Payment
Pros:
  ✓ Best quality control
  ✓ No refunds needed
Cons:
  ✗ Slowest process
  ✗ Requires admin availability

Recommendation:
Option B (Two-Step) for best balance.
Payment shows commitment, review ensures quality.
```

### Decision 3: Image Upload Requirements
```
Question: Should image upload be mandatory?

Option A: Optional (current)
├─ Listings can be created without images
└─ Use stock photos as placeholder

Option B: Mandatory
├─ Owners MUST upload at least 1 image
├─ Listing creation blocked without image
└─ More authentic listings

Recommendation:
Make it MANDATORY for better marketplace quality.
Require minimum 1 image, allow up to 5.
```

### Decision 4: Development Approach
```
Question: How should we prioritize development?

Option A: Feature Complete (before launch)
├─ Build everything: approval UI, images, booking
├─ Launch when 100% ready
└─ Timeline: 4-6 weeks

Option B: MVP Launch (minimal features)
├─ Launch with: listings, payment, basic approval
├─ Add booking system post-launch
└─ Timeline: 1-2 weeks

Option C: Phased Rollout
├─ Phase 1: Marketplace display (1 week)
├─ Phase 2: Booking system (2 weeks)
├─ Phase 3: Advanced features (ongoing)
└─ Timeline: Iterative

Recommendation:
Option C (Phased Rollout) for faster feedback loop.
```

---

## 10. Summary & Next Steps

### Current System State
```
✅ Data Storage: Fully operational (67 fields in hangar_listings)
✅ Payment: Stripe integration working
✅ Status Tracking: approval_status system in place
✅ Customer Display: Filtered listing queries working
⚠️  Admin UI: No approval interface
⚠️  Images: Stock photos only, no owner uploads
⚠️  Booking: Not implemented
```

### Blocking Issues Requiring Decisions
```
1. Image storage location (database vs cloud)
2. Approval workflow (automatic, two-step, or review-first)
3. Image upload requirements (mandatory vs optional)
4. Development priority order
```

### Recommended Immediate Actions
```
1. Decide on image storage strategy
2. Build admin approval UI (Priority 1)
3. Implement owner image upload (Priority 2)
4. Choose approval workflow model
5. Launch MVP marketplace
```

### Questions for Client Decision
```
1. Where should images be stored?
   → Database (simple) or Cloud (scalable)?

2. When should listings be approved?
   → Automatic payment approval or manual review?

3. Are images mandatory?
   → Require photo upload or allow stock images?

4. What's the launch timeline?
   → Build everything first or phased rollout?

5. Booking system priority?
   → Include in initial launch or add later?
```

---

## Appendix A: API Endpoints Reference

### Owner Endpoints
```
POST   /api/hangarshare/owners
       Create hangar owner profile

POST   /api/hangarshare/listing/create
       Create new hangar listing

POST   /api/hangarshare/owner/payment-intent
       Create Stripe payment intent

POST   /api/hangarshare/owner/confirm-payment
       Confirm Stripe payment

GET    /api/hangarshare/owner/dashboard
       Owner dashboard data
```

### Admin Endpoints
```
POST   /api/hangarshare/listings/pay
       Mark listing as paid (manual)

GET    /api/admin/listings?status=pending
       List pending listings

POST   /api/admin/listings/approve (needs to be created)
       Approve a listing

POST   /api/admin/listings/reject (needs to be created)
       Reject a listing
```

### Public Endpoints
```
GET    /api/hangarshare/listing/highlighted
       Get approved public listings

GET    /api/hangarshare/listing/[id]
       Get single listing details

GET    /api/hangarshare/listings/with-images
       Get listings with image URLs
```

---

## Appendix B: Database Schema Details

### hangar_listings Complete Schema
```sql
CREATE TABLE hangar_listings (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  
  -- Foreign Keys
  owner_id INTEGER REFERENCES hangar_owners(id),
  approved_by INTEGER REFERENCES users(id),
  
  -- Location
  icao_code VARCHAR(10),
  airport_icao VARCHAR(10),  -- duplicate
  aerodrome_name VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Brasil',
  hangar_number VARCHAR(50),
  hangar_location_description TEXT,
  
  -- Physical Specifications
  hangar_size_sqm NUMERIC(10,2),
  hangar_size VARCHAR(50),  -- duplicate
  max_wingspan_meters NUMERIC(10,2),
  max_length_meters NUMERIC(10,2),
  max_height_meters NUMERIC(10,2),
  dimensions_length NUMERIC(10,2),  -- duplicate
  dimensions_width NUMERIC(10,2),
  dimensions_height NUMERIC(10,2),  -- duplicate
  door_dimensions TEXT,
  maximum_aircraft_weight NUMERIC(10,2),
  accepted_aircraft_categories JSONB,
  
  -- Facility Features
  floor_type VARCHAR(50),
  lighting VARCHAR(100),
  climate_control BOOLEAN DEFAULT false,
  electricity BOOLEAN DEFAULT false,
  water_access BOOLEAN DEFAULT false,
  fuel_nearby BOOLEAN DEFAULT false,
  maintenance_facilities BOOLEAN DEFAULT false,
  security_features TEXT,
  services JSONB,
  
  -- Pricing
  hourly_rate NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  price_per_day NUMERIC(10,2),  -- duplicate
  weekly_rate NUMERIC(10,2),
  price_per_week NUMERIC(10,2),  -- duplicate
  monthly_rate NUMERIC(10,2),
  price_per_month NUMERIC(10,2),  -- duplicate
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  availability_status VARCHAR(50),
  available_from DATE,
  available_until DATE,
  operating_hours JSONB,
  minimum_rental_period VARCHAR(50),
  
  -- Payment & Policies
  accepts_online_payment BOOLEAN DEFAULT true,
  accepts_payment_on_arrival BOOLEAN DEFAULT true,
  accepts_payment_on_departure BOOLEAN DEFAULT false,
  cancellation_policy VARCHAR(100) DEFAULT 'flexible',
  insurance_required BOOLEAN DEFAULT false,
  
  -- Status (CRITICAL)
  status VARCHAR(50) DEFAULT 'active',
  approval_status VARCHAR(50) DEFAULT 'pending',
  verification_status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  verified_at TIMESTAMP,
  
  -- Payment Tracking
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  paid_amount NUMERIC(10,2),
  paid_currency VARCHAR(3) DEFAULT 'BRL',
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50),
  
  -- Media
  image_url VARCHAR(500),
  photos JSONB,
  
  -- Description
  description TEXT,
  special_notes TEXT,
  special_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**End of Document**

---

**Document Prepared By:** GitHub Copilot AI  
**Date:** January 13, 2026  
**Version:** 1.0  
**Status:** For Review & Decision-Making

**Next Steps:**
1. Print and review this document
2. Make decisions on open questions
3. Prioritize development tasks
4. Schedule implementation timeline
