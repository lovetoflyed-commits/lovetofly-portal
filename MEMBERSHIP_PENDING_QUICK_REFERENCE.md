# Pending Membership Upgrades - Quick Reference

## Database Query Cheat Sheet

### Find user's current pending upgrade
```sql
SELECT * FROM pending_membership_upgrades
WHERE user_id = 'USER_UUID_HERE' AND status = 'pending'
ORDER BY started_at DESC LIMIT 1;
```

### Find all pending upgrades (not completed/cancelled)
```sql
SELECT 
  u.email,
  p.target_plan_code,
  p.billing_cycle,
  p.started_at,
  p.promo_code
FROM pending_membership_upgrades p
JOIN users u ON u.id = p.user_id
WHERE p.status = 'pending'
ORDER BY p.started_at DESC;
```

### Conversion rate (last 30 days)
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as conversion_rate,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status = 'pending') as still_pending
FROM pending_membership_upgrades
WHERE started_at > NOW() - INTERVAL '30 days';
```

### Abandoned checkouts (pending > 24 hours)
```sql
SELECT 
  u.email,
  p.target_plan_code,
  p.started_at,
  NOW() - p.started_at as time_elapsed
FROM pending_membership_upgrades p
JOIN users u ON u.id = p.user_id
WHERE p.status = 'pending' 
  AND p.started_at < NOW() - INTERVAL '24 hours'
ORDER BY p.started_at ASC;
```

### User's upgrade history
```sql
SELECT 
  target_plan_code,
  billing_cycle,
  status,
  started_at,
  completed_at,
  cancelled_at,
  promo_code
FROM pending_membership_upgrades
WHERE user_id = 'USER_UUID_HERE'
ORDER BY started_at DESC;
```

---

## API Endpoints Quick Reference

### GET /api/user/membership/pending
**Auth:** Required (JWT Bearer token)

**Response:**
```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "planCode": "premium",
    "billingCycle": "monthly",
    "promoCode": "SAVE20",
    "startedAt": "2026-02-18T10:00:00Z"
  }
}
```

Returns `{ data: null }` if no pending upgrade exists.

### POST /api/user/membership/upgrade
**Auth:** Required

**Body:**
```json
{
  "planCode": "premium",
  "billingCycle": "monthly",
  "code": "SAVE20"
}
```

**Side Effects:**
- Inserts into `pending_membership_upgrades` (status='pending')
- Logs to `user_activity_log` (type='membership_upgrade_started')

### POST /api/user/membership/pending-cancel
**Auth:** Required

**Body:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "planName": "premium",
  "startedAt": "2026-02-18T10:00:00Z"
}
```

**Side Effects:**
- Updates `pending_membership_upgrades` (status='cancelled')
- Logs to `user_activity_log` (type='membership_upgrade_cancelled')

---

## Webhook Event Handler

### POST /api/webhooks/stripe
**Event:** `checkout.session.completed`

**Trigger:** Stripe sends webhook when user completes payment

**Side Effects:**
- Updates `pending_membership_upgrades` (status='completed', completed_at=NOW())
- Logs to `user_activity_log` (type='membership_upgrade_completed')

**Verification:** Webhook signature verified via `STRIPE_WEBHOOK_SECRET`

---

## Activity Log Event Types

| Event Type                         | When                          | Who Triggers  |
|------------------------------------|-------------------------------|---------------|
| `membership_upgrade_started`       | Checkout created              | User action   |
| `membership_upgrade_completed`     | Payment successful            | Stripe webhook|
| `membership_upgrade_cancelled`     | User cancels pending          | User action   |

### Query Activity Log
```sql
SELECT 
  activity_type,
  activity_details,
  created_at
FROM user_activity_log
WHERE user_id = 'USER_UUID_HERE'
  AND activity_type LIKE 'membership_upgrade%'
ORDER BY created_at DESC;
```

---

## Frontend State Management

