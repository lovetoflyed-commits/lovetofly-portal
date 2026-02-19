# Membership System - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (React Components)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Registration │  │ Profile Page │  │ Plan Selector   │  │
│  │ Form         │  │ (Membership)  │  │ Modal           │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
     ┌─────────────────────────────────────────────────┐
     │         Next.js API Routes (/api/...)           │
     │  ┌────────────────────────────────────────────┐ │
     │  │ GET  /memberships/plans                    │ │
     │  ├────────────────────────────────────────────┤ │
     │  │ GET  /user/membership                      │ │
     │  ├────────────────────────────────────────────┤ │
     │  │ POST /user/membership/upgrade              │ │
     │  ├────────────────────────────────────────────┤ │
     │  │ POST /user/membership/cancel               │ │
     │  ├────────────────────────────────────────────┤ │
     │  │ POST /webhooks/stripe                      │ │
     │  └────────────────────────────────────────────┘ │
     └──────────┬──────────────────┬───────────────────┘
                │                  │
    ┌───────────▼──────┐    ┌──────▼─────────┐
    │  Utility Layer   │    │  Stripe API    │
    │ ┌──────────────┐ │    │ ┌────────────┐ │
    │ │membership    │ │    │ │ Checkout   │ │
    │ │Utils.ts      │ │    │ │ Customers  │ │
    │ │  (11 funcs)  │ │    │ │ Webhooks   │ │
    │ └──────────────┘ │    │ └────────────┘ │
    │ ┌──────────────┐ │    └────────────────┘
    │ │stripeUtils   │ │
    │ │  (9 funcs)   │ │
    │ └──────────────┘ │
    └───────────┬──────┘
                │
       ┌────────▼──────────┐
       │  PostgreSQL DB    │
       │  ┌──────────────┐ │
       │  │ users        │ │
       │  ├──────────────┤ │
       │  │membership_   │ │
       │  │plans         │ │
       │  ├──────────────┤ │
       │  │user_         │ │
       │  │memberships   │ │
       │  ├──────────────┤ │
       │  │billing_      │ │
       │  │invoices      │ │
       │  ├──────────────┤ │
       │  │membership_   │ │
       │  │plan_features │ │
       │  ├──────────────┤ │
       │  │user_         │ │
       │  │membership_   │ │
       │  │history       │ │
       │  └──────────────┘ │
       └───────────────────┘
```

---

## Data Models

### membership_plans (Master Data)
```sql
CREATE TABLE membership_plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,           -- 'free', 'standard', 'premium', 'pro'
    name VARCHAR(100),                 -- Display name
    description TEXT,                  -- Plan benefits summary
    monthly_price DECIMAL(10,2),       -- Price for monthly billing
    annual_price DECIMAL(10,2),        -- Price for annual billing
    annual_discount_percent INT,       -- % discount for annual (e.g., 17)
    features JSONB,                    -- Array of feature strings
    priority_support BOOLEAN,          -- Includes priority email support
    max_users_allowed INT,             -- Team member limit
    max_projects INT,                  -- Project/app limit
    max_storage_gb INT,                -- Storage limit in GB
    stripe_monthly_price_id VARCHAR,   -- Stripe Price ID for monthly
    stripe_annual_price_id VARCHAR,    -- Stripe Price ID for annual
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### user_memberships (Active Subscriptions)
```sql
CREATE TABLE user_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES membership_plans(id),
    stripe_subscription_id VARCHAR,    -- Stripe subscription ID
    start_date TIMESTAMP DEFAULT NOW(),
    renewal_date TIMESTAMP,            -- Next billing date
    billing_cycle VARCHAR(20),         -- 'monthly' or 'annual'
    status VARCHAR(50),                -- 'active', 'cancelled', 'past_due'
    auto_renewal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### billing_invoices (Payment History)
```sql
CREATE TABLE billing_invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    membership_id INTEGER REFERENCES user_memberships(id),
    stripe_invoice_id VARCHAR UNIQUE,
    invoice_date TIMESTAMP,
    amount DECIMAL(10,2),
    currency VARCHAR(3),               -- 'BRL', 'USD'
    status VARCHAR(50),                -- 'paid', 'failed', 'pending'
    created_at TIMESTAMP DEFAULT NOW()
);
```

### membership_plan_features (Access Control)
```sql
CREATE TABLE membership_plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES membership_plans(id),
    feature_code VARCHAR(100),         -- 'advanced_logbook', 'team', etc.
    enabled BOOLEAN DEFAULT true,
    limit_value INT,                   -- NULL if unlimited
    created_at TIMESTAMP DEFAULT NOW()
);
```

### user_membership_history (Audit Trail)
```sql
CREATE TABLE user_membership_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    old_plan_id INTEGER REFERENCES membership_plans(id),
    new_plan_id INTEGER REFERENCES membership_plans(id),
    action VARCHAR(50),                -- 'upgrade', 'downgrade', 'cancel'
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Data Flow Scenarios

