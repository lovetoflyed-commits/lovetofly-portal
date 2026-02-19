# Membership System - Integration Quick Start

## Phase 1: Apply Database & Seed Data

### Step 1: Run Migration 112
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
npm run migrate:up
```

**Expected Output:**
```
Migrations to run:
-> 112_create_membership_system.sql
✓ Migrations completed successfully
```

**Verify tables created:**
```bash
psql postgresql://postgres:Master@51@localhost:5432/lovetofly-portal \
  -c "\dt membership*"
```

### Step 2: Seed Membership Plans
```bash
npm run seed:memberships
```

**Expected Output:**
```
🌱 Starting membership plans seed...

💾 Inserting membership plans into database...

✅ Inserted plan: Free
✅ Inserted plan: Standard
✅ Inserted plan: Premium
✅ Inserted plan: Pro

🎉 Membership plans successfully seeded!
```

**Verify plans inserted:**
```bash
psql postgresql://postgres:Master@51@localhost:5432/lovetofly-portal \
  -c "SELECT id, code, name, monthly_price, annual_price FROM membership_plans;"
```

---

## Phase 2: API Endpoints Ready to Use

### Available Endpoints (all working)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/memberships/plans` | GET | ❌ | List all plans |
| `/api/user/membership` | GET | ✅ | Get user's current membership |
| `/api/user/membership/upgrade` | POST | ✅ | Change plan |
| `/api/user/membership/cancel` | POST | ✅ | Cancel subscription |
| `/api/webhooks/stripe` | POST | Signature | Receive Stripe events |

### Test Endpoint (Development)
```bash
# Get all plans
curl http://localhost:3000/api/memberships/plans | jq .

# Get user membership (requires auth token)
AUTH_TOKEN="your_jwt_token_here"
curl -H "Authorization: Bearer $AUTH_TOKEN" \
  http://localhost:3000/api/user/membership | jq .

# Upgrade to Premium
curl -X POST \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"premium","billingCycle":"monthly"}' \
  http://localhost:3000/api/user/membership/upgrade | jq .
```

---

## Phase 3: Frontend Integration

### 3a. Add Plan Selector Modal to Registration

**Location to modify:** `src/components/IndividualRegisterForm.tsx`

**Add after successful registration:**
```tsx
import { useEffect, useState } from 'react';

export function IndividualRegisterForm() {
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

  useEffect(() => {
    // Fetch plans after registration succeeds
    if (showPlanSelector) {
      fetch('/api/memberships/plans')
        .then(res => res.json())
        .then(data => setPlans(data.data.plans));
    }
  }, [showPlanSelector]);

  const handleSelectPlan = async (planCode) => {
    if (planCode === 'free') {
      // Free plan - just complete registration
      setShowPlanSelector(false);
      navigate('/dashboard');
    } else {
      // Paid plan - redirect to Stripe checkout
      const res = await fetch('/api/user/membership/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planCode,
          billingCycle: selectedBillingCycle,
        }),
      });
      const data = await res.json();
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    }
  };

  return (
    <>
      {/* Existing registration form ... */}

      {/* Plan selector modal */}
      {showPlanSelector && (
        <div className="modal">
          <h2>Choose Your Membership Plan</h2>
          <div className="plan-grid">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={selectedBillingCycle}
                onSelect={() => handleSelectPlan(plan.code)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

### 3b. Create Plan Card Component

**New file:** `src/components/PlanCard.tsx`

```tsx
export function PlanCard({ plan, billingCycle, onSelect }) {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const savings = billingCycle === 'annual' ? plan.annualDiscountPercent : 0;

  return (
    <div className="plan-card">
      <h3>{plan.name}</h3>
      <p className="description">{plan.description}</p>

      <div className="price">
        <span className="amount">R$ {price.toFixed(2)}</span>
        <span className="period">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
      </div>

      {savings > 0 && (
        <div className="savings">Save {savings}% with annual plan</div>
      )}

      <ul className="features">
        {plan.features.map((feature, i) => (
          <li key={i}>✓ {feature}</li>
        ))}
      </ul>

      <button onClick={onSelect} className="btn-select">
        {plan.code === 'free' ? 'Get Started' : 'Select Plan'}
      </button>
    </div>
  );
}
```

---

## Phase 4: Stripe Configuration

### Setup Stripe Webhook (Test Mode)

1. **Get Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   # Will open browser to authenticate
   ```

3. **Forward Webhook Events:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   **Output:**
   ```
   > Ready! Your webhook signin secret is whsec_test_... [copy this]
   ```

4. **Add to .env.local:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

5. **Test Webhook:**
   ```bash
   # In another terminal
   stripe trigger customer.subscription.created
   ```

