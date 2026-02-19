# Pending Membership Upgrade - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
│                      (Profile Page)                                  │
│                                                                       │
│  [Current Plan Card]  [Upgrade Button] → Opens Modal                 │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Pending Upgrade Banner (if exists)                           │  │
│  │  - Shows: Plan name, timestamp, "Reopen" & "Cancel" buttons   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND API LAYER                              │
│                                                                       │
│  POST /api/user/membership/upgrade                                   │
│    ↓                                                                 │
│    1. Validate plan & promo code                                     │
│    2. Create Stripe checkout session                                 │
│    3. Insert into pending_membership_upgrades (status = pending)     │
│    4. Log to user_activity_log (upgrade_started)                     │
│    5. Return checkout URL to client                                  │
│                                                                       │
│  GET /api/user/membership/pending                                    │
│    ↓                                                                 │
│    - Query latest pending upgrade for user                           │
│    - Return checkout URL, plan code, cycle, started timestamp        │
│                                                                       │
│  POST /api/user/membership/pending-cancel                            │
│    ↓                                                                 │
│    1. Update pending_membership_upgrades (status = cancelled)        │
│    2. Log to user_activity_log (upgrade_cancelled)                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                │
│                                                                       │
│  pending_membership_upgrades                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ id, user_id, target_plan_code, billing_cycle                 │   │
│  │ checkout_session_id, checkout_url, promo_code                │   │
│  │ started_at, completed_at, cancelled_at                        │   │
│  │ status (pending|completed|cancelled|expired)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  user_activity_log                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ user_id, activity_type, activity_details, timestamp          │   │
│  │ - membership_upgrade_started                                  │   │
│  │ - membership_upgrade_completed                                │   │
│  │ - membership_upgrade_cancelled                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STRIPE WEBHOOK LAYER                              │
│                                                                       │
│  POST /api/webhooks/stripe                                           │
│    ↓                                                                 │
│    On checkout.session.completed:                                    │
│      1. Extract checkout_session_id from event                       │
│      2. Find pending upgrade by checkout_session_id                  │
│      3. Update status = completed, set completed_at                  │
│      4. Log to user_activity_log (upgrade_completed)                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: User Starts Upgrade

```
User clicks "Upgrade" → Selects Plan & Cycle → Enters Promo Code (optional)
                                    ↓
                        POST /api/user/membership/upgrade
                                    ↓
                    ┌───────────────────────────────┐
                    │  Validate Plan & Promo Code   │
                    └───────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │  Create Stripe Checkout       │
                    │  Returns: checkout_url        │
                    │           checkout_session_id │
                    └───────────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  INSERT INTO pending_membership_upgrades      │
            │  - user_id                                    │
            │  - target_plan_code = 'premium'               │
            │  - billing_cycle = 'monthly'                  │
            │  - checkout_session_id = 'cs_test_abc123'     │
            │  - checkout_url = 'https://checkout...'       │
            │  - promo_code = 'CPNSAVE202026' (if provided) │
            │  - status = 'pending'                         │
            │  - started_at = NOW()                         │
            └───────────────────────────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  INSERT INTO user_activity_log                │
            │  - activity_type = 'membership_upgrade_started'│
            │  - activity_details = JSON with plan details  │
            └───────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │  Return checkout_url to client│
                    └───────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │  localStorage.setItem(...)    │
                    │  - Store: checkoutUrl         │
                    │           planName            │
                    │           startedAt           │
                    └───────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │  window.open(checkout_url)    │
                    │  User redirected to Stripe    │
                    └───────────────────────────────┘
```

### Flow 2: User Completes Payment

```
User on Stripe → Enters Card Details → Submits Payment
                                    ↓
                        Stripe processes payment
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  Stripe sends webhook event:                  │
            │  checkout.session.completed                   │
            │  - checkout_session_id = 'cs_test_abc123'     │
            └───────────────────────────────────────────────┘
                                    ↓
                POST /api/webhooks/stripe (verified)
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  handleCheckoutSessionCompleted(session)      │
            └───────────────────────────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  UPDATE pending_membership_upgrades           │
            │  SET status = 'completed'                     │
            │      completed_at = NOW()                     │
            │      updated_at = NOW()                       │
            │  WHERE checkout_session_id = 'cs_test_abc123' │
            │    AND status = 'pending'                     │
            └───────────────────────────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  INSERT INTO user_activity_log                │
            │  - activity_type = 'membership_upgrade_completed'│
            │  - activity_details = JSON with plan details  │
            └───────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────┐
                │  User redirected to success page  │
                │  (Stripe handles redirect)        │
                └───────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────┐
                │  User returns to profile page     │
                │  fetchMembershipData() sees       │
                │  status = 'active'                │
                │  → Clears pending state           │
                └───────────────────────────────────┘
```