### Scenario 1: New User Registration with Paid Plan

```
User fills registration form
    ↓
POST /api/auth/register
    ├─ Create user account (users table)
    ├─ Generate JWT token
    └─ Return token to frontend
    ↓
Frontend: User selects "Premium" with monthly billing
    ↓
POST /api/user/membership/upgrade
    ├─ User logged in (JWT verified)
    ├─ Check /premium plan exists → membership_plans[code='premium']
    ├─ Get stripe_monthly_price_id from plan
    ├─ Call stripeUtils.createCheckoutSession()
    │   ├─ Create Stripe customer (store user_id in metadata)
    │   └─ Create checkout session for price_id
    └─ Return checkoutUrl to frontend
    ↓
Frontend: Redirect to Stripe Checkout
    ↓
User enters card details & confirms payment
    ↓
Stripe: Processes payment & creates subscription
    ├─ Event: customer.subscription.created (or .updated)
    └─ Sends POST to /api/webhooks/stripe with signature
    ↓
POST /api/webhooks/stripe (Webhook Handler)
    ├─ Verify signature (STRIPE_WEBHOOK_SECRET)
    ├─ Extract subscription details
    ├─ Get userId from customer.metadata
    ├─ Call membershipUtils.handleStripeSubscriptionUpdate()
    │   ├─ Update/create user_memberships record
    │   │   ├─ user_id
    │   │   ├─ plan_id (from subscription metadata)
    │   │   ├─ stripe_subscription_id
    │   │   ├─ renewal_date (current_period_end)
    │   │   └─ status='active'
    │   └─ Create user_membership_history record for audit
    ├─ Event: invoice.payment_succeeded
    └─ Call membershipUtils.recordBillingInvoice()
        └─ Create billing_invoices record with amount, status='paid'
    ↓
User is now Premium member!
GET /api/user/membership returns:
    ├─ planCode: 'premium'
    ├─ status: 'active'
    ├─ renewalDate: (next month)
    └─ features: [advanced_logbook, team_management, ...]
```

### Scenario 2: User Upgrades from Free to Premium

```
User on Free plan clicks "Upgrade to Premium"
    ↓
Frontend: Show plan selector
    ├─ GET /api/memberships/plans → Display all tiers
    └─ User selects Premium/monthly
    ↓
POST /api/user/membership/upgrade
    ├─ Check current membership (GET from user_memberships)
    ├─ Get Premium plan details
    ├─ Create Stripe checkout session
    │   ├─ Pass current_subscription_id (null for free users)
    │   └─ Stripe will upgrade existing subscription
    └─ Return checkoutUrl
    ↓
User completes Stripe checkout
    ↓
Stripe: Webhook
    ├─ Event: customer.subscription.updated
    │   └─ Update existing subscription with new price
    └─ Create new billing_invoices record
    ↓
Database:
    ├─ user_memberships UPDATED:
    │   ├─ plan_id = 3 (Premium)
    │   └─ status = 'active'
    ├─ user_membership_history INSERTED:
    │   ├─ old_plan_id = 1 (Free)
    │   ├─ new_plan_id = 3 (Premium)
    │   └─ action = 'upgrade'
    └─ billing_invoices INSERTED (payment record)
```

### Scenario 3: User Cancels Premium Subscription

