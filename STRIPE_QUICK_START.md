# 🚀 Stripe Integration - Quick Start

## What You Need

### 1. Stripe Account (Free)
- Sign up at https://stripe.com
- Verify email
- Add business details (can be test data)

### 2. Get API Keys

#### Option A: Dashboard (Web)
1. Go to https://dashboard.stripe.com/apikeys
2. Make sure you're in **Test Mode** (toggle top-right)
3. Copy **Publishable Key** (starts with `pk_test_`)
4. Copy **Secret Key** (starts with `sk_test_`)

#### Option B: Using Stripe CLI
```bash
# Install (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Get keys
stripe config --list
```

### 3. Get Webhook Secret (for local testing)

**Option A: CLI (Recommended - Automatic)**
```bash
stripe listen --forward-to localhost:3000/api/hangarshare/webhook/stripe
```
Copy the displayed signing secret: `whsec_...`

**Option B: Dashboard (Manual)**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/hangarshare/webhook/stripe`
4. Events: Search and add:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. View → Signing secret → Copy

---

## Setup (2 Minutes)

### Step 1: Update Environment
```bash
# Edit .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
```

### Step 2: Restart Dev Server
```bash
npm run dev
```

### Step 3: Open Application
```
http://localhost:3000
```

---

## Test Payment Flow

### 1. Search Hangars
```
http://localhost:3000/hangarshare
```

### 2. Select Dates & Book
- Select hangar
- Enter check-in: Jan 15
- Enter check-out: Jan 20
- Click "Confirmar Reserva"

### 3. Enter Test Card
- Card: `4242 4242 4242 4242`
- Expiry: `12/27`
- CVC: `123`
- Name: Anything

### 4. Click "Pagar"

### 5. See Success Page
- ✅ Payment processed
- ✅ Confirmation number shown
- ✅ Booking in database

---

## Test Different Scenarios

| Test | Card | Result |
|---|---|---|
| Success | 4242 4242 4242 4242 | ✅ Payment goes through |
| Decline | 4000 0000 0000 0002 | ❌ Card declined error |
| 3D Secure | 4000 0000 0000 3220 | 🔐 Authentication required |
| Mastercard | 5555 5555 5555 4444 | ✅ Payment goes through |

---

## Webhook Testing (Local)

### With Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/hangarshare/webhook/stripe
```

The terminal will show:
```
Ready! Your webhook signing secret is: whsec_test_secret...
Forwarding events to http://localhost:3000/api/hangarshare/webhook/stripe
```

Copy that `whsec_...` secret and add it to `.env.local`.

### Then test:
1. Make a payment
2. Webhook CLI will show: `event payment_intent.succeeded [evt_...]`
3. Check database: Booking should now have `status='confirmed'`

---

## Verify It's Working

### Database Check
```sql
-- Login to Neon console
SELECT * FROM bookings 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- - status: 'pending' (before webhook) → 'confirmed' (after webhook)
-- - stripe_payment_intent_id: pi_...
-- - stripe_charge_id: ch_... (after webhook)
-- - total_price: 4500.00
-- - created_at: Just now
```

### Stripe Dashboard Check
1. Go to https://dashboard.stripe.com/payments
2. Click on payment
3. Should show status: **Succeeded**
4. Card details visible
5. Amount in BRL currency

### Application Check
1. Success page shows confirmation number
2. Browser devtools → Network tab shows:
   - POST `/api/hangarshare/booking/confirm` → 200 OK
   - POST with Stripe.confirmCardPayment → success
3. No console errors

---

## Troubleshooting

### ❌ "No STRIPE_SECRET_KEY found"
- [ ] Check `.env.local` exists
- [ ] Verify `STRIPE_SECRET_KEY=sk_test_...` line (no spaces)
- [ ] Restart dev server: `npm run dev`

### ❌ "Error creating PaymentIntent"
- [ ] Verify `STRIPE_SECRET_KEY` is correct (matches dashboard)
- [ ] Check webhook hasn't already processed (look in Stripe dashboard)
- [ ] Verify amount > 0.50 USD (Stripe minimum)

### ❌ "Payment form not loading"
- [ ] Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (must be `pk_test_...`)
- [ ] Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- [ ] Check browser console for errors

### ❌ "Booking created but status stays 'pending'"
- [ ] Webhook not configured
- [ ] Check Stripe Dashboard → Webhooks → Recent events
- [ ] If no events: webhook not registered or URL wrong
- [ ] Use CLI: `stripe listen --forward-to ...` (easiest)

### ❌ "webhook signature verification failed"
- [ ] `STRIPE_WEBHOOK_SECRET` is wrong
- [ ] Get correct value from:
  - CLI output: `Your webhook signing secret is: whsec_...`
  - Or Dashboard → Webhooks → Click endpoint → Copy signing secret
- [ ] Make sure you copied the right secret (test vs live)

---

## Next: Production

### When Ready for Live:
1. Switch Stripe to **Live Mode** (toggle in dashboard)
2. Get **Live API Keys** (no longer start with `test`)
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
4. Deploy to production
5. Test with real cards (small amount like R$1)

⚠️ **Never commit API keys to git!** Keep in `.env.local` (in `.gitignore`)

---

## 30-Minute Checklist

- [ ] Created Stripe account (free)
- [ ] Copied test API keys (pk_test_, sk_test_)
- [ ] Updated `.env.local` with keys
- [ ] Restarted dev server: `npm run dev`
- [ ] Navigated to `/hangarshare`
- [ ] Searched and selected hangar
- [ ] Clicked "Confirmar Reserva"
- [ ] Entered test card 4242 4242 4242 4242
- [ ] Saw success page with confirmation number ✅
- [ ] Checked database for booking record
- [ ] Verified status='pending' or status='confirmed'

---

## Files Modified

```
✅ /src/app/api/hangarshare/booking/confirm/route.ts
✅ /src/app/api/hangarshare/webhook/stripe/route.ts
✅ /src/app/hangarshare/booking/checkout/page.tsx
✅ /src/app/hangarshare/booking/success/page.tsx
✅ /src/app/hangarshare/listing/[id]/page.tsx
✅ package.json (Stripe packages installed)
✅ .env.local (← YOU ADD API KEYS HERE)
```

---

## Need Help?

- Stripe Status: https://status.stripe.com
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing

**TL;DR:**
1. Add keys to `.env.local`
2. Restart server
3. Test with card `4242 4242 4242 4242`
4. Check success page and database

That's it! 🎉
