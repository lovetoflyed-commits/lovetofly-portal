# HangarShare Management System - Complete Organogram & Implementation Plan
**Date:** January 20, 2026  
**Version:** 1.0  
**Purpose:** Comprehensive system structure, workflow, and step-by-step implementation guide

---

## Table of Contents
1. [System Organogram](#1-system-organogram)
2. [Data Flow Architecture](#2-data-flow-architecture)
3. [Workflow Diagrams](#3-workflow-diagrams)
4. [Implementation Plan](#4-implementation-plan)
5. [Area-by-Area Breakdown](#5-area-by-area-breakdown)
6. [Integration Points](#6-integration-points)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Roadmap](#8-deployment-roadmap)

---

## 1. System Organogram

### 1.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HANGARSHARE MANAGEMENT SYSTEM                     │
│                         (Admin Dashboard)                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   FRONT-END   │          │   BACK-END    │          │   DATABASE    │
│  (Dashboard)  │◄────────►│  (API Layer)  │◄────────►│  (PostgreSQL) │
│   Next.js     │          │   Next.js     │          │     Neon      │
│   React 19    │          │   Route API   │          │   15 Tables   │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   UI LAYER    │          │  BUSINESS     │          │   DATA        │
│  Components   │          │   LOGIC       │          │   MODELS      │
│  Tabs/Cards   │          │  Controllers  │          │   Tables      │
└───────────────┘          └───────────────┘          └───────────────┘
```

### 1.2 Detailed System Hierarchy

```
HANGARSHARE ADMIN SYSTEM
│
├─ 📊 OVERVIEW TAB (Dashboard Home)
│   ├─ Hero Metrics Section
│   │   ├─ Active Bookings Widget
│   │   ├─ Occupancy Rate Widget
│   │   ├─ Revenue Today/MTD Widget
│   │   └─ Pending Actions Widget
│   │
│   ├─ Financial Summary Section
│   │   ├─ Revenue Chart (30-day)
│   │   ├─ Top Locations (Top 5)
│   │   ├─ Payout Queue Status
│   │   └─ Commission Breakdown
│   │
│   ├─ Operational Grid Section
│   │   ├─ Hangar Statistics
│   │   ├─ Owner Statistics
│   │   ├─ Customer Statistics
│   │   └─ Review Summary
│   │
│   ├─ Alerts & Quick Actions
│   │   ├─ Verification Queue Alert
│   │   ├─ Low-Rated Hangars Alert
│   │   ├─ Support Tickets Alert
│   │   └─ Booking Conflicts Alert
│   │
│   └─ Recent Activity Feed
│       ├─ New Bookings
│       ├─ Completed Payouts
│       ├─ New Reviews
│       └─ System Events
│
├─ ✓ VERIFICATIONS TAB (Owner Approval)
│   ├─ Pending Verifications List
│   │   ├─ Owner Information Display
│   │   ├─ Document Status
│   │   └─ Verification Actions
│   │
│   ├─ Verification Detail Modal
│   │   ├─ Company Documents Review
│   │   ├─ Identity Verification
│   │   ├─ Hangar Ownership Proof
│   │   └─ Approve/Reject Actions
│   │
│   └─ Verification History
│       ├─ Approved Owners Log
│       ├─ Rejected Applications
│       └─ Processing Time Metrics
│
├─ 🏢 OWNERS TAB (Owner Management)
│   ├─ All Owners List
│   │   ├─ Owner Profile Info
│   │   ├─ Verification Status
│   │   ├─ Listing Count
│   │   └─ Performance Metrics
│   │
│   ├─ Owner Detail View
│   │   ├─ Company Information
│   │   ├─ Contact Details
│   │   ├─ Bank Account Info
│   │   ├─ Hangar Portfolio
│   │   ├─ Booking History
│   │   ├─ Revenue Analytics
│   │   └─ Rating & Reviews
│   │
│   └─ Owner Actions
│       ├─ Edit Profile
│       ├─ Suspend Account
│       ├─ Resend Verification
│       └─ View Payout History
│
├─ 🏠 HANGARS TAB (Listing Management)
│   ├─ All Listings Grid/Table
│   │   ├─ Listing Preview Card
│   │   ├─ Status Badge
│   │   ├─ Location Info
│   │   ├─ Pricing Display
│   │   └─ Quick Actions
│   │
│   ├─ Listing Filters
│   │   ├─ Status Filter (active/pending/inactive)
│   │   ├─ Location Filter (ICAO/City)
│   │   ├─ Rating Filter (>4.0, <4.0)
│   │   ├─ Featured Filter
│   │   └─ Price Range Filter
│   │
│   ├─ Listing Detail View
│   │   ├─ Full Information Display
│   │   ├─ Photo Gallery
│   │   ├─ Amenities Checklist
│   │   ├─ Pricing Structure
│   │   ├─ Availability Calendar
│   │   ├─ Booking History
│   │   └─ Review History
│   │
│   └─ Listing Actions
│       ├─ Approve/Reject
│       ├─ Feature Listing
│       ├─ Pause/Unpause
│       ├─ Edit Details
│       └─ Archive Listing
│
├─ 📅 BOOKINGS TAB (Reservation Management)
│   ├─ Bookings List/Calendar View
│   │   ├─ Booking Card Display
│   │   ├─ Status Color Coding
│   │   ├─ Check-in/out Dates
│   │   ├─ Customer Info
│   │   └─ Payment Status
│   │
│   ├─ Booking Filters
│   │   ├─ Status Filter
│   │   ├─ Date Range Filter
│   │   ├─ Location Filter
│   │   ├─ Owner Filter
│   │   └─ Payment Status Filter
│   │
│   ├─ Booking Detail View
│   │   ├─ Full Booking Information
│   │   ├─ Renter Details
│   │   ├─ Aircraft Details
│   │   ├─ Hangar Details
│   │   ├─ Payment Breakdown
│   │   ├─ Communication Log
│   │   └─ Timeline History
│   │
│   └─ Booking Actions
│       ├─ Modify Dates
│       ├─ Cancel Booking
│       ├─ Process Refund
│       ├─ Mark as Completed
│       ├─ Resolve Dispute
│       └─ Contact Parties
│
├─ 💰 FINANCIAL TAB (Revenue & Payouts) [NEW]
│   ├─ Revenue Dashboard
│   │   ├─ Total Revenue (Today/MTD/YTD)
│   │   ├─ Revenue by Source
│   │   ├─ Revenue by Location
│   │   ├─ Revenue Trends Chart
│   │   └─ Revenue Forecasting
│   │
│   ├─ Commission Tracking
│   │   ├─ Total Fees Collected
│   │   ├─ Average Commission Rate
│   │   ├─ Fee Breakdown by Type
│   │   └─ Net Revenue Calculation
│   │
│   ├─ Payout Management
│   │   ├─ Payouts Due Queue
│   │   ├─ Payouts Processing
│   │   ├─ Payouts Completed
│   │   ├─ Payout Hold/Issues
│   │   └─ Owner Payout History
│   │
│   ├─ Payment Analytics
│   │   ├─ Payment Success Rate
│   │   ├─ Failed Transactions
│   │   ├─ Refunds Issued
│   │   ├─ Chargeback Tracking
│   │   └─ Payment Method Mix
│   │
│   └─ Financial Reports
│       ├─ P&L Statement
│       ├─ Cash Flow Report
│       ├─ Tax Documentation
│       ├─ Owner Earnings Report
│       └─ Export Functionality
│
├─ 📊 ANALYTICS TAB (Business Intelligence) [NEW]
│   ├─ Occupancy Analytics
│   │   ├─ Current Occupancy Rate
│   │   ├─ Historical Trends
│   │   ├─ Occupancy by Location
│   │   ├─ Occupancy by Hangar Type
│   │   └─ Forecast Occupancy
│   │
│   ├─ Customer Analytics
│   │   ├─ Total Customers
│   │   ├─ New vs Returning
│   │   ├─ Customer Lifetime Value
│   │   ├─ Churn Rate
│   │   └─ Acquisition Channels
│   │
│   ├─ Performance Metrics
│   │   ├─ Booking Conversion Rate
│   │   ├─ Average Booking Value
│   │   ├─ Lead Time Analysis
│   │   ├─ Cancellation Rate
│   │   └─ No-Show Rate
│   │
│   ├─ Market Intelligence
│   │   ├─ Location Performance
│   │   ├─ Competitive Analysis
│   │   ├─ Demand Patterns
│   │   ├─ Pricing Optimization
│   │   └─ Growth Opportunities
│   │
│   └─ Custom Reports
│       ├─ Report Builder
│       ├─ Saved Reports
│       ├─ Scheduled Reports
│       └─ Data Export
│
├─ ⭐ QUALITY TAB (Reviews & Ratings) [NEW]
│   ├─ Review Overview
│   │   ├─ Average Platform Rating
│   │   ├─ Total Reviews Count
│   │   ├─ Review Completion Rate
│   │   ├─ Rating Distribution
│   │   └─ Review Trends
│   │
│   ├─ Pending Reviews
│   │   ├─ Reviews to Moderate
│   │   ├─ Flagged Reviews
│   │   ├─ Reported Content
│   │   └─ Moderation Actions
│   │
│   ├─ Quality Monitoring
│   │   ├─ High-Rated Hangars (>4.5)
│   │   ├─ Low-Rated Hangars (<3.5)
│   │   ├─ Quality Improvement Plans
│   │   └─ Owner Response Tracking
│   │
│   ├─ Dispute Management
│   │   ├─ Active Disputes
│   │   ├─ Resolved Cases
│   │   ├─ Mediation Process
│   │   └─ Resolution Outcomes
│   │
│   └─ Quality Reports
│       ├─ Quality Score by Owner
│       ├─ Quality Score by Location
│       ├─ Improvement Trends
│       └─ Satisfaction Index
│
├─ 🎯 PROMOTIONS TAB (Marketing & Featured) [NEW]
│   ├─ Featured Listings
│   │   ├─ Active Featured
│   │   ├─ Featured Performance
│   │   ├─ Feature Pricing Tiers
│   │   └─ Feature Management
│   │
│   ├─ Promotion Campaigns
│   │   ├─ Active Campaigns
│   │   ├─ Campaign Performance
│   │   ├─ Discount Code Manager
│   │   └─ Campaign ROI Tracking
│   │
│   ├─ Upsell Opportunities
│   │   ├─ Eligible Owners
│   │   ├─ Conversion Tracking
│   │   ├─ Revenue Impact
│   │   └─ Automated Outreach
│   │
│   └─ Marketing Analytics
│       ├─ Conversion Rates
│       ├─ Revenue Attribution
│       ├─ Feature Adoption
│       └─ Campaign Effectiveness
│
└─ ⚙️ SETTINGS TAB (Configuration) [NEW]
    ├─ Platform Settings
    │   ├─ Commission Rates
    │   ├─ Service Fees
    │   ├─ Payout Schedule
    │   └─ Booking Rules
    │
    ├─ Notification Settings
    │   ├─ Email Templates
    │   ├─ SMS Templates
    │   ├─ Notification Rules
    │   └─ Communication Preferences
    │
    ├─ Integration Settings
    │   ├─ Payment Gateway (Stripe)
    │   ├─ Email Service (Resend)
    │   ├─ SMS Provider
    │   └─ Analytics Tools
    │
    └─ Admin Management
        ├─ Admin Users
        ├─ Role Permissions
        ├─ Audit Logs
        └─ Security Settings
```

---

## 2. Data Flow Architecture

### 2.1 System Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                          │
└────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   RENTERS    │  │    OWNERS    │  │    ADMINS    │
        │  (Frontend)  │  │  (Frontend)  │  │  (Dashboard) │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │              NEXT.JS API ROUTES                 │
        │         /api/admin/hangarshare/*                │
        └─────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  STATS API   │  │  OWNERS API  │  │ LISTINGS API │
        │   /stats     │  │   /owners    │  │  /listings   │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │         DATABASE CONNECTION POOL                │
        │              (PostgreSQL via Neon)              │
        └─────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │    TABLES    │  │    VIEWS     │  │   INDEXES    │
        │  15 tables   │  │  3 views     │  │  25 indexes  │
        └──────────────┘  └──────────────┘  └──────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   OWNERS     │  │   LISTINGS   │  │   BOOKINGS   │
        │   USERS      │  │   PHOTOS     │  │   PAYMENTS   │
        │   REVIEWS    │  │   AIRPORTS   │  │   ACTIVITY   │
        └──────────────┘  └──────────────┘  └──────────────┘
```

### 2.2 Data Dependencies Map

```
DATABASE TABLES RELATIONSHIPS
│
├─ users (core authentication)
│   └─→ hangar_owners (one-to-one)
│       ├─→ hangar_listings (one-to-many)
│       │   ├─→ hangar_photos (one-to-many)
│       │   ├─→ hangar_amenities (many-to-many)
│       │   ├─→ bookings (one-to-many)
│       │   │   ├─→ hangar_booking_payments (one-to-one)
│       │   │   └─→ hangar_reviews (one-to-one)
│       │   └─→ hangar_favorites (many-to-many with users)
│       └─→ hangar_owner_verification (one-to-one) [DEPRECATED]
│
├─ airport_icao (reference data)
│   └─→ hangar_listings (many-to-one)
│
└─ user_notifications (system)
    └─→ users (many-to-one)
```

### 2.3 API Endpoint Structure

```
API ROUTES HIERARCHY
│
/api/admin/hangarshare/
│
├─ overview-stats (GET) [NEW]
│   └─ Returns: Complete dashboard metrics
│       ├─ Active bookings count
│       ├─ Occupancy rate
│       ├─ Revenue (today/MTD/YTD)
│       ├─ Pending actions count
│       ├─ Owner statistics
│       ├─ Listing statistics
│       ├─ Customer statistics
│       ├─ Review summary
│       ├─ Financial summary
│       └─ Recent activity log
│
├─ stats (GET) [EXISTING]
│   └─ Returns: Basic HangarShare statistics
│       ├─ Total users, owners, listings
│       ├─ Booking counts
│       ├─ Revenue generated
│       └─ Occupancy rate
│
├─ owners (GET, POST, PATCH, DELETE)
│   ├─ GET: List all owners with filters
│   ├─ POST: Create new owner (admin)
│   ├─ PATCH: Update owner status/info
│   └─ DELETE: Soft delete owner
│
├─ owners/[id] (GET, PATCH)
│   ├─ GET: Owner detail + performance metrics
│   └─ PATCH: Update specific owner
│
├─ owners/[id]/verify (POST)
│   └─ Approve or reject owner verification
│
├─ listings (GET, PATCH)
│   ├─ GET: List all listings with filters
│   └─ PATCH: Bulk update listings
│
├─ listings/[id] (GET, PATCH, DELETE)
│   ├─ GET: Full listing details
│   ├─ PATCH: Update listing status/info
│   └─ DELETE: Archive listing
│
├─ listings/[id]/feature (POST)
│   └─ Add/remove featured status
│
├─ bookings (GET)
│   └─ GET: List all bookings with filters
│
├─ bookings/[id] (GET, PATCH)
│   ├─ GET: Full booking details
│   └─ PATCH: Update booking status
│
├─ bookings/[id]/refund (POST)
│   └─ Process booking refund
│
├─ financial/revenue (GET) [NEW]
│   └─ Returns: Revenue analytics
│       ├─ Daily/weekly/monthly breakdown
│       ├─ Revenue by location
│       ├─ Revenue by source
│       └─ Revenue trends
│
├─ financial/payouts (GET, POST) [NEW]
│   ├─ GET: Payout queue and history
│   └─ POST: Process payout batch
│
├─ financial/commission (GET) [NEW]
│   └─ Returns: Commission analytics
│       ├─ Total fees collected
│       ├─ Commission by owner
│       └─ Fee breakdown
│
├─ analytics/occupancy (GET) [NEW]
│   └─ Returns: Occupancy metrics
│       ├─ Current rate
│       ├─ Historical trends
│       ├─ By location
│       └─ Forecasting
│
├─ analytics/customers (GET) [NEW]
│   └─ Returns: Customer metrics
│       ├─ Total/active/new
│       ├─ Lifetime value
│       ├─ Churn rate
│       └─ Acquisition channels
│
├─ quality/reviews (GET, PATCH) [NEW]
│   ├─ GET: All reviews with filters
│   └─ PATCH: Moderate review
│
├─ quality/disputes (GET, POST) [NEW]
│   ├─ GET: Active disputes
│   └─ POST: Resolve dispute
│
└─ promotions/featured (GET, POST) [NEW]
    ├─ GET: Featured listings status
    └─ POST: Add/remove featured
```

---

## 3. Workflow Diagrams

### 3.1 Owner Verification Workflow

```
OWNER APPLICATION → VERIFICATION → ACTIVATION
│
├─ STEP 1: Owner Submits Application
│   ├─ Company information (CNPJ, name, address)
│   ├─ Owner identity (CPF, RG, proof of address)
│   ├─ Hangar ownership proof (deed/lease)
│   ├─ Insurance documents
│   └─ Bank account details
│   │
│   ├─→ Saved to: hangar_owners table
│   │   └─ is_verified = false
│   │   └─ verification_status = 'pending'
│   │
│   └─→ Triggers: Email notification to admins
│
├─ STEP 2: Admin Reviews Application
│   ├─ Access: /admin/hangarshare?tab=users
│   ├─ View: Pending verification list
│   ├─ Action: Click "Verificar" button
│   │
│   ├─→ Opens: Verification detail modal
│   │   ├─ Document viewer
│   │   ├─ Compliance checklist
│   │   ├─ Notes field
│   │   └─ Action buttons
│   │
│   └─→ Admin Decision:
│       ├─ APPROVE → Go to Step 3
│       └─ REJECT → Go to Step 4
│
├─ STEP 3: Approval Process
│   ├─ Action: Click "Aprovar" button
│   ├─ Update: hangar_owners table
│   │   ├─ is_verified = true
│   │   ├─ verification_status = 'approved'
│   │   ├─ verified_at = NOW()
│   │   └─ verified_by = admin_id
│   │
│   ├─→ Triggers: Email to owner
│   │   └─ Subject: "Sua conta foi aprovada!"
│   │   └─ Content: Welcome message + next steps
│   │
│   └─→ Owner Can Now:
│       ├─ Create hangar listings
│       ├─ Receive bookings
│       ├─ Access owner dashboard
│       └─ Receive payouts
│
└─ STEP 4: Rejection Process
    ├─ Action: Click "Rejeitar" button
    ├─ Required: Rejection reason
    ├─ Update: hangar_owners table
    │   ├─ verification_status = 'rejected'
    │   ├─ rejection_reason = [reason]
    │   └─ rejected_at = NOW()
    │
    ├─→ Triggers: Email to owner
    │   └─ Subject: "Documentação necessita revisão"
    │   └─ Content: Reason + resubmit instructions
    │
    └─→ Owner Can:
        └─ Resubmit corrected documents
```

### 3.2 Booking Lifecycle Workflow

```
BOOKING REQUEST → CONFIRMATION → CHECK-IN → CHECK-OUT → PAYMENT
│
├─ PHASE 1: Booking Request
│   ├─ Renter searches hangars
│   ├─ Selects hangar + dates
│   ├─ Enters aircraft details
│   ├─ Submits booking request
│   │
│   ├─→ Creates: bookings record
│   │   └─ status = 'pending'
│   │   └─ booking_status = 'pending'
│   │
│   └─→ Triggers:
│       ├─ Email to owner (new booking request)
│       ├─ Email to renter (confirmation sent)
│       └─ Admin notification (new booking)
│
├─ PHASE 2: Owner Confirmation
│   ├─ Owner reviews request
│   ├─ Checks aircraft compatibility
│   ├─ Confirms availability
│   │
│   ├─→ If Accepts:
│   │   ├─ Update: status = 'confirmed'
│   │   ├─ Trigger: Payment request to renter
│   │   └─ Email: "Sua reserva foi confirmada!"
│   │
│   └─→ If Rejects:
│       ├─ Update: status = 'cancelled'
│       ├─ Reason: Required
│       └─ Email: "Reserva não disponível"
│
├─ PHASE 3: Payment Processing
│   ├─ Renter receives payment link
│   ├─ Enters payment details (Stripe)
│   ├─ Payment processed
│   │
│   ├─→ If Successful:
│   │   ├─ Create: hangar_booking_payments record
│   │   │   └─ payment_status = 'paid'
│   │   ├─ Update: bookings.payment_status = 'paid'
│   │   ├─ Email: Payment receipt to renter
│   │   └─ Notify: Owner of confirmed booking
│   │
│   └─→ If Failed:
│       ├─ Update: payment_status = 'failed'
│       ├─ Retry: Payment link (3 attempts)
│       └─ If still failed: Cancel booking
│
├─ PHASE 4: Check-In
│   ├─ Renter arrives at hangar
│   ├─ Owner confirms arrival
│   ├─ Aircraft inspection (optional)
│   │
│   ├─→ Admin Can:
│   │   └─ Update: booking_status = 'active'
│   │
│   └─→ Notifications:
│       └─ Confirm check-in to both parties
│
├─ PHASE 5: Active Booking
│   ├─ Aircraft stored in hangar
│   ├─ Duration tracking
│   ├─ Support available
│   │
│   └─→ Dashboard Shows:
│       ├─ Active bookings count
│       ├─ Expected check-out date
│       └─ Occupancy status
│
├─ PHASE 6: Check-Out
│   ├─ Renter removes aircraft
│   ├─ Owner confirms departure
│   ├─ Hangar inspection
│   │
│   ├─→ If No Issues:
│   │   ├─ Update: booking_status = 'completed'
│   │   ├─ Trigger: Review request (both parties)
│   │   └─ Initiate: Payout process
│   │
│   └─→ If Issues Found:
│       ├─ Create: Dispute record
│       ├─ Hold: Payout until resolved
│       └─ Notify: Admin for mediation
│
└─ PHASE 7: Payout & Review
    ├─ Calculate: Owner earnings (total - commission)
    ├─ Schedule: Payout (5-7 business days)
    ├─ Process: Bank transfer
    │
    ├─→ Update Tables:
    │   ├─ hangar_booking_payments.payout_status = 'processing'
    │   └─ Later: payout_status = 'completed'
    │
    └─→ Request Reviews:
        ├─ Email to renter: Rate hangar
        ├─ Email to owner: Rate renter
        └─ Dashboard: Shows review requests
```

### 3.3 Financial Processing Workflow

```
BOOKING PAYMENT → COMMISSION → PAYOUT → RECONCILIATION
│
├─ STEP 1: Payment Collection
│   ├─ Stripe processes payment
│   ├─ Amount: Total booking cost
│   ├─ Method: Credit card / PIX / Boleto
│   │
│   ├─→ Creates: hangar_booking_payments
│   │   ├─ amount (total)
│   │   ├─ payment_method
│   │   ├─ payment_status = 'paid'
│   │   ├─ stripe_payment_id
│   │   └─ paid_at (timestamp)
│   │
│   └─→ Stripe Webhook:
│       └─ /api/hangarshare/webhook/stripe
│           └─ Confirms payment success
│
├─ STEP 2: Commission Calculation
│   ├─ Total Paid: R$ 1,000.00
│   ├─ Platform Fee: 12% = R$ 120.00
│   ├─ Stripe Fee: 3.5% = R$ 35.00
│   ├─ Net to Owner: R$ 845.00
│   │
│   ├─→ Store in: hangar_booking_payments
│   │   ├─ platform_fee = 120.00
│   │   ├─ stripe_fee = 35.00
│   │   └─ owner_payout = 845.00
│   │
│   └─→ Admin Dashboard Shows:
│       ├─ Total Revenue: R$ 1,000.00
│       ├─ Commission Earned: R$ 120.00
│       └─ Owner Payout Due: R$ 845.00
│
├─ STEP 3: Payout Queue
│   ├─ Booking completed (check-out confirmed)
│   ├─ Review period: 48 hours (dispute window)
│   ├─ If no disputes: Add to payout queue
│   │
│   ├─→ Update: hangar_booking_payments
│   │   ├─ payout_status = 'pending'
│   │   └─ payout_scheduled_date = +7 days
│   │
│   └─→ Admin Dashboard:
│       └─ /admin/hangarshare (Financial Tab)
│           └─ "Payouts Due This Week"
│               └─ Shows all pending payouts
│
├─ STEP 4: Payout Processing
│   ├─ Admin reviews payout queue
│   ├─ Verifies owner bank details
│   ├─ Batch process payouts
│   │
│   ├─→ For Each Owner:
│   │   ├─ Sum all pending payouts
│   │   ├─ Create bank transfer (Stripe Connect)
│   │   └─ Update status = 'processing'
│   │
│   └─→ Bank Transfer:
│       ├─ Amount: R$ 845.00
│       ├─ Destination: Owner's bank account
│       ├─ Reference: Booking IDs
│       └─ ETA: 2-5 business days
│
├─ STEP 5: Payout Confirmation
│   ├─ Stripe confirms transfer
│   ├─ Update: payout_status = 'completed'
│   ├─ Record: payout_completed_at
│   │
│   ├─→ Triggers:
│   │   ├─ Email to owner: "Pagamento enviado!"
│   │   └─ Admin log: Payout completed
│   │
│   └─→ Dashboard Updates:
│       ├─ Remove from "Pending" queue
│       ├─ Add to "Completed" list
│       └─ Update financial reports
│
└─ STEP 6: Reconciliation
    ├─ Monthly: Generate financial report
    ├─ Compare: Stripe balance vs database
    ├─ Verify: All payouts processed
    │
    ├─→ Report Includes:
    │   ├─ Total bookings processed
    │   ├─ Total revenue collected
    │   ├─ Total commissions earned
    │   ├─ Total payouts sent
    │   ├─ Current balance
    │   └─ Outstanding payouts
    │
    └─→ Export:
        ├─ CSV for accounting
        ├─ PDF for records
        └─ Tax documentation
```

---

## 4. Implementation Plan

### 4.1 Phase 1: Enhanced Overview Dashboard (Week 1-2)

#### 4.1.1 Backend Development

**Task 1.1: Create Overview Stats API**

```typescript
// File: /src/app/api/admin/hangarshare/overview-stats/route.ts

Implementation Steps:

1. Create new API route file
2. Import database connection pool
3. Define comprehensive stats interface
4. Implement parallel queries for performance
5. Add error handling and fallbacks
6. Return structured JSON response

Required Queries:
├─ Active bookings count (status='active')
├─ Today's check-ins/check-outs
├─ Current occupancy rate
├─ Revenue today/MTD/YTD
├─ Pending verifications count
├─ Total owners (verified/pending)
├─ Total listings (by status)
├─ Total customers (active/new)
├─ Average rating
├─ Pending reviews count
├─ Support tickets count (if applicable)
└─ Recent activity (last 10 events)

Database Tables to Query:
├─ hangar_owners (owner statistics)
├─ hangar_listings (listing statistics)
├─ bookings (booking statistics)
├─ hangar_booking_payments (financial data)
├─ users (customer statistics)
├─ hangar_reviews (rating data)
└─ user_activity_log (recent activity) [if exists]

Code Structure:
export async function GET(request: Request) {
  try {
    // 1. Verify admin authentication
    // 2. Execute parallel queries (Promise.all)
    // 3. Calculate derived metrics
    // 4. Format response
    // 5. Return JSON with cache headers
  } catch (error) {
    // Error handling
  }
}

Expected Response Format:
{
  // Hero Metrics
  activeBookings: number,
  todayCheckIns: number,
  todayCheckOuts: number,
  occupancyRate: string, // "68.3%"
  revenueToday: number,
  revenueMTD: number,
  revenueYTD: number,
  pendingActions: number,
  
  // Owner Stats
  totalOwners: number,
  verifiedOwners: number,
  pendingOwners: number,
  newOwnersThisMonth: number,
  
  // Listing Stats
  totalListings: number,
  activeListings: number,
  pendingListings: number,
  featuredListings: number,
  
  // Customer Stats
  totalCustomers: number,
  activeCustomers: number,
  newCustomersThisMonth: number,
  repeatCustomerRate: string, // "34%"
  
  // Review Stats
  averageRating: number, // 4.3
  totalReviews: number,
  pendingReviews: number,
  
  // Financial Stats
  totalRevenue: number,
  commissionEarned: number,
  payoutsDue: number,
  payoutsProcessing: number,
  
  // Alerts
  alerts: [
    {
      type: 'warning' | 'error' | 'info',
      message: string,
      count: number,
      action: string, // URL to navigate
    }
  ],
  
  // Recent Activity
  recentActivity: [
    {
      type: 'booking' | 'payout' | 'review' | 'verification',
      description: string,
      timestamp: string,
      link: string,
    }
  ]
}

Performance Optimization:
├─ Use Promise.all for parallel queries
├─ Add database indexes on frequently queried columns
├─ Cache response for 5 minutes (Redis optional)
├─ Return early on errors with cached data
└─ Paginate recent activity (max 10 items)

Testing:
├─ Unit tests for calculations
├─ Integration tests for API endpoint
├─ Load test with concurrent requests
└─ Verify response time < 500ms
```

**Task 1.2: Update Existing Stats API (if needed)**

```typescript
// File: /src/app/api/admin/hangarshare/stats/route.ts

Enhancements:
├─ Add more detailed metrics
├─ Include trend data (vs last period)
├─ Add caching layer
└─ Optimize queries
```

#### 4.1.2 Frontend Development

**Task 1.3: Redesign Overview Tab Component**

```typescript
// File: /src/app/admin/hangarshare/page.tsx

Implementation Steps:

1. Create state management for overview data
2. Fetch overview stats on component mount
3. Implement auto-refresh (30 seconds)
4. Design responsive layout (Tailwind CSS)
5. Add loading states
6. Add error states
7. Implement hero metrics cards
8. Add financial summary section
9. Add operational grid
10. Add alerts panel
11. Add recent activity feed

State Management:
const [overviewData, setOverviewData] = useState<OverviewStats | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

Data Fetching:
useEffect(() => {
  const fetchOverviewData = async () => {
    try {
      const response = await fetch('/api/admin/hangarshare/overview-stats');
      const data = await response.json();
      setOverviewData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  fetchOverviewData();
  
  // Auto-refresh every 30 seconds
  const interval = setInterval(fetchOverviewData, 30000);
  
  return () => clearInterval(interval);
}, []);

Component Structure:
{activeTab === 'overview' && overviewData && (
  <div className="space-y-6">
    {/* Section 1: Hero Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Reservas Ativas"
        value={overviewData.activeBookings}
        subtitle={`${overviewData.todayCheckIns} check-ins hoje`}
        icon="📅"
        color="blue"
      />
      <MetricCard
        title="Taxa de Ocupação"
        value={overviewData.occupancyRate}
        subtitle="Média últimos 30 dias"
        icon="📊"
        color="green"
        trend={calculateTrend(overviewData.occupancyRate)}
      />
      <MetricCard
        title="Receita Hoje"
        value={formatCurrency(overviewData.revenueToday)}
        subtitle={`MTD: ${formatCurrency(overviewData.revenueMTD)}`}
        icon="💰"
        color="purple"
      />
      <MetricCard
        title="Ações Pendentes"
        value={overviewData.pendingActions}
        subtitle="Requerem atenção"
        icon="⚠️"
        color="orange"
        alert={overviewData.pendingActions > 5}
      />
    </div>
    
    {/* Section 2: Financial Summary */}
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Resumo Financeiro</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-slate-500 mb-1">Receita Total</div>
          <div className="text-2xl font-black text-green-600">
            {formatCurrency(overviewData.totalRevenue)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-500 mb-1">Comissões Ganhas</div>
          <div className="text-2xl font-black text-blue-600">
            {formatCurrency(overviewData.commissionEarned)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-500 mb-1">Pagamentos Pendentes</div>
          <div className="text-2xl font-black text-orange-600">
            {formatCurrency(overviewData.payoutsDue)}
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="mt-6">
        <RevenueChart data={overviewData.revenueHistory} />
      </div>
    </div>
    
    {/* Section 3: Operational Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <OperationalCard
        title="Hangares"
        stats={[
          { label: 'Total', value: overviewData.totalListings },
          { label: 'Ativos', value: overviewData.activeListings },
          { label: 'Pendentes', value: overviewData.pendingListings },
        ]}
      />
      <OperationalCard
        title="Proprietários"
        stats={[
          { label: 'Total', value: overviewData.totalOwners },
          { label: 'Verificados', value: overviewData.verifiedOwners },
          { label: 'Pendentes', value: overviewData.pendingOwners },
        ]}
      />
      <OperationalCard
        title="Clientes"
        stats={[
          { label: 'Total', value: overviewData.totalCustomers },
          { label: 'Ativos', value: overviewData.activeCustomers },
          { label: 'Taxa Retorno', value: overviewData.repeatCustomerRate },
        ]}
      />
    </div>
    
    {/* Section 4: Alerts & Quick Actions */}
    {overviewData.alerts.length > 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-4">
          Requer Atenção
        </h3>
        <div className="space-y-3">
          {overviewData.alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))}
        </div>
      </div>
    )}
    
    {/* Section 5: Recent Activity Feed */}
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Atividade Recente</h3>
        <span className="text-sm text-slate-500">
          Atualizado {formatTimeAgo(lastUpdated)}
        </span>
      </div>
      <div className="space-y-3">
        {overviewData.recentActivity.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </div>
    </div>
  </div>
)}

Styling Guidelines:
├─ Use consistent spacing (space-y-6 for sections)
├─ Card shadows: shadow-sm for subtle depth
├─ Border radius: rounded-lg for modern look
├─ Colors: Blue (primary), Green (success), Orange (warning), Red (error)
├─ Typography: font-black for numbers, font-semibold for labels
└─ Responsive: Mobile-first, stack on small screens

Loading State:
{loading && (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)}

Error State:
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <p className="text-red-700 mb-4">{error}</p>
    <button onClick={retry} className="btn btn-primary">
      Tentar Novamente
    </button>
  </div>
)}
```

**Task 1.4: Create Reusable UI Components**

```typescript
// File: /src/components/admin/MetricCard.tsx
// Purpose: Reusable metric display card

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  alert?: boolean;
}

export function MetricCard({ ... }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    // ... etc
  };
  
  return (
    <div className={`bg-white border rounded-lg p-6 ${colorClasses[color]}`}>
      {/* Card content */}
    </div>
  );
}
```

```typescript
// File: /src/components/admin/RevenueChart.tsx
// Purpose: Revenue trend visualization

import { Line } from 'react-chartjs-2';

interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Chart configuration
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: 'Receita Diária',
      data: data.map(d => d.revenue),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    }]
  };
  
  return <Line data={chartData} options={...} />;
}
```

#### 4.1.3 Testing & Validation

**Task 1.5: Comprehensive Testing**

```
Test Suite 1: API Endpoint Tests
├─ Test 1: Verify endpoint responds (200 OK)
├─ Test 2: Verify authentication required (401 if not admin)
├─ Test 3: Verify data structure matches interface
├─ Test 4: Test with empty database (no errors)
├─ Test 5: Test with mock data (correct calculations)
├─ Test 6: Test performance (<500ms response time)
└─ Test 7: Test concurrent requests (no race conditions)

Test Suite 2: Frontend Component Tests
├─ Test 1: Component renders without data (loading state)
├─ Test 2: Component renders with data (all sections visible)
├─ Test 3: Component handles API errors gracefully
├─ Test 4: Auto-refresh triggers every 30 seconds
├─ Test 5: Metric cards display correct values
├─ Test 6: Charts render with data
├─ Test 7: Alerts display when present
└─ Test 8: Recent activity list renders

Test Suite 3: Integration Tests
├─ Test 1: Full user flow (login → dashboard → view metrics)
├─ Test 2: Data updates reflect in real-time
├─ Test 3: Navigation between tabs preserves state
└─ Test 4: Mobile responsive layout works correctly

Manual Testing Checklist:
□ Open /admin/hangarshare
□ Verify overview tab loads
□ Check all metrics display correctly
□ Verify numbers match database
□ Test auto-refresh (wait 30s)
□ Click on alerts (verify navigation)
□ Test on mobile device
□ Test with slow network (loading state)
□ Test with no data (empty state)
```

#### 4.1.4 Deployment

**Task 1.6: Deploy Phase 1**

```
Pre-Deployment Checklist:
□ All tests passing
□ Code review completed
□ Database migrations run (if any)
□ Environment variables set
□ API endpoint documented
□ Performance benchmarks met

Deployment Steps:
1. Create feature branch: git checkout -b feature/overview-dashboard
2. Commit changes: git add . && git commit -m "feat: enhanced overview dashboard"
3. Push to GitHub: git push origin feature/overview-dashboard
4. Create pull request
5. Review and merge to main
6. Netlify auto-deploys (or manual deploy)
7. Verify production deployment
8. Monitor logs for errors
9. Test live site
10. Announce to team

Rollback Plan:
If issues found:
1. Revert commit: git revert [commit-hash]
2. Push revert: git push origin main
3. Netlify redeploys automatically
4. Verify rollback successful
5. Fix issues in local environment
6. Redeploy when ready

Post-Deployment:
□ Monitor error logs (24 hours)
□ Check API response times
□ Verify data accuracy
□ Collect user feedback
□ Document any issues
```

---

### 4.2 Phase 2: Financial Dashboard (Week 3-4)

#### 4.2.1 Backend Development

**Task 2.1: Create Financial Stats API**

```typescript
// File: /src/app/api/admin/hangarshare/financial/revenue/route.ts

Implementation:
- Revenue by day/week/month/year
- Revenue by location (top 10 ICAOs)
- Revenue by owner (top 10 earners)
- Revenue trends and forecasting
- Commission breakdown
- Payment method distribution

Expected Response:
{
  summary: {
    today: number,
    mtd: number,
    ytd: number,
    lastMonth: number,
    growth: string, // "+15.3%"
  },
  byLocation: [
    { icao: 'SBSP', revenue: number, percentage: string }
  ],
  byOwner: [
    { ownerId: string, companyName: string, revenue: number }
  ],
  trend: [
    { date: string, revenue: number }
  ],
  commission: {
    total: number,
    average: number,
    breakdown: [
      { type: 'booking_fee', amount: number },
      { type: 'featured_listing', amount: number },
    ]
  }
}
```

**Task 2.2: Create Payout Management API**

```typescript
// File: /src/app/api/admin/hangarshare/financial/payouts/route.ts

Endpoints:
- GET: List payouts (pending/processing/completed)
- POST: Process payout batch
- GET /[id]: Get specific payout details

Implementation:
- Query hangar_booking_payments for payout_status
- Calculate totals by owner
- Integrate with Stripe Connect (if available)
- Handle payout scheduling
- Track payout history
```

#### 4.2.2 Frontend Development

**Task 2.3: Create Financial Tab Component**

```typescript
// File: /src/app/admin/hangarshare/page.tsx

Add new tab:
{activeTab === 'financial' && (
  <div className="space-y-6">
    {/* Revenue Dashboard */}
    <RevenueDashboard data={financialData.revenue} />
    
    {/* Payout Queue */}
    <PayoutQueue payouts={financialData.payouts} />
    
    {/* Commission Analytics */}
    <CommissionAnalytics data={financialData.commission} />
    
    {/* Financial Reports */}
    <FinancialReports />
  </div>
)}

Features:
- Revenue charts (Line, Bar, Pie)
- Payout queue management
- Export functionality (CSV/PDF)
- Filter by date range
- Search by owner
```

#### 4.2.3 Testing & Deployment

```
Test Cases:
- Revenue calculations accurate
- Payout queue displays correctly
- Export generates valid files
- Filters work correctly
- Charts render properly

Deploy:
- Same process as Phase 1
- Monitor financial data accuracy
- Verify payout calculations
```

---

### 4.3 Phase 3: Analytics Dashboard (Week 5-6)

#### 4.3.1 Backend APIs

**Task 3.1: Occupancy Analytics API**

```typescript
// File: /src/app/api/admin/hangarshare/analytics/occupancy/route.ts

Metrics:
- Current occupancy rate
- Historical trends (30/60/90/365 days)
- Occupancy by location
- Occupancy by hangar type
- Seasonal patterns
- Forecasting (next 30 days)
```

**Task 3.2: Customer Analytics API**

```typescript
// File: /src/app/api/admin/hangarshare/analytics/customers/route.ts

Metrics:
- Total/active/new customers
- Customer lifetime value (CLV)
- Repeat booking rate
- Churn rate
- Acquisition channels
- Customer segments
```

**Task 3.3: Performance Metrics API**

```typescript
// File: /src/app/api/admin/hangarshare/analytics/performance/route.ts

Metrics:
- Booking conversion rate
- Average booking value
- Lead time analysis
- Cancellation rate
- No-show rate
- Review completion rate
```

#### 4.3.2 Frontend Development

**Task 3.4: Create Analytics Tab**

```typescript
Features:
- Interactive charts (Chart.js or Recharts)
- Date range selectors
- Metric comparisons (vs last period)
- Drill-down capabilities
- Export reports
```

---

### 4.4 Phase 4: Quality & Reviews (Week 7-8)

#### 4.4.1 Review Management System

**Task 4.1: Review Moderation API**

```typescript
// File: /src/app/api/admin/hangarshare/quality/reviews/route.ts

Features:
- List all reviews with filters
- Moderate flagged reviews
- Response tracking
- Quality scoring
```

**Task 4.2: Dispute Resolution System**

```typescript
// File: /src/app/api/admin/hangarshare/quality/disputes/route.ts

Features:
- Create dispute record
- Track resolution process
- Mediation workflow
- Outcome recording
```

#### 4.4.2 Frontend Development

**Task 4.3: Create Quality Tab**

```typescript
Features:
- Review list with filters
- Moderation interface
- Dispute management
- Quality reports
```

---

### 4.5 Phase 5: Promotions & Featured Listings (Week 9-10)

#### 4.5.1 Featured Listing System

**Task 5.1: Featured Listing API**

```typescript
// File: /src/app/api/admin/hangarshare/promotions/featured/route.ts

Features:
- Add/remove featured status
- Feature pricing tiers
- Performance tracking
- ROI calculation
```

**Task 5.2: Promotion Engine**

```typescript
// File: /src/app/api/admin/hangarshare/promotions/campaigns/route.ts

Features:
- Create promotion campaigns
- Discount code management
- Campaign performance tracking
- A/B testing support
```

#### 4.5.2 Frontend Development

**Task 5.3: Create Promotions Tab**

```typescript
Features:
- Featured listing management
- Campaign creation wizard
- Performance dashboard
- Revenue attribution
```

---

## 5. Area-by-Area Breakdown

### 5.1 Overview Area

**Purpose:** Central command center for daily operations

**Key Features:**
- Real-time metrics display
- Alert system for urgent items
- Quick navigation to action pages
- Activity feed

**Data Sources:**
- All HangarShare tables
- Aggregated statistics
- Recent activity logs

**Update Frequency:** Every 30 seconds (auto-refresh)

**User Actions:**
- View metrics
- Click alerts to navigate
- Monitor activity
- Refresh manually

---

### 5.2 Verification Area

**Purpose:** Owner application review and approval

**Key Features:**
- Pending applications list
- Document viewer
- Compliance checklist
- Approve/reject actions

**Data Sources:**
- hangar_owners table
- Document storage (S3/local)
- User information

**Workflow:**
1. Review application
2. Verify documents
3. Check compliance
4. Approve or reject
5. Send notification

**User Actions:**
- Review applications
- View documents
- Approve owners
- Reject with reason
- Resend verification requests

---

### 5.3 Owner Management Area

**Purpose:** Manage all registered owners and their performance

**Key Features:**
- Complete owner list
- Owner profile details
- Performance analytics
- Account management

**Data Sources:**
- hangar_owners table
- hangar_listings table
- bookings table
- hangar_booking_payments table

**User Actions:**
- View owner profiles
- Edit owner information
- Suspend accounts
- Track performance
- Manage payouts

---

### 5.4 Listing Management Area

**Purpose:** Oversee all hangar listings and their status

**Key Features:**
- Listing grid/table view
- Advanced filters
- Listing detail view
- Bulk actions

**Data Sources:**
- hangar_listings table
- hangar_photos table
- hangar_amenities table
- bookings table

**User Actions:**
- Approve/reject listings
- Feature listings
- Pause/unpause
- Edit details
- Archive listings

---

### 5.5 Booking Management Area

**Purpose:** Monitor and manage all reservations

**Key Features:**
- Booking list/calendar view
- Status tracking
- Payment monitoring
- Dispute resolution

**Data Sources:**
- bookings table
- hangar_booking_payments table
- users table
- hangar_listings table

**User Actions:**
- View bookings
- Modify reservations
- Cancel bookings
- Process refunds
- Resolve disputes

---

### 5.6 Financial Area

**Purpose:** Track revenue, commissions, and payouts

**Key Features:**
- Revenue dashboard
- Commission tracking
- Payout management
- Financial reports

**Data Sources:**
- hangar_booking_payments table
- bookings table
- hangar_owners table

**User Actions:**
- View revenue
- Track commissions
- Process payouts
- Generate reports
- Export data

---

### 5.7 Analytics Area

**Purpose:** Business intelligence and insights

**Key Features:**
- Occupancy analytics
- Customer analytics
- Performance metrics
- Market intelligence

**Data Sources:**
- All tables (aggregated)
- Historical data
- Trend calculations

**User Actions:**
- View analytics
- Compare periods
- Generate insights
- Export reports

---

### 5.8 Quality Area

**Purpose:** Maintain platform quality through reviews and ratings

**Key Features:**
- Review management
- Quality monitoring
- Dispute resolution
- Quality reports

**Data Sources:**
- hangar_reviews table
- bookings table
- Dispute records

**User Actions:**
- Moderate reviews
- Track quality
- Resolve disputes
- Generate reports

---

### 5.9 Promotions Area

**Purpose:** Manage featured listings and marketing campaigns

**Key Features:**
- Featured listings
- Campaign management
- Performance tracking
- ROI analysis

**Data Sources:**
- Featured listing records
- Campaign data
- Revenue attribution

**User Actions:**
- Feature listings
- Create campaigns
- Track performance
- Measure ROI

---

### 5.10 Settings Area

**Purpose:** Configure platform settings and integrations

**Key Features:**
- Platform configuration
- Notification settings
- Integration management
- Admin user management

**Data Sources:**
- Configuration tables
- Admin user records
- Integration credentials

**User Actions:**
- Update settings
- Configure notifications
- Manage integrations
- Manage admin access

---

## 6. Integration Points

### 6.1 Database Integration

```
PostgreSQL (Neon)
├─ Connection Pool (pg)
├─ Query Optimization
├─ Index Management
└─ Transaction Handling

Integration:
- Use existing connection pool from /src/config/db.ts
- Implement prepared statements for security
- Use transactions for multi-step operations
- Add indexes for frequently queried columns
```

### 6.2 Payment Integration

```
Stripe
├─ Payment Processing
├─ Payout Management (Connect)
├─ Webhook Handling
└─ Refund Processing

Integration:
- Use existing Stripe configuration
- Implement webhook endpoint for events
- Handle payment intents
- Process payouts via Connect
```

### 6.3 Email Integration

```
Resend
├─ Transactional Emails
├─ Notification Emails
├─ Template Management
└─ Delivery Tracking

Integration:
- Use existing Resend configuration
- Create email templates
- Send notifications on events
- Track delivery status
```

### 6.4 Storage Integration

```
File Storage (S3 or Local)
├─ Document Storage
├─ Photo Storage
├─ Report Storage
└─ Export Files

Integration:
- Configure storage provider
- Implement upload/download
- Manage access permissions
- Clean up old files
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```javascript
// Test individual functions
describe('Overview Stats Calculations', () => {
  test('calculates occupancy rate correctly', () => {
    const result = calculateOccupancy(68, 100);
    expect(result).toBe('68.0%');
  });
  
  test('formats currency correctly', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('R$ 1.234,56');
  });
});
```

### 7.2 Integration Tests

```javascript
// Test API endpoints
describe('Overview Stats API', () => {
  test('returns 200 for authenticated admin', async () => {
    const response = await fetch('/api/admin/hangarshare/overview-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(response.status).toBe(200);
  });
  
  test('returns correct data structure', async () => {
    const response = await fetch('/api/admin/hangarshare/overview-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await response.json();
    expect(data).toHaveProperty('activeBookings');
    expect(data).toHaveProperty('occupancyRate');
  });
});
```

### 7.3 End-to-End Tests

```javascript
// Test full user flows
describe('Admin Dashboard Flow', () => {
  test('admin can view overview dashboard', async () => {
    await loginAsAdmin();
    await navigateTo('/admin/hangarshare');
    await waitFor('.overview-tab');
    expect(page).toContainText('Reservas Ativas');
  });
  
  test('admin can approve owner verification', async () => {
    await loginAsAdmin();
    await navigateTo('/admin/hangarshare?tab=users');
    await click('button:has-text("Verificar")');
    await click('button:has-text("Aprovar")');
    await waitFor('text=Proprietário aprovado');
  });
});
```

### 7.4 Performance Tests

```javascript
// Test response times and load
describe('Performance Tests', () => {
  test('overview stats API responds in < 500ms', async () => {
    const start = Date.now();
    await fetch('/api/admin/hangarshare/overview-stats');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
  
  test('handles 100 concurrent requests', async () => {
    const requests = Array(100).fill().map(() =>
      fetch('/api/admin/hangarshare/overview-stats')
    );
    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.ok).length;
    expect(successCount).toBe(100);
  });
});
```

---

## 8. Deployment Roadmap

### 8.1 Development Timeline

```
Week 1-2: Phase 1 - Enhanced Overview Dashboard
├─ Day 1-2: Backend API development
├─ Day 3-5: Frontend component development
├─ Day 6-7: Testing and refinement
└─ Day 8-10: Deployment and monitoring

Week 3-4: Phase 2 - Financial Dashboard
├─ Day 1-2: Financial APIs
├─ Day 3-5: Frontend development
├─ Day 6-7: Testing
└─ Day 8-10: Deployment

Week 5-6: Phase 3 - Analytics Dashboard
├─ Day 1-3: Analytics APIs
├─ Day 4-7: Frontend with charts
├─ Day 8-9: Testing
└─ Day 10: Deployment

Week 7-8: Phase 4 - Quality & Reviews
├─ Day 1-2: Review management APIs
├─ Day 3-5: Frontend development
├─ Day 6-7: Testing
└─ Day 8-10: Deployment

Week 9-10: Phase 5 - Promotions
├─ Day 1-2: Promotion APIs
├─ Day 3-5: Frontend development
├─ Day 6-7: Testing
└─ Day 8-10: Final deployment

Week 11: Final Testing & Polish
├─ End-to-end testing
├─ Performance optimization
├─ Documentation
└─ Training materials
```

### 8.2 Deployment Process

```
For Each Phase:

1. Development
   ├─ Create feature branch
   ├─ Implement features
   ├─ Write tests
   └─ Code review

2. Testing
   ├─ Run unit tests
   ├─ Run integration tests
   ├─ Manual QA testing
   └─ Performance testing

3. Staging Deployment
   ├─ Deploy to staging environment
   ├─ Smoke tests
   ├─ User acceptance testing
   └─ Fix bugs

4. Production Deployment
   ├─ Merge to main branch
   ├─ Netlify auto-deploy
   ├─ Verify deployment
   └─ Monitor for issues

5. Post-Deployment
   ├─ Monitor logs (24 hours)
   ├─ Check metrics
   ├─ Collect feedback
   └─ Document learnings
```

### 8.3 Monitoring & Maintenance

```
Daily:
├─ Check error logs
├─ Monitor API response times
├─ Verify data accuracy
└─ Review user feedback

Weekly:
├─ Performance review
├─ Database optimization
├─ Security updates
└─ Feature usage analysis

Monthly:
├─ Comprehensive audit
├─ User satisfaction survey
├─ Feature roadmap review
└─ Technical debt reduction
```

---

## 9. Success Metrics

### 9.1 Technical Metrics

```
Performance:
├─ API response time < 500ms (p95)
├─ Page load time < 2s
├─ Zero critical errors
└─ 99.5%+ uptime

Code Quality:
├─ Test coverage > 80%
├─ No security vulnerabilities
├─ Code review approval
└─ Documentation complete
```

### 9.2 Business Metrics

```
Adoption:
├─ Admin usage daily
├─ Time spent on dashboard
├─ Features used regularly
└─ User satisfaction score

Efficiency:
├─ Verification time reduced
├─ Faster payout processing
├─ Improved decision-making
└─ Reduced support tickets
```

---

## 10. Next Steps

### 10.1 Immediate Actions (This Week)

```
1. Review and approve this implementation plan
2. Set up project management (Trello/Jira/GitHub Projects)
3. Create task breakdown in project management tool
4. Assign Phase 1 tasks to developer
5. Schedule daily standups
```

### 10.2 Phase 1 Kickoff

```
1. Create feature branch: feature/overview-dashboard
2. Set up development environment
3. Create API endpoint file
4. Implement database queries
5. Build frontend components
6. Write tests
7. Deploy to staging
8. Test and iterate
9. Deploy to production
10. Monitor and refine
```

---

## Conclusion

This organogram and implementation plan provides a comprehensive roadmap for building a world-class HangarShare management system. The system is designed to:

1. **Provide Complete Visibility** - Admins can see all critical metrics at a glance
2. **Enable Quick Actions** - Alert-driven workflow prioritizes urgent tasks
3. **Support Data-Driven Decisions** - Rich analytics inform strategy
4. **Ensure Quality** - Review and rating management maintains standards
5. **Maximize Revenue** - Financial tracking and promotion tools drive growth

**Total Implementation Time:** 10-11 weeks  
**Total Estimated Effort:** 400-450 hours  
**Team Size Recommended:** 2-3 developers + 1 QA + 1 designer  

**Ready to begin Phase 1 implementation.** ✅

---

**Document Version:** 1.0  
**Last Updated:** January 20, 2026  
**Next Review:** Weekly during implementation  
**Status:** ✅ Ready for Execution