### Flow 3: User Cancels Pending Upgrade

```
User on Profile Page → Sees Pending Banner → Clicks "Cancel"
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  clearPendingUpgrade() called                 │
            └───────────────────────────────────────────────┘
                                    ↓
            POST /api/user/membership/pending-cancel
            Body: { checkoutUrl, planName, startedAt }
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  UPDATE pending_membership_upgrades           │
            │  SET status = 'cancelled'                     │
            │      cancelled_at = NOW()                     │
            │      updated_at = NOW()                       │
            │  WHERE user_id = ? AND status = 'pending'     │
            │    AND checkout_url = ?                       │
            └───────────────────────────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────────────┐
            │  INSERT INTO user_activity_log                │
            │  - activity_type = 'membership_upgrade_cancelled'│
            │  - activity_details = JSON with checkout info │
            └───────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────┐
                │  Response: { success: true }      │
                └───────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────┐
                │  Frontend clears state:           │
                │  - setPendingCheckoutUrl(null)    │
                │  - setPendingPlanName(null)       │
                │  - setPendingStartedAt(null)      │
                │  - localStorage.removeItem(...)   │
                └───────────────────────────────────┘
```

### Flow 4: User Returns to Profile Page

```
User navigates to /profile
                ↓
    ┌───────────────────────────────┐
    │  useEffect(() => {            │
    │    fetchMembershipData()      │
    │    fetchPlans()               │
    │    fetchPendingUpgrade()  ← NEW │
    │  }, [user])                   │
    └───────────────────────────────┘
                ↓
        GET /api/user/membership/pending
                ↓
    ┌───────────────────────────────────────────┐
    │  SELECT * FROM pending_membership_upgrades│
    │  WHERE user_id = ? AND status = 'pending' │
    │  ORDER BY started_at DESC                 │
    │  LIMIT 1                                  │
    └───────────────────────────────────────────┘
                ↓
        ┌──────────────────────────┐
        │  If found:               │
        │  - Set state from DB     │
        │  - Sync to localStorage  │
        │                          │
        │  If not found:           │
        │  - State remains null    │
        └──────────────────────────┘
                ↓
    ┌───────────────────────────────┐
    │  Render UI:                   │
    │  - Show pending banner if     │
    │    pendingCheckoutUrl !== null│
    │  - Hide banner otherwise      │
    └───────────────────────────────┘
```

---

## State Management

### Client-Side State (Profile Page)

```typescript
const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
const [pendingStartedAt, setPendingStartedAt] = useState<string | null>(null);
```

**State Sources:**
1. **Primary:** Database (`pending_membership_upgrades` table)
2. **Fallback:** localStorage (`pendingMembershipUpgrade` key)

**Sync Strategy:**
- On mount: Fetch from DB → Update localStorage + state
- On upgrade start: DB insert → localStorage set → state update
- On cancel: DB update → localStorage clear → state clear
- On completion (webhook): DB update → Next page load sees active membership → state clear

### Server-Side State

**Database Tables:**

1. `pending_membership_upgrades` (source of truth)
   - Tracks current state of each upgrade attempt
   - Indexed for fast queries

2. `user_activity_log` (audit trail)
   - Immutable log of all events
   - Used for analytics and debugging

---

## Error Handling

### Database Insert Failures

```typescript
try {
  await pool.query(
    `INSERT INTO pending_membership_upgrades ...`,
    [...]
  );
} catch (err) {
  console.error('Error logging pending upgrade:', err);
  // Don't block checkout if logging fails
}
```

**Strategy:** Log error, continue with checkout. Checkout URL is still stored in localStorage as fallback.

### Webhook Processing Failures

```typescript
async function handleCheckoutSessionCompleted(session) {
  try {
    // Update database
  } catch (error) {
    console.error('[Webhook] handleCheckoutSessionCompleted error:', error);
    // Don't throw - webhook should still return 200
  }
}
```