```
User clicks "Cancel Membership" on profile
    ↓
POST /api/user/membership/cancel
    ├─ Verify user is authenticated (JWT)
    ├─ Get current user_memberships record
    ├─ If status !== 'free':
    │   ├─ Cancel Stripe subscription via API
    │   │   └─ stripeUtils.cancelStripeSubscription(sub_id)
    │   └─ Update user_memberships:
    │       ├─ status = 'cancelled'
    │       ├─ plan_id = 1 (Free)
    │       └─ updated_at = NOW()
    └─ Return success to frontend
    ↓
Stripe: Webhook
    ├─ Event: customer.subscription.deleted
    └─ POST /api/webhooks/stripe
        └─ membershipUtils.handleStripeSubscriptionUpdate(..., 'cancelled')
    ↓
Database:
    ├─ user_memberships status → 'cancelled', plan_id → 1 (Free)
    ├─ user_membership_history INSERTED:
    │   ├─ old_plan_id = 3 (Premium)
    │   ├─ new_plan_id = 1 (Free)
    │   └─ action = 'cancel'
    └─ Next GET /api/user/membership shows Free plan
```

---

## API Request/Response Flow

### Example 1: GET /api/memberships/plans

```
REQUEST:
GET /api/memberships/plans
Content-Type: application/json

PROCESSING:
1. Call membershipUtils.getAllMembershipPlans()
   └─ SELECT * FROM membership_plans WHERE active=true
2. Transform database rows to response format
3. Include all features and pricing

RESPONSE:
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "free",
        "name": "Free",
        "monthlyPrice": 0,
        "annualPrice": 0,
        "features": ["Basic logbook", "Weather", "E6B"],
        ...
      },
      {
        "id": 2,
        "code": "standard",
        "name": "Standard",
        "monthlyPrice": 9.99,
        "annualPrice": 99.99,
        "features": ["Advanced logbook", "Flight planning", ...],
        ...
      }
    ]
  }
}
```

### Example 2: POST /api/user/membership/upgrade

```
REQUEST:
POST /api/user/membership/upgrade
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "planCode": "premium",
  "billingCycle": "monthly"
}

PROCESSING:
1. Verify JWT token → Extract user_id
2. Call getMembershipPlanByCode('premium')
3. Get plan.stripe_monthly_price_id
4. Call createCheckoutSession({
     userId,
     userEmail,
     priceId: plan.stripe_monthly_price_id,
     planCode: 'premium',
     billingCycle: 'monthly'
   })
5. Stripe creates checkout session & returns session.url

RESPONSE:
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
    "action": "redirect_to_checkout"
  }
}

FRONTEND:
window.location.href = checkoutUrl
```

### Example 3: POST /api/webhooks/stripe

```
REQUEST (from Stripe):
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=...,v0=...

{
  "id": "evt_1P5K9vI2i9K8Z5Y0Z",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_1P5K9vI2i9K8Z5Y0Z",
      "customer": "cus_1P5K9vI2i9K8Z5Y0Z",
      "status": "active",
      "current_period_end": 1707325800,
      "items": {
        "data": [{
          "price": {
            "id": "price_premium_monthly",
            "recurring": { "interval": "month" }
          }
        }]
      }
    }
  }
}

PROCESSING:
1. verifyWebhookSignature() → Validate Stripe-Signature
2. Extract event.type = 'customer.subscription.created'
3. Get subscription.customer → Stripe customer ID
4. stripe.customers.retrieve(customerId)
   └─ Get customer.metadata.userId
5. handleStripeSubscriptionUpdate(userId, sub_id, 'active', plan_id, renewal_date, 'monthly')
6. Database UPDATE user_memberships WHERE user_id = ${userId}
7. Database INSERT billing_invoices

RESPONSE:
{
  "received": true
}
```

---

## Function Call Stack

### membershipUtils.ts (Database Layer)

```typescript
// Get operations
getAllMembershipPlans()
  └─ pool.query('SELECT * FROM membership_plans WHERE active=true')

getMembershipPlanByCode(code)
  └─ pool.query('SELECT * FROM membership_plans WHERE code=$1')

getUserMembership(userId)
  └─ pool.query('''
      SELECT m.*, p.code, p.name, p.features
      FROM user_memberships m
      JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.user_id = $1 AND m.status='active'
      LIMIT 1
    ''')

hasFeatureAccess(userId, featureCode)
  └─ pool.query('''
      SELECT COUNT(*) FROM membership_plan_features
      WHERE plan_id = (SELECT plan_id FROM user_memberships WHERE user_id=$1)
      AND feature_code = $2 AND enabled=true
    ''')

// Create operations
createUserMembership(userId, planId, billingCycle, stripeSubId)
  └─ pool.query('''
      INSERT INTO user_memberships
      (user_id, plan_id, stripe_subscription_id, billing_cycle, status, start_date, renewal_date)
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '1 month')
    ''')

// Update operations
updateUserMembership(userId, planId, billingCycle, stripeSubId)
  └─ pool.query('''
      UPDATE user_memberships
      SET plan_id=$2, billing_cycle=$3, stripe_subscription_id=$4
      WHERE user_id=$1
    ''')

cancelUserMembership(userId)
  └─ pool.query('''
      UPDATE user_memberships
      SET status='cancelled', plan_id=1
      WHERE user_id=$1
    ''')

// Recording operations
recordBillingInvoice(userId, invoiceId, amount, currency, status)
  └─ pool.query('''
      INSERT INTO billing_invoices
      (user_id, stripe_invoice_id, amount, currency, status, invoice_date)
      VALUES ($1, $2, $3, $4, $5, NOW())
    ''')
```

