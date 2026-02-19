# Pending Membership Upgrade Tracking - Implementation Complete

**Date:** 2026-02-18  
**Status:** ✅ Complete

## Overview

Successfully implemented comprehensive tracking for pending membership upgrades, including:
1. Dedicated database table for persistent storage
2. Backend logging on upgrade creation and cancellation
3. Automatic completion tracking via Stripe webhooks
4. Profile page synchronization with server state

---

## Database Changes

### New Table: `pending_membership_upgrades`

Created table to track the full lifecycle of membership upgrade attempts:

```sql
CREATE TABLE pending_membership_upgrades (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_plan_code VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    checkout_session_id VARCHAR(255),
    checkout_url TEXT NOT NULL,
    promo_code VARCHAR(50),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes Created:**
- `idx_pending_membership_upgrades_user_id` - Fast user lookup
- `idx_pending_membership_upgrades_status` - Filter by status
- `idx_pending_membership_upgrades_checkout_session` - Webhook matching
- `idx_pending_membership_upgrades_started_at` - Temporal queries

**Migration File:** `src/migrations/20260218080545_create_pending_membership_upgrades.sql`

---

## Backend API Changes

### 1. Upgrade Endpoint Enhancement
**File:** `/src/app/api/user/membership/upgrade/route.ts`

**Changes:**
- Extracts checkout_session_id from Stripe checkout URL
- Inserts pending upgrade record to `pending_membership_upgrades` table
- Logs creation event to `user_activity_log` with type `membership_upgrade_started`
- Captures all upgrade details: plan, cycle, promo code, checkout URL

**Example Log Entry:**
```json
{
  "targetPlan": "premium",
  "billingCycle": "monthly",
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "promoCode": "CPNSAVE202026",
  "checkoutSessionId": "cs_test_..."
}
```

### 2. New Pending Query Endpoint
**File:** `/src/app/api/user/membership/pending/route.ts`

**Purpose:** Fetch current pending upgrade for authenticated user

**Response:**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "planCode": "premium",
    "billingCycle": "monthly",
    "promoCode": "CPNSAVE202026",
    "startedAt": "2026-02-18T10:05:45.000Z"
  }
}
```

Returns `null` if no pending upgrade exists.

### 3. Cancellation Endpoint Enhancement
**File:** `/src/app/api/user/membership/pending-cancel/route.ts`

**Changes:**
- Updates `pending_membership_upgrades` table: sets status='cancelled', cancelled_at=NOW()
- Continues to log cancellation to `user_activity_log` with type `membership_upgrade_cancelled`

### 4. Stripe Webhook Enhancement
**File:** `/src/app/api/webhooks/stripe/route.ts`

**New Event Handler:** `checkout.session.completed`

**Flow:**
1. Receives Stripe event when user completes payment
2. Finds pending upgrade by `checkout_session_id`
3. Updates status to 'completed' and sets `completed_at`
4. Logs completion to `user_activity_log` with type `membership_upgrade_completed`

**Handler Function:**
```typescript
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Marks pending upgrade as completed
  // Logs to activity log
}
```

---

## Frontend Changes

### Profile Page Enhancement
**File:** `/src/app/profile/page.tsx`

**New Function:** `fetchPendingUpgrade()`
- Fetches pending upgrade from database on page load
- Syncs server state with localStorage for fallback
- Called in useEffect when user is authenticated

**State Synchronization:**
1. On load: Fetch from database → Update localStorage + state
2. On cancel: Update database → Clear localStorage + state
3. On completion: Webhook updates DB → Next page load clears state

---

## Upgrade Lifecycle Tracking

### Full Lifecycle States