### Profile Page State
```tsx
const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
const [pendingStartedAt, setPendingStartedAt] = useState<string | null>(null);
```

### State Sources (in priority order)
1. **Database** (`pending_membership_upgrades` table) - Source of truth
2. **localStorage** (`pendingMembershipUpgrade` key) - Fallback/cache

### State Sync Flow
```
Page Load → fetchPendingUpgrade() → GET /api/user/membership/pending
           ↓
    Update React state + localStorage
           ↓
    Render pending banner (if exists)
```

---

## Common Tasks

### Manually mark pending as completed
```sql
UPDATE pending_membership_upgrades
SET status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE checkout_session_id = 'cs_test_ABC123XYZ'
  AND status = 'pending';
```

### Manually cancel all pending upgrades for user
```sql
UPDATE pending_membership_upgrades
SET status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
WHERE user_id = 'USER_UUID_HERE'
  AND status = 'pending';
```

### Expire old pending upgrades (cleanup script)
```sql
UPDATE pending_membership_upgrades
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'pending'
  AND started_at < NOW() - INTERVAL '7 days';
```

---

## Debugging Checklist

### Issue: Pending upgrade not showing on profile page

1. Check database:
   ```sql
   SELECT * FROM pending_membership_upgrades 
   WHERE user_id = 'USER_UUID' AND status = 'pending';
   ```

2. Check localStorage:
   ```javascript
   console.log(localStorage.getItem('pendingMembershipUpgrade'));
   ```

3. Check API response:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/user/membership/pending
   ```

### Issue: Webhook not marking upgrade as completed

1. Check Stripe webhook logs in Stripe Dashboard

2. Check webhook endpoint is configured:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

3. Check server logs for webhook processing:
   ```
   [Webhook] Processing event: checkout.session.completed
   [Webhook] Marked pending upgrade as completed for user X
   ```

4. Manually check DB:
   ```sql
   SELECT * FROM pending_membership_upgrades 
   WHERE checkout_session_id = 'cs_test_ABC123';
   ```

### Issue: Upgrade not being logged to database

1. Check upgrade endpoint logs:
   ```
   Error logging pending upgrade: ...
   ```

2. Verify table exists:
   ```sql
   \d pending_membership_upgrades
   ```

3. Check foreign key constraints:
   ```sql
   SELECT * FROM users WHERE id = 'USER_UUID';
   ```

---

## Environment Variables

Required for webhook processing:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Testing Commands

### Insert test pending upgrade
```sql
INSERT INTO pending_membership_upgrades
  (user_id, target_plan_code, billing_cycle, checkout_url, checkout_session_id, promo_code, status)
VALUES
  ('YOUR_USER_UUID', 'premium', 'monthly', 'https://checkout.stripe.com/test', 'cs_test_123', 'SAVE20', 'pending');
```

### Mark test as completed
```sql
UPDATE pending_membership_upgrades
SET status = 'completed', completed_at = NOW()
WHERE id = LAST_INSERT_ID;
```

### Clear all test data
```sql
DELETE FROM pending_membership_upgrades WHERE checkout_session_id LIKE 'cs_test_%';
```

---

## Performance Notes

- All queries use indexed columns (user_id, status, checkout_session_id, started_at)
- Expected table size: ~10-100 rows per user (mostly historical completed/cancelled)
- GET /api/user/membership/pending uses `LIMIT 1` - always fast
- Webhook updates use checkout_session_id (indexed) - O(1) lookup

---

## Security Notes

- All endpoints require authentication (JWT token)
- Users can only access their own pending upgrades
- Webhook signature verified before processing
- SQL queries use parameterized statements (no injection risk)

---

## Related Documentation

- **Full Implementation:** `MEMBERSHIP_PENDING_TRACKING_COMPLETE.md`
- **Architecture:** `MEMBERSHIP_PENDING_TRACKING_ARCHITECTURE.md`
- **Summary:** `MEMBERSHIP_UPGRADE_TRACKING_SUMMARY.md`