### stripeUtils.ts (Stripe API Layer)

```typescript
// Create operations
createStripeProduct(plan)
  └─ stripe.products.create({ name, description, metadata })

createCheckoutSession({ userId, priceId, planCode, billingCycle })
  └─ stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       customer_email: userEmail,
       line_items: [{ price: priceId }],
       mode: 'subscription',
       success_url: ...,
       cancel_url: ...,
       metadata: { userId, planCode, billingCycle }
     })

createStripeCustomer({ email, name })
  └─ stripe.customers.create({ email, name, metadata: { userId } })

// Utility operations
verifyWebhookSignature(body, signature)
  └─ stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)

cancelStripeSubscription(subscriptionId)
  └─ stripe.subscriptions.del(subscriptionId)
```

---

## Error Handling Flow

### Invalid Plan Code
```
POST /api/user/membership/upgrade
  ├─ planCode = 'invalid-plan'
  ├─ getMembershipPlanByCode('invalid-plan')
  │   └─ Returns null
  ├─ Detect: !newPlan
  └─ Return: { error: 'Plan not found', status: 404 }
```

### Missing Authentication
```
GET /api/user/membership
  ├─ No Authorization header
  ├─ verifyTokenAndGetUser(request)
  │   └─ Throws or returns null
  ├─ Detect: !user
  └─ Return: { error: 'Unauthorized', status: 401 }
```

### Stripe API Failure
```
POST /api/user/membership/upgrade
  ├─ createCheckoutSession() throws error
  ├─ Catch block catches error
  ├─ console.error() logs details
  └─ Return: { error: 'Failed to upgrade membership', status: 500 }
```

### Invalid Webhook Signature
```
POST /api/webhooks/stripe
  ├─ verifyWebhookSignature(body, signature)
  │   └─ stripe.webhooks.constructEvent() throws SignatureVerificationError
  ├─ Detect: return event === null
  └─ Return: { error: 'Invalid signature', status: 401 }
```

---

## Performance Considerations

### Database Query Optimization
- `user_id` indexed in all tables for fast lookup
- `plan_id` indexed for membership plan queries
- `stripe_subscription_id` indexed for webhook event correlation
- `status` indexed for filtering active memberships

### Caching Strategy
```typescript
// Plans rarely change, cache for 1 hour
const plansCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function getAllMembershipPlans() {
  if (plansCache.has('all_plans')) {
    return plansCache.get('all_plans');
  }
  const plans = await pool.query(...);
  plansCache.set('all_plans', plans);
  setTimeout(() => plansCache.delete('all_plans'), CACHE_TTL);
  return plans;
}
```

### Concurrency Handling
- Each API request is independent (stateless)
- Database transactions handle concurrent updates
- Stripe idempotency keys prevent duplicate charges
- Webhook retries handled by Stripe

---

## Security Considerations

### Authentication
- JWT tokens verified on protected endpoints
- Token includes user_id for authorization checks
- Stripe webhook signature verified with secret

### Authorization
- Users can only access their own membership
- Admin endpoints would need role check (future)
- Stripe customer metadata ensures user isolation

### Data Protection
- Database credentials in environment variables
- Stripe keys never exposed to frontend
- Webhook signatures prevent spoofing
- Payment data handled by Stripe (PCI compliance)

### Rate Limiting (Future)
```typescript
// Implement rate limiting on checkout endpoint
// Prevent abuse of create checkout session
const rateLimit = await redis.incr(`checkout:${userId}:${date}`);
if (rateLimit > 10) {
  return { error: 'Too many checkout requests', status: 429 };
}
```
