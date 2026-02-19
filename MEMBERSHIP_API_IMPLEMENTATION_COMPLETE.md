# Membership System API Implementation - Complete

## Overview
The membership system API has been fully implemented with 5 REST endpoints and a Stripe webhook handler. All endpoints integrate with the database utilities and Stripe integration layer created in the previous phase.

---

## API Endpoints

### 1. Get All Membership Plans
**Endpoint:** `GET /api/memberships/plans`
**Authentication:** Not required
**Purpose:** Retrieve all available membership tiers with pricing and features

**Response Example:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "free",
        "name": "Free",
        "description": "Perfect for getting started with Love to Fly",
        "monthlyPrice": 0,
        "annualPrice": 0,
        "annualDiscountPercent": 0,
        "features": ["Basic flight logbook", "Weather access", "E6B calculator", "Community forum"],
        "prioritySupport": false,
        "maxUsersAllowed": 1,
        "maxProjects": 3,
        "maxStorageGb": 1
      },
      {
        "id": 2,
        "code": "standard",
        "name": "Standard",
        "description": "For serious student pilots and hobbyists",
        "monthlyPrice": 9.99,
        "annualPrice": 99.99,
        "annualDiscountPercent": 17,
        "features": ["Everything in Free", "Advanced flight logbook", "Flight planning tools", ...],
        "prioritySupport": false,
        "maxUsersAllowed": 1,
        "maxProjects": 10,
        "maxStorageGb": 10
      }
      // ... Premium and Pro tiers
    ]
  }
}
```

---

### 2. Get User's Current Membership
**Endpoint:** `GET /api/user/membership`
**Authentication:** Required (Bearer token)
**Purpose:** Retrieve the authenticated user's current membership and billing history

**Response Example:**
```json
{
  "success": true,
  "data": {
    "membership": {
      "id": 42,
      "userId": 12345,
      "planId": 2,
      "planCode": "standard",
      "planName": "Standard",
      "stripeSubscriptionId": "sub_1P5K9vI2i9K8Z5Y0Z",
      "startDate": "2024-01-15T10:30:00Z",
      "renewalDate": "2024-02-15T10:30:00Z",
      "billingCycle": "monthly",
      "status": "active",
      "autoRenewal": true
    },
    "billingHistory": [
      {
        "id": 1,
        "invoiceDate": "2024-01-15T10:30:00Z",
        "amount": 9.99,
        "currency": "BRL",
        "status": "paid",
        "stripeInvoiceId": "in_1P5K9vI2i9K8Z5Y0Z"
      }
    ]
  }
}
```

**Error Response (No membership):**
```json
{
  "success": true,
  "data": {
    "membership": null,
    "billingHistory": []
  }
}
```

---

### 3. Upgrade/Downgrade Membership
**Endpoint:** `POST /api/user/membership/upgrade`
**Authentication:** Required (Bearer token)
**Purpose:** Change membership plan; redirects to Stripe Checkout for paid plans

**Request Body:**
```json
{
  "planCode": "premium",
  "billingCycle": "monthly"  // or "annual"
}
```

**Response (Paid Plan):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_1P5K9vI2i9K8Z5Y0Z...",
    "action": "redirect_to_checkout"
  }
}
```

**Response (Free Plan):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully changed to Free plan"
  }
}
```

---

### 4. Cancel Membership
**Endpoint:** `POST /api/user/membership/cancel`
**Authentication:** Required (Bearer token)
**Purpose:** Cancel paid subscription; downgrades user to Free tier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Membership cancelled successfully",
    "newPlanCode": "free"
  }
}
```

**Error (Trying to cancel Free plan):**
```json
{
  "error": "Cannot cancel free membership",
  "status": 400
}
```

---

### 5. Stripe Webhook Handler
**Endpoint:** `POST /api/webhooks/stripe`
**Authentication:** Stripe Signature Verification
**Purpose:** Handle Stripe events (subscriptions, invoices, webhooks)

**Supported Events:**
- `customer.subscription.created` - New subscription created → Create user membership
- `customer.subscription.updated` - Subscription modified → Update membership details
- `invoice.payment_succeeded` - Payment successful → Record billing invoice
- `invoice.payment_failed` - Payment failed → Record failed invoice
- `customer.subscription.deleted` - Subscription cancelled → Mark membership as cancelled

**Webhook Configuration:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Select all subscription and invoice events
3. The webhook will use the signature from `stripe-signature` header to verify authenticity

---

## Database Setup

### Step 1: Apply Migration 112
The migration creates 5 new tables required for membership system:
- `membership_plans` - Plan definitions (Free, Standard, Premium, Pro)
- `user_memberships` - User subscriptions
- `billing_invoices` - Payment history
- `membership_plan_features` - Feature access matrix
- `user_membership_history` - Audit log

**Apply migration:**
```bash
npm run migrate:up
```

### Step 2: Seed Membership Plans
Populates the 4 membership tiers and creates corresponding Stripe products/prices:

**Run seed script:**
```bash
npm run seed:memberships
```

**Output will show:**
- ✅ Stripe products created (with monthly/annual prices)
- ✅ Membership plans inserted into database
- ℹ️  Next steps for webhook configuration