1. **Pending** (User initiated checkout but hasn't completed payment)
   - Created by: `/api/user/membership/upgrade` POST
   - Status: `pending`
   - Logged to: `pending_membership_upgrades` + `user_activity_log`

2. **Completed** (User completed payment successfully)
   - Updated by: Stripe webhook `checkout.session.completed`
   - Status: `completed`
   - Set: `completed_at` timestamp
   - Logged to: `user_activity_log` with type `membership_upgrade_completed`

3. **Cancelled** (User manually cancelled before payment)
   - Updated by: `/api/user/membership/pending-cancel` POST
   - Status: `cancelled`
   - Set: `cancelled_at` timestamp
   - Logged to: `user_activity_log` with type `membership_upgrade_cancelled`

4. **Expired** (Checkout session expired - handled by Stripe)
   - Status: `expired` (can be set by future cleanup job)

---

## Activity Log Events

All upgrade events are logged to `user_activity_log` table:

| Activity Type                     | When                           | Details Logged                                          |
|-----------------------------------|--------------------------------|---------------------------------------------------------|
| `membership_upgrade_started`      | User creates checkout          | Plan, cycle, promo code, checkout URL, session ID      |
| `membership_upgrade_completed`    | Payment confirmed by webhook   | Plan, cycle, session ID                                 |
| `membership_upgrade_cancelled`    | User cancels pending upgrade   | Checkout URL, plan name, started timestamp              |

---

## Query Examples

### Find All Pending Upgrades for a User
```sql
SELECT 
  target_plan_code,
  billing_cycle,
  started_at,
  promo_code
FROM pending_membership_upgrades
WHERE user_id = 'user-uuid-here' AND status = 'pending'
ORDER BY started_at DESC;
```

### Find Completed Upgrades in Last 30 Days
```sql
SELECT 
  user_id,
  target_plan_code,
  billing_cycle,
  completed_at
FROM pending_membership_upgrades
WHERE status = 'completed' 
  AND completed_at > NOW() - INTERVAL '30 days'
ORDER BY completed_at DESC;
```

### Find Abandoned Checkouts (Pending > 24 Hours)
```sql
SELECT 
  user_id,
  target_plan_code,
  started_at,
  checkout_url
FROM pending_membership_upgrades
WHERE status = 'pending' 
  AND started_at < NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

---

## Testing Checklist

✅ **Database**
- [x] Table created successfully
- [x] All indexes created
- [x] Foreign key constraints work (user_id references users)

✅ **Upgrade Flow**
- [x] Creating checkout inserts pending record
- [x] Checkout session ID extracted from URL
- [x] Activity log entry created on start
- [x] Promo code stored correctly

✅ **Cancellation Flow**
- [x] Cancel button updates database status
- [x] Activity log entry created on cancel
- [x] localStorage cleared after cancel

✅ **Completion Flow**
- [x] Webhook handler registered for `checkout.session.completed`
- [x] Status updated to 'completed' via webhook
- [x] Activity log entry created on completion

✅ **Profile Page**
- [x] Fetches pending from database on load
- [x] Syncs with localStorage
- [x] Clears pending state when membership becomes active

---

## Future Enhancements

### Potential Additions
1. **Cleanup Job:** Expire pending upgrades older than X hours/days
2. **Admin Dashboard:** View all pending/abandoned upgrades
3. **Retry Notifications:** Email users with abandoned checkouts
4. **Analytics:** Conversion rate tracking (started vs completed)
5. **Promo Code Foreign Key:** Link to `codes` table when that migration is applied

---

## Files Modified

1. `/src/app/api/user/membership/upgrade/route.ts` - Log upgrade creation
2. `/src/app/api/user/membership/pending-cancel/route.ts` - Update DB on cancel
3. `/src/app/api/webhooks/stripe/route.ts` - Handle checkout completion
4. `/src/app/profile/page.tsx` - Fetch pending from DB

## Files Created

1. `/src/app/api/user/membership/pending/route.ts` - Query pending upgrade
2. `/src/migrations/20260218080545_create_pending_membership_upgrades.sql` - Table migration

---

## Summary

The pending membership upgrade tracking system is now fully implemented with:

- ✅ Persistent database storage
- ✅ Full lifecycle tracking (pending → completed/cancelled)
- ✅ Comprehensive activity logging
- ✅ Webhook integration for automatic completion
- ✅ Frontend synchronization with backend
- ✅ Audit trail for all upgrade events

Users can now safely navigate away from checkout, and their pending upgrade will be tracked. When they return, the state is restored from the database. Completion is automatically tracked via Stripe webhooks, and all events are logged for audit purposes.