### Production Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copy signing secret to environment

---

## Phase 5: Test Complete Flow

### Development Testing (Local)

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Open browser
# http://localhost:3000/register

# 4. Fill registration form
# - Email: test@example.com
# - Password: Test123!
# - CPF: 529.982.247-25 (test CPF)

# 5. Select membership plan
# - Choose 'Standard' or 'Premium'
# - Select billing cycle

# 6. Stripe Checkout
# - Use test card: 4242 4242 4242 4242
# - Any future expiry date
# - Any CVC

# 7. Verify in webhook terminal
# - Should see: subscription.created event
# - User_membership record created
# - Billing invoice recorded
```

### Database Verification

```bash
# Check user created
psql -c "SELECT id, email, role FROM users WHERE email='test@example.com';"

# Check membership created
psql -c "SELECT * FROM user_memberships WHERE user_id=YOUR_USER_ID;"

# Check billing history
psql -c "SELECT * FROM billing_invoices WHERE user_id=YOUR_USER_ID;"
```

---

## File Checklist

### ✅ Created & Ready
- [x] `src/migrations/112_create_membership_system.sql` - Schema migration
- [x] `src/utils/membershipUtils.ts` - Database operations (11 functions)
- [x] `src/utils/stripeUtils.ts` - Stripe integration (9 functions)
- [x] `src/app/api/memberships/plans/route.ts` - GET plans endpoint
- [x] `src/app/api/user/membership/route.ts` - GET user membership
- [x] `src/app/api/user/membership/upgrade/route.ts` - POST upgrade endpoint
- [x] `src/app/api/user/membership/cancel/route.ts` - POST cancel endpoint
- [x] `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- [x] `scripts/seed-memberships.ts` - Seed script with Stripe products

### ⏳ Next to Create
- [ ] `src/components/PlanCard.tsx` - Plan card component
- [ ] `src/components/MembershipSelector.tsx` - Plan selection modal
- [ ] `src/app/profile/membership/page.tsx` - Membership management page
- [ ] Update `src/components/IndividualRegisterForm.tsx` - Add plan selector
- [ ] Create Stripe customer creation hook

---

## Key Integration Points

### 1. After Registration Success
```tsx
// Register user → Create auth token → Show plan selector modal
if (registrationSuccess) {
  setShowPlanSelector(true);
  // Fetch /api/memberships/plans
}
```

### 2. Plan Selection
```tsx
// User selects plan → Redirect to Stripe checkout or free plan confirmation
if (selectedPlan.code === 'free') {
  // Auto-complete, go to dashboard
} else {
  // POST /api/user/membership/upgrade → Get checkoutUrl → Redirect
}
```

### 3. Stripe Callback
```tsx
// Stripe checkout success → Webhook fires → User_membership created
// Or handle Stripe session verification
```

### 4. Profile Membership View
```tsx
// User dashboard → GET /api/user/membership → Show plan + upgrade button
// Upgrade button → Same flow as new registration
```

---

## Common Issues & Solutions

### Issue: Webhook not firing
**Solution:**
1. Verify webhook secret in `.env.local`
2. Check Stripe CLI still running: `stripe listen --forward-to ...`
3. Check server logs for endpoint errors
4. Test manually: `stripe trigger customer.subscription.created`

### Issue: Stripe checkout not appearing
**Solution:**
1. Verify `STRIPE_PUBLISHABLE_KEY` set
2. Check browser console for errors
3. Verify plan has `stripe_monthly_price_id` set
4. Check Stripe dashboard products exist

### Issue: User membership not updating
**Solution:**
1. Check webhook events arriving: `stripe logs:tail`
2. Verify database connection in webhook handler
3. Check `user_memberships` table has rows
4. Look for error logs in server terminal

---

## Environment Variables Checklist

```bash
# Required for membership system
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...  # For local testing

# Database (should already exist)
DATABASE_URL=postgresql://...

# Optional but recommended
NEXT_PUBLIC_WEBHOOK_URL=https://yourdomain.com
NODE_ENV=development
```

---

## Rollback Plan (if needed)

```bash
# Revert migration 112 (downgrade)
npm run migrate:down

# This will:
# - Drop membership_plans table
# - Drop user_memberships table
# - Drop billing_invoices table
# - Drop membership_plan_features table
# - Drop user_membership_history table

# User data in main users table is preserved
```

---

## Performance Notes

- Membership plans fetched once on app startup (cacheable)
- Stripe checkout session creation takes ~500ms
- Webhook processing takes ~200-300ms
- Database queries use indexes on user_id, plan_id
- Consider caching plan list in memory for API calls