**Strategy:** Log error, return 200 to Stripe. User's membership will still be activated by subscription.created event. Pending state may persist but will be cleared on next profile load when active membership is detected.

### Frontend Fetch Failures

```typescript
const fetchPendingUpgrade = async () => {
  try {
    const res = await fetch('/api/user/membership/pending', {...});
    // Process response
  } catch (error) {
    console.warn('Failed to fetch pending upgrade from DB:', error);
    // Fallback to localStorage (already loaded in separate useEffect)
  }
};
```

**Strategy:** Log warning, rely on localStorage fallback that's already loaded.

---

## Performance Considerations

### Database Indexes

All queries use indexed columns:

```sql
-- User lookup (most common)
WHERE user_id = ? AND status = 'pending'
-- Uses: idx_pending_membership_upgrades_user_id + partial scan on status

-- Webhook matching (high frequency)
WHERE checkout_session_id = ?
-- Uses: idx_pending_membership_upgrades_checkout_session

-- Analytics queries
WHERE started_at > ?
-- Uses: idx_pending_membership_upgrades_started_at
```

### Query Optimization

Pending upgrade query is limited to 1 most recent:

```sql
ORDER BY started_at DESC LIMIT 1
```

Expected table size: ~10-100 rows per active user (mostly completed/cancelled)

### Caching Strategy

**Current:** No caching (state fetched fresh on page load)

**Future Enhancement:** Consider Redis cache for frequently accessed pending upgrades
- Key: `pending_upgrade:${userId}`
- TTL: 5 minutes
- Invalidate on: upgrade start, cancel, completion

---

## Security Considerations

### Authentication

All endpoints require valid JWT token:

```typescript
const user = await verifyTokenAndGetUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Authorization

Users can only access their own pending upgrades:

```sql
WHERE user_id = $1  -- From authenticated user token
```

### Webhook Verification

Stripe webhook signature is verified before processing:

```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const event = verifyWebhookSignature(body, signature, webhookSecret);
if (!event) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Conversion Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as conversion_rate
   FROM pending_membership_upgrades
   WHERE started_at > NOW() - INTERVAL '30 days';
   ```

2. **Average Time to Complete**
   ```sql
   SELECT 
     AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) / 60 as avg_minutes
   FROM pending_membership_upgrades
   WHERE status = 'completed' AND completed_at IS NOT NULL;
   ```

3. **Cancellation Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'cancelled') * 100.0 / COUNT(*) as cancellation_rate
   FROM pending_membership_upgrades
   WHERE started_at > NOW() - INTERVAL '30 days';
   ```

4. **Abandoned Checkouts (Pending > 24h)**
   ```sql
   SELECT COUNT(*)
   FROM pending_membership_upgrades
   WHERE status = 'pending' 
     AND started_at < NOW() - INTERVAL '24 hours';
   ```

### Logging

All upgrade lifecycle events are logged to `user_activity_log`:
- `membership_upgrade_started`
- `membership_upgrade_completed`
- `membership_upgrade_cancelled`

Console logs for debugging:
- `[Webhook] Processing completed checkout session: cs_test_...`
- `[Webhook] Marked pending upgrade as completed for user XYZ`
- `[Membership Upgrade] Error: ...`

---

## Testing Scenarios

### Happy Path
1. User starts upgrade → Pending record created
2. User completes payment → Webhook marks as completed
3. User returns to profile → Pending state cleared

### Edge Cases
1. **User starts multiple upgrades:** Only latest pending shows
2. **Webhook arrives before user returns:** Status already completed
3. **User closes tab during checkout:** Pending preserved in DB
4. **Database insert fails:** Checkout proceeds, localStorage fallback works
5. **Webhook fails:** Subscription still activated, pending may persist but cleared on next visit

### Manual Testing Steps
1. Start upgrade → Verify DB insert
2. Check profile page → Verify pending banner shows
3. Complete payment → Verify webhook updates status
4. Return to profile → Verify pending banner hidden
5. Start upgrade → Cancel → Verify status = 'cancelled'

---

## Documentation References

- **Implementation Doc:** `MEMBERSHIP_PENDING_TRACKING_COMPLETE.md`
- **Migration File:** `src/migrations/20260218080545_create_pending_membership_upgrades.sql`
- **Related Features:** Membership upgrade modal, promo code system, Stripe integration
