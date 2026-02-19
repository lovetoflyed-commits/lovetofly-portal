# Membership Plan System - Implementation Analysis & Pricing Report
**Date:** February 18, 2026  
**Status:** Detailed Analysis & Recommendations

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current System State](#current-system-state)
3. [Implementation Architecture](#implementation-architecture)
4. [Database Schema](#database-schema)
5. [Pricing Strategy & Analysis](#pricing-strategy--analysis)
6. [Technical Implementation Steps](#technical-implementation-steps)
7. [Payment Processing](#payment-processing)
8. [User Experience Flow](#user-experience-flow)

---

## Executive Summary

The Love to Fly Portal will implement a **4-tier membership system** (Free, Standard, Premium, Pro) with:
- **One-time selection during registration**
- **Upgrade capability in user profile**
- **Monthly and annual billing options** (with annual discount)
- **Stripe-based payment processing**
- **Feature-gated access** based on membership level

This system will generate **recurring revenue** while maintaining a **free tier** to encourage user acquisition.

---

## Current System State

### Existing Infrastructure
- ✅ User authentication system with roles (master, admin, staff, user, tester)
- ✅ Stripe integration (API keys configured)
- ✅ PostgreSQL database with users table
- ✅ JWT-based authorization
- ✅ Admin dashboard with code generation system
- ✅ Promotional codes system (can grant memberships)

### What Needs to Be Added
- ❌ Membership plan selection during registration
- ❌ Membership level storage in user profile
- ❌ Upgrade mechanism in user dashboard
- ❌ Stripe webhook handling for subscription events
- ❌ Subscription management (pause, cancel, resubscribe)
- ❌ Invoice/billing history
- ❌ Feature flag validation per membership tier

---

## Implementation Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Love to Fly Portal                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  User Registration│ ───────▶│  Membership Plan │          │
│  │  & Profile       │         │  Selection       │          │
│  └──────────────────┘         └──────────────────┘          │
│                                        │                     │
│                                        ▼                     │
│                            ┌──────────────────────┐          │
│                            │  Create Stripe       │          │
│                            │  Customer & Product  │          │
│                            └──────────────────────┘          │
│                                        │                     │
│          ┌─────────────────────────────┼──────────┐         │
│          │                             │          │         │
│          ▼                             ▼          ▼         │
│  ┌────────────────┐          ┌─────────────┐  ┌────────┐  │
│  │ Free Plan      │          │ Paid Plan   │  │ Annual │  │
│  │ (No Charge)    │          │ (Monthly)   │  │ Plan   │  │
│  └────────────────┘          └─────────────┘  └────────┘  │
│                                        │          │         │
│                                        └─────┬────┘         │
│                                              │              │
│                    ┌─────────────────────────▼──┐           │
│                    │   Stripe Subscription       │           │
│                    │   Management                │           │
│                    ├────────────────────────────┤           │
│                    │ • Create subscription       │           │
│                    │ • Handle webhooks           │           │
│                    │ • Track billing events      │           │
│                    │ • Issue invoices            │           │
│                    └────────────────────────────┘           │
│                                        │                    │
│                    ┌───────────────────▼───┐                │
│                    │  User Dashboard        │                │
│                    │  Upgrade/Downgrade     │                │
│                    │  Cancel/Pause          │                │
│                    │  View Invoices         │                │
│                    └────────────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables Required

#### 1. `membership_plans` (Reference Table)
```sql
CREATE TABLE membership_plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,  -- 'free', 'standard', 'premium', 'pro'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2),      -- NULL for free
    annual_price DECIMAL(10, 2),       -- NULL for free
    annual_discount_percent INT,       -- e.g., 20 for 20% off
    stripe_product_id VARCHAR(255),    -- Stripe product ID
    stripe_monthly_price_id VARCHAR(255),
    stripe_annual_price_id VARCHAR(255),
    features JSONB,                    -- Feature flags for this plan
    max_users_allowed INT,             -- Usage limits
    max_projects INT,
    max_storage_gb INT,
    priority_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 2. `user_memberships` (User Subscription)
```sql
CREATE TABLE user_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    billing_cycle VARCHAR(10),         -- 'monthly' or 'annual'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    next_billing_date TIMESTAMP,
    status VARCHAR(50),                -- 'active', 'past_due', 'canceled', 'paused'
    canceled_at TIMESTAMP,
    reason_for_cancellation TEXT,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, stripe_subscription_id)
);
```

#### 3. `billing_invoices` (Invoice History)
```sql
CREATE TABLE billing_invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_paid DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period_start TIMESTAMP,
    billing_period_end TIMESTAMP,
    status VARCHAR(50),                -- 'draft', 'open', 'paid', 'void'
    invoice_url TEXT,
    pdf_url TEXT,
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);
```

#### 4. `membership_plan_features` (Feature Mapping)
```sql
CREATE TABLE membership_plan_features (
    id SERIAL PRIMARY KEY,
    membership_plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
    feature_code VARCHAR(100) NOT NULL,  -- 'hangarshare', 'marketplace', etc
    feature_name VARCHAR(200),
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE(membership_plan_id, feature_code)
);
```

#### 5. `user_membership_history` (Audit Log)
```sql
CREATE TABLE user_membership_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50),                -- 'upgraded', 'downgraded', 'canceled', 'reactivated'
    from_plan_id INTEGER REFERENCES membership_plans(id),
    to_plan_id INTEGER REFERENCES membership_plans(id),
    billing_cycle VARCHAR(10),
    amount DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Migrate Existing `users` Table
```sql
ALTER TABLE users ADD COLUMN membership_plan_id INTEGER REFERENCES membership_plans(id);
ALTER TABLE users ADD COLUMN selected_plan_at TIMESTAMP;
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_users_membership_plan ON users(membership_plan_id);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

---

## Pricing Strategy & Analysis

### Market Analysis
The aviation market spans:
- **Casual pilots** (hobbyists): Price-sensitive, need basic tools
- **Flight schools**: Medium budget, need features for students
- **Professional pilots**: High value, need premium features
- **Aviation businesses**: Enterprise, need compliance & analytics

### Recommended 4-Tier Pricing Structure

#### Tier 1: **FREE** (Freemium Model)
**Target:** Hobbyists, casual users, flight students
- **Monthly:** $0
- **Annual:** $0
- **Stripe Setup:** No subscription (direct access)
- **Conversion Goal:** 10-15% conversion to paid plans

**Included Features:**
- Basic flight logging (10 flights/month)
- Weather overview
- Basic E6B calculator
- Community forum access
- Mobile app basic version
- Email support (48-72h response)
- Public flight planning
- Mentorship browsing

**Limitations:**
- 1 aircraft maximum
- Basic weather alerts
- No advanced analytics
- No dark mode

---

#### Tier 2: **STANDARD** (Most Popular - Target 50% of paid users)
**Target:** Active private pilots, flight schools
- **Monthly:** $9.99 / month
- **Annual:** $99.99 / year (20% discount, effective: $8.33/month)
- **Stripe:** Monthly & Annual prices

**Additional Features Beyond Free:**
- ✅ Unlimited flight logging
- ✅ 5 aircraft profiles
- ✅ Advanced weather (METARs, TAFs, winds aloft)
- ✅ Flight time analytics & trends
- ✅ Export flight logs (PDF/CSV)
- ✅ Sync with external logbooks
- ✅ Flight planning with waypoints
- ✅ Standard support (24-48h)
- ✅ Dark mode

**Limitations:**
- Max 3 concurrent flights tracked
- Limited historical data (2 years)
- No API access

---

#### Tier 3: **PREMIUM** (Advanced Users - Target 35% of paid users)
**Target:** Instructors, commercial pilots, flight schools
- **Monthly:** $24.99 / month
- **Annual:** $249.99 / year (17% discount, effective: $20.83/month)
- **Stripe:** Monthly & Annual prices

**All Standard Features Plus:**
- ✅ Unlimited aircraft profiles
- ✅ Student pilot management (up to 10)
- ✅ Advanced flight analytics
- ✅ Custom flight templates
- ✅ Weight & balance calculations
- ✅ Fuel planning & consumption tracking
- ✅ Signature page (logbook validity)
- ✅ Integration with FlightRadar24
- ✅ Advanced weather alerts (personalized)
- ✅ Flight proficiency tracking
- ✅ Currency tracking (recency)
- ✅ Priority email support (2-4h)
- ✅ Unlimited historical data

**Limitations:**
- Max 20 concurrent students
- Limited API (read-only)
- No custom branded portal

---

#### Tier 4: **PRO** (Professional/Enterprise - Target 15% of paid users)
**Target:** Flight schools, operators, aviation businesses
- **Monthly:** $49.99 / month
- **Annual:** $499.99 / year (17% discount, effective: $41.66/month)
- **Stripe:** Monthly & Annual prices

**All Premium Features Plus:**
- ✅ Unlimited student management
- ✅ Team collaboration (5 users)
- ✅ Advanced compliance reporting (FAA 8710-1)
- ✅ Automated scheduling system
- ✅ Integration with billing systems
- ✅ Read-write API access
- ✅ Custom webhooks
- ✅ White-label portal option
- ✅ SSO (SAML/OAuth)
- ✅ GDPR compliance reports
- ✅ Custom integration support
- ✅ Dedicated account manager
- ✅ Priority phone support 24/7

**Unlimited:**
- Concurrent flights, aircraft, students
- Historical data
- API calls (up to 10k/day)

---

### Pricing Summary Table

| Feature | Free | Standard | Premium | Pro |
|---------|------|----------|---------|-----|
| **Monthly Price** | $0 | $9.99 | $24.99 | $49.99 |
| **Annual Price** | $0 | $99.99 | $249.99 | $499.99 |
| **Annual Savings** | - | $20% ($19.89) | $17% ($50.01) | $17% ($100.01) |
| **Effective Annual Cost/Month** | - | $8.33 | $20.83 | $41.66 |
| **Flight Logs/Month** | 10 | Unlimited | Unlimited | Unlimited |
| **Aircraft Profiles** | 1 | 5 | Unlimited | Unlimited |
| **Students Managed** | - | - | 10 | Unlimited |
| **Support** | Email (72h) | Email (24-48h) | Email (2-4h) | Phone 24/7 |
| **API Access** | ✗ | ✗ | Read-only | Read/Write |

---

### Revenue & Conversion Projections

Assuming **10,000 registered users** with **15% conversion to paid plans**:

#### Year 1 Scenario
```
Total Users: 10,000
Free Users: 8,500 (85%)
Paid Users: 1,500 (15%)

Paid Plan Distribution:
- Standard (50%): 750 users
- Premium (35%): 525 users  
- Pro (15%): 225 users

Annual Revenue Calculations:

STANDARD TIER (750 users)
Monthly subscribers (60%): 450 × $9.99 × 12 = $53,946
Annual subscribers (40%): 300 × $99.99 = $29,997
Subtotal: $83,943

PREMIUM TIER (525 users)
Monthly subscribers (50%): 262 × $24.99 × 12 = $78,348
Annual subscribers (50%): 262 × $249.99 = $65,497
Subtotal: $143,845

PRO TIER (225 users)
Monthly subscribers (40%): 90 × $49.99 × 12 = $53,988
Annual subscribers (60%): 135 × $499.99 = $67,498
Subtotal: $121,486

TOTAL YEAR 1 REVENUE: $349,274
Monthly Average Revenue: $29,106
```

#### Projected Growth (Year 2-3)
- **Year 2:** Assume 20% paid conversion = $698,548 revenue
- **Year 3:** Assume 25% paid conversion = $873,185 revenue

---

### Monthly Recurring Revenue (MRR) Model

**Month 12 MRR (End of Year 1):** ~$29,106/month consistently

This assumes:
- 80% retention rate (20% churn monthly = typical for SaaS)
- 10% new user acquisition growth
- Plan distribution remains stable

---

## Technical Implementation Steps

### Phase 1: Database & Stripe Setup (Week 1)
1. Create migration files for new tables
2. Set up Stripe products and prices in Stripe Dashboard
3. Store Stripe IDs in database
4. Create indexes for performance

### Phase 2: Registration Flow (Week 2)
1. Add membership plan selection screen after email/password
2. Show plan comparison modal
3. If paid plan selected: Redirect to Stripe Checkout
4. Create user_memberships record on success
5. Send confirmation email with plan details

### Phase 3: API Endpoints (Week 3)
```
POST   /api/memberships/plans              (list all plans)
GET    /api/user/membership                (current membership)
POST   /api/user/membership/upgrade        (upgrade plan)
POST   /api/user/membership/downgrade      (downgrade plan)
POST   /api/user/membership/cancel         (cancel subscription)
GET    /api/user/invoices                  (billing history)
POST   /api/webhooks/stripe                (webhook handler)
```

### Phase 4: User Profile/Dashboard (Week 4)
1. Add membership display in profile
2. Create upgrade/downgrade UI
3. Display billing history
4. Show next billing date
5. Add cancel option with feedback form

### Phase 5: Stripe Webhook Handling (Week 2-3)
Events to track:
- `customer.subscription.created` → Set active status
- `customer.subscription.updated` → Update billing info
- `invoice.payment_succeeded` → Create invoice record
- `invoice.payment_failed` → Alert user, set past_due
- `customer.subscription.deleted` → Set canceled status

---

## Payment Processing

### Stripe Integration Points

#### 1. Checkout Flow
```javascript
// Create Stripe Checkout Session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [
    {
      price: plan.stripe_price_id,  // Monthly or Annual
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: 'https://lovetofly.com/dashboard?success=true',
  cancel_url: 'https://lovetofly.com/register?cancelled=true',
  payment_method_types: ['card'],
  subscription_data: {
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
    },
  },
});
```

#### 2. Webhook Handler
```javascript
// Handle Stripe events
const handleStripeEvent = async (event) => {
  switch (event.type) {
    case 'customer.subscription.created':
      // Create user_memberships record
      
    case 'invoice.payment_succeeded':
      // Create billing_invoices record
      // Update subscription status
      
    case 'invoice.payment_failed':
      // Send payment failed email
      // Update user membership status to past_due
      
    case 'customer.subscription.deleted':
      // Update membership status to canceled
  }
};
```

#### 3. Upgrade Endpoint
```javascript
// Allow in-app plan upgrades
POST /api/user/membership/upgrade
{
  "new_plan_id": 3,  // Premium
  "billing_cycle": "annual"  // or "monthly"
}

// Stripe will:
// 1. Calculate pro-rated amount
// 2. Create new subscription
// 3. Cancel old subscription
// 4. Issue credit/charge difference
```

---

## User Experience Flow

### Registration Flow
```
┌─────────────────────────────────┐
│  1. Email & Password Entry      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  2. Personal/Business Info      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  3. Select Membership Plan      │
│  ┌─────────┬──────────┬────────┐│
│  │ Free    │ Standard │Premium ││ Pro
│  │ (Skip)  │ $9.99/mo │$24.99  ││ $49.99
│  └─────────┴──────────┴────────┘│
│                                  │
│  Monthly   vs   Annual (-20%)    │
└──────────────┬──────────────────┘
               │
          ┌────┴─────┐
          │           │
    If Free:    If Paid:
          │           │
          ▼           ▼
    Complete    Stripe Checkout
    Auth        ├─ Card Entry
               ├─ Billing Address
               └─ Confirmation
               │
               ▼
          Create Subscription
          Send Welcome Email
          │
          ▼
    Dashboard (Feature gated by plan)
```

### Profile/Upgrade Flow
```
┌──────────────────────────┐
│   User Dashboard         │
├──────────────────────────┤
│ Current Plan: Standard   │
│ Billing: Monthly         │
│ Next Billing: Mar 18     │
│                          │
│ [Upgrade] [Downgrade]    │
│ [Cancel]  [View Invoices]│
└──────────────┬───────────┘
               │
         Upgrade selected
               │
               ▼
┌──────────────────────────┐
│ Select New Plan          │
│ ┌──────────────────────┐ │
│ │ Premium (upgrade to) │ │
│ │ $24.99/month         │ │
│ │ -or-                 │ │
│ │ $249.99/annual       │ │
│ └──────────────────────┘ │
│                          │
│ [Choose Monthly/Annual]  │
└──────────────┬───────────┘
               │
               ▼
    Stripe Processes:
    • Pro-rated charges
    • Subscription update
    • Invoice generation
               │
               ▼
    Confirmation & Receipt
```

---

## Feature Flagging System

### Implementation Strategy
Each feature is controlled by plan membership:

```sql
-- Example: Hangarshare feature
INSERT INTO membership_plan_features 
  (membership_plan_id, feature_code, feature_name, enabled)
VALUES
  (1, 'hangarshare', 'HangarShare', TRUE),    -- Free (limited)
  (2, 'hangarshare', 'HangarShare', TRUE),    -- Standard
  (3, 'hangarshare', 'HangarShare', TRUE),    -- Premium
  (4, 'hangarshare', 'HangarShare', TRUE),    -- Pro
  
  (1, 'advanced_analytics', 'Advanced Analytics', FALSE), -- Free
  (2, 'advanced_analytics', 'Advanced Analytics', FALSE), -- Standard
  (3, 'advanced_analytics', 'Advanced Analytics', TRUE),  -- Premium
  (4, 'advanced_analytics', 'Advanced Analytics', TRUE);  -- Pro
```

### Usage in Components
```typescript
// Check if user has access to feature
const hasFeature = (userId: number, featureCode: string): boolean => {
  const user = await getUser(userId);
  const membership = await getUserMembership(userId);
  
  const feature = await checkFeatureAccess(
    membership.plan_id,
    featureCode
  );
  
  return feature.enabled && membership.status === 'active';
};

// In React Component
{hasFeature(userId, 'advanced_analytics') ? (
  <AnalyticsDashboard />
) : (
  <UpgradeBanner feature="advanced_analytics" />
)}
```

---

## Risk Mitigation & Considerations

### 1. **Churn Management**
- **Strategy:** Send 7-day cancellation warning emails
- **Action:** Offer discount/incentive codes before cancellation
- **Metric:** Target <20% monthly churn

### 2. **Fraud Prevention**
- **Stripe handling:** PCI DSS compliance built-in
- **Verification:** Email confirmation for subscription changes
- **Limits:** Rate limit subscription change API

### 3. **Payment Failures**
- **Retry Logic:** Stripe auto-retries 3 times over 4 days
- **User Alert:** Email + dashboard warning after 2 failures
- **Grace Period:** 7-day grace before feature restriction

### 4. **Transition for Existing Users**
- **Action:** Assign all current users to "Free" plan initially
- **Offer:** 30-day trial for paid plans (via promotion codes)
- **Communication:** Email campaign explaining new benefits

### 5. **Compliance**
- **Tax:** Implement sales tax for applicable regions
- **Terms:** Update ToS with billing/subscription terms
- **GDPR:** Right to data export, account deletion
- **Refunds:** 30-day money-back guarantee for annual plans

---

## Recommended Implementation Timeline

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| DB & Stripe Setup | 1 week | P0 | None |
| Registration Flow | 1 week | P0 | DB Setup |
| API Endpoints | 1 week | P0 | DB Setup |
| Dashboard/Profile UI | 1 week | P1 | API Endpoints |
| Webhooks & Automation | 1 week | P1 | API Endpoints |
| Testing & QA | 1 week | P1 | All above |
| **Total** | **6 weeks** | - | - |

---

## Success Metrics

### Business KPIs
1. **Conversion Rate:** Free → Paid (Target: 15-20%)
2. **Monthly Recurring Revenue:** (Target: $50k+ by Month 12)
3. **Customer Lifetime Value:** (Target: $300+ per paid user)
4. **Churn Rate:** (Target: <20% monthly)
5. **Plan Distribution:** Standard 50%, Premium 35%, Pro 15%

### Technical KPIs
1. **Webhook Success Rate:** >99.5%
2. **Checkout Completion Rate:** >80%
3. **Upgrade Time:** <30 seconds from click to confirmation
4. **API Latency:** <200ms for membership checks
5. **Downtime:** <0.1% during business hours

---

## Next Steps

### Immediate Actions
1. **Week 1:** Review and approve pricing structure
2. **Week 2:** Set up Stripe products and communicate to dev team
3. **Week 3:** Begin database migration implementation
4. **Week 4:** Start building registration flow

### Stakeholder Review
- [ ] Finance team approval on pricing
- [ ] Legal review of ToS updates
- [ ] Marketing plan for tier communication
- [ ] Customer support training on plan management

---

## Questions for Clarification

1. Should we offer a free trial period for paid plans during launch?
2. Do we want different pricing for different regions (USD/EUR/BRL)?
3. Should Pro tier include phone support or dedicated account manager?
4. Any educational or non-profit pricing considerations?
5. Should annual subscribers get additional perks (badges, recognition)?

---

**Document End**  
Last Updated: February 18, 2026  
Status: Ready for Stakeholder Review