---

## Configuration

### Environment Variables Required
```bash
# Stripe configuration
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)

# Webhook configuration
NEXT_PUBLIC_WEBHOOK_URL=https://yourdomain.com

# Database (should already be configured)
DATABASE_URL=postgresql://...
```

### Database Connection
Ensure your `.env.local` or `.env` file points to your PostgreSQL database:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/lovetofly-portal
```

---

## Integration Flow

### Registration with Membership Plan Selection
1. User fills registration form
2. After creating user account
3. Redirect to plan selection page
4. If paid plan selected → Redirect to Stripe Checkout
5. Stripe returns to success URL with `session_id`
6. Exchange session_id for subscription details
7. Create user_membership record with plan and Stripe subscription ID

### User Upgrades/Downgrades
1. User navigates to profile/membership settings
2. Clicks "Upgrade to Premium" or "Change Plan"
3. API calls `POST /api/user/membership/upgrade`
4. If paid plan:
   - Stripe Checkout session created
   - Return checkout URL to frontend
   - Frontend redirects user to Stripe Checkout
   - On success, webhook updates membership
5. If free plan:
   - Immediately downgrade and update membership

### Cancelation Flow
1. User clicks "Cancel Membership"
2. API calls `POST /api/user/membership/cancel`
3. Stripe subscription cancelled via API
4. User_membership record marked as cancelled
5. User automatically downgraded to Free plan

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── memberships/
│   │   │   └── plans/
│   │   │       └── route.ts              [NEW] GET all plans
│   │   ├── user/
│   │   │   └── membership/
│   │   │       ├── route.ts              [NEW] GET user membership
│   │   │       ├── upgrade/
│   │   │       │   └── route.ts          [NEW] POST upgrade/downgrade
│   │   │       └── cancel/
│   │   │           └── route.ts          [NEW] POST cancel
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts              [NEW] Stripe webhook handler
│   ├── utils/
│   │   ├── membershipUtils.ts            [CREATED PREV] Database operations
│   │   └── stripeUtils.ts                [CREATED PREV] Stripe API wrapper
│   └── ...
├── migrations/
│   └── 112_create_membership_system.sql  [CREATED PREV] Schema
└── scripts/
    └── seed-memberships.ts               [NEW] Seed Stripe + database

```

---

## Testing the API

### 1. Test Get Plans Endpoint
```bash
curl http://localhost:3000/api/memberships/plans
```

### 2. Test Get User Membership (with auth)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/user/membership
```

### 3. Test Upgrade Membership
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"premium","billingCycle":"monthly"}' \
  http://localhost:3000/api/user/membership/upgrade
```

### 4. Test Stripe Webhook (using Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Will display signing secret, copy it to STRIPE_WEBHOOK_SECRET
```

---

## Utility Functions Reference

### membershipUtils.ts Functions
- `getAllMembershipPlans()` - Get all plans from database
- `getMembershipPlanByCode(code)` - Get plan by code (free, standard, premium, pro)
- `getMembershipPlanById(id)` - Get plan by ID
- `getUserMembership(userId)` - Get active subscription with plan details
- `hasFeatureAccess(userId, featureCode)` - Check if user has feature access
- `createUserMembership(userId, planId, billingCycle, stripeSubId)` - Create subscription
- `updateUserMembership(userId, planId, billingCycle, stripeSubId)` - Update subscription
- `cancelUserMembership(userId)` - Cancel subscription
- `recordBillingInvoice(userId, invoiceId, amount, currency, status)` - Record invoice
- `getUserBillingHistory(userId)` - Get all invoices
- `handleStripeSubscriptionUpdate(userId, subId, status, planId, renewalDate, billingCycle)` - Webhook handler

### stripeUtils.ts Functions
- `createStripeProduct(plan)` - Create Stripe product
- `createCheckoutSession(options)` - Create checkout session
- `createStripeCustomer(user)` - Create Stripe customer
- `getStripeCustomer(customerId)` - Get customer
- `createBillingPortalSession(customerId)` - Customer portal access
- `cancelStripeSubscription(subscriptionId)` - Cancel subscription
- `updateSubscription(subscriptionId, options)` - Update subscription
- `getSubscriptionInvoices(subscriptionId)` - Get invoices
- `verifyWebhookSignature(body, signature)` - Verify webhook

---

## Next Steps

1. ✅ **Apply Migration 112**: Run `npm run migrate:up`
2. ✅ **Seed Membership Plans**: Run `npm run seed:memberships`
3. ⏳ **Add Plan Selector UI**: Create component for registration flow
4. ⏳ **Activate Stripe Webhook**: Configure in Stripe Dashboard
5. ⏳ **Build Profile UI**: Show membership + upgrade buttons
6. ⏳ **E2E Testing**: Test full registration → subscription flow
7. ⏳ **Go Live**: Deploy with live Stripe keys

---

## Support

For issues:
1. Check Stripe Dashboard for webhook logs
2. Review server logs for API errors
3. Verify database migrations applied: `npm run migrate:status`
4. Test with Stripe test keys first before going live
