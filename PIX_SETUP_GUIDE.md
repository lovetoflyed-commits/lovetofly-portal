# PIX Payment Integration - Complete Setup Guide

## Overview
This guide walks you through setting up the complete PIX (Brazilian instant payment) integration for Love to Fly Portal. The system supports automatic payment confirmation for hangar bookings and membership upgrades.

## Architecture

```
User initiates payment
        ↓
POST /api/payments/pix/create
        ↓
Generate BRCode + QR Code
        ↓
User scans with banking app
        ↓
Two parallel mechanisms:
├─ Webhook (Real-time): Asaas sends payment confirmation → /api/payments/pix/webhook
│  ├─ Updates pix_payments status → completed
│  ├─ Auto-confirms hangar booking OR
│  └─ Auto-activates membership upgrade
│
└─ Cron Reconciliation (Fallback): Every 1 minute → /api/payments/pix/reconcile
  ├─ Queries Asaas API for transaction list
   └─ Syncs any missed webhook notifications
```

## Database Schema

### `pix_payments` table
Stores all PIX payment requests and their status.

```sql
CREATE TABLE pix_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  order_type VARCHAR(50),  -- 'hangar_booking' or 'membership'
  order_id VARCHAR(100),   -- e.g., 'booking-123' or 'membership-pro'
  amount_cents INTEGER,    -- Amount in cents (500000 = R$ 5,000.00)
  status VARCHAR(20),      -- 'pending', 'completed', 'expired', 'failed', 'cancelled'
  transaction_id VARCHAR(100),  -- From Asaas webhook
  expires_at TIMESTAMP,    -- When QR code expires (30 min default)
  payment_date TIMESTAMP,  -- When payment was confirmed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Related tables
- `hangar_bookings` - Payment linked via `pix_payment_id`
- `pending_membership_upgrades` - Status updated to 'completed' on payment confirmation
- `user_memberships` - Auto-upgraded when related payment completes

## Setup Steps

### 1. Environment Variables

Copy variables from `.env.pix.example` to your `.env.local`:

```bash
cp .env.pix.example .env.local
```

Generate secure secrets:
```bash
# Webhook access token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Reconciliation cron secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env.local`:
```
PIX_WEBHOOK_SECRET=<your-generated-secret>
PIX_RECONCILE_SECRET=<your-generated-secret>
PIX_KEY=your-pix-key@yourbank.com
ASAAS_SANDBOX_API_KEY=<from-asaas>
ASAAS_SANDBOX_API_BASE_URL=https://api-sandbox.asaas.com
ASAAS_PRODUCTION_API_BASE_URL=https://api.asaas.com
ASAAS_WALLET_ID=<asaas-wallet-id>
```

### 2. Database Verification

```bash
npm run migrate:up
```

Verify tables exist:
```sql
SELECT * FROM pix_payments LIMIT 0;
SELECT * FROM hangar_bookings LIMIT 0;
SELECT * FROM pending_membership_upgrades LIMIT 0;
```

### 3. Asaas Sandbox Setup

Contact Asaas support with:
- Webhook endpoint: `https://yourapp.com/api/payments/pix/webhook`
- Webhook token (sent in `asaas-access-token`): use your `PIX_WEBHOOK_SECRET`
- Request Sandbox API credentials

### 4. API Endpoints

All endpoints documented in `openapi.json`. Key ones:

#### Create Payment
```bash
curl -X POST http://localhost:3000/api/payments/pix/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "membership",
    "orderId": "membership-pro",
    "amountCents": 50000,
    "description": "Upgrade to PRO"
  }'
```

**Response:**
```json
{
  "id": 1,
  "order_id": "membership-pro",
  "amount": {
    "cents": 50000,
    "formatted": "R$ 500,00"
  },
  "brCode": {
    "qrCode": "data:image/png;base64,...",
    "brCode": "00020126360014br.gov.bcb.brcode...",
    "txId": "membership-pro",
    "expiresAt": "2026-02-18T14:35:00Z"
  },
  "expires_at": "2026-02-18T14:35:00Z"
}
```

#### Check Payment Status
```bash
curl http://localhost:3000/api/payments/pix/status/membership-pro \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "id": 1,
  "order_id": "membership-pro",
  "status": "pending",
  "amount": {
    "cents": 50000,
    "formatted": "R$ 500,00"
  },
  "expires_at": "2026-02-18T14:35:00Z",
  "payment_date": null
}
```

### 5. Frontend Integration

#### Membership Upgrade Payment
Route: `/user/membership/pix-payment`

Query parameters:
- `plan` - Plan code (e.g., 'pro', 'premium')
- `amount` - Amount in cents

Example URL:
```
/user/membership/pix-payment?plan=pro&amount=50000
```

#### Booking Payment
Route: `/user/bookings/pix-payment`

Query parameters:
- `booking_id` - Booking ID
- `amount` - Amount in cents

Example URL:
```
/user/bookings/pix-payment?booking_id=123&amount=150000
```

### 6. Webhook Handler

Asaas sends POST to `/api/payments/pix/webhook` with header:

```
asaas-access-token: <PIX_WEBHOOK_SECRET>
```

Payload example:
```json
{
  "transactionId": "12345678-1234-1234-1234-123456789012",
  "status": "paid",
  "amount": 500.00,
  "payer": {
    "name": "John Doe",
    "cpf": "12345678900"
  },
  "timestamp": "2026-02-18T14:05:00Z"
}
```

Handler automatically:
- Updates `pix_payments` status to 'completed'
- Sets `transaction_id` from webhook
- Auto-confirms hangar bookings
- Auto-activates membership upgrades

### 7. Cron Reconciliation

Set up cron job to call reconciliation endpoint every minute:

**Using EasyCron:**
```
https://easycron.com/
Interval: Every minute
URL: https://lovetofly.com/api/payments/pix/reconcile
Headers: x-cron-secret: <your-PIX_RECONCILE_SECRET>
```

**Using Vercel Cron (if deployed there):**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/payments/pix/reconcile",
      "schedule": "* * * * *"
    }
  ]
}
```

**Using GitHub Actions:**
```yaml
name: PIX Reconciliation
on:
  schedule:
    - cron: '*/1 * * * *'
jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://lovetofly.com/api/payments/pix/reconcile \
            -H "x-cron-secret: ${{ secrets.PIX_RECONCILE_SECRET }}"
```

### 8. Admin Tools

**Manual Reconciliation (Admin only):**
```bash
curl -X POST http://localhost:3000/api/admin/pix-reconcile \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "confirmPendingBookings": true }'
```

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Asaas sandbox account created
- [ ] Webhook endpoint registered with Asaas
- [ ] Create payment returns BRCode + QR code
- [ ] Status endpoint reflects payment status
- [ ] Manual webhook test triggers booking confirmation
- [ ] Manual webhook test triggers membership upgrade
- [ ] Cron job runs successfully every minute
- [ ] Frontend payment pages display QR code
- [ ] QR code scanning works in banking app
- [ ] Payment confirmation updates UI in real-time
- [ ] Expired payments marked as 'expired' correctly
- [ ] Admin reconciliation tool works

## Troubleshooting

### Webhook not triggering
- Check `PIX_WEBHOOK_SECRET` matches the token configured in Asaas (header `asaas-access-token`)
- Verify webhook endpoint is accessible from internet
- Check server logs: `grep "[PIX Webhook]" logs/*`

### Status endpoint returns 404
- Ensure `order_id` format matches creation (e.g., 'booking-123')
- Verify user is authenticated (Bearer token valid)
- Check token belongs to payment creator's user account

### QR code not displaying
- Ensure `PIX_KEY` environment variable is set
- Check `generateBRCode()` function in `pixUtils.ts`
- Verify no JavaScript errors in browser console

### Payments not auto-confirming
- Check webhook handler logs
- Verify payment status updated to 'completed'
- Run manual reconciliation: `/api/admin/pix-reconcile`
- Check membership plan code matches between tables

### Cron job not running
- Verify cron service is active and has internet access
- Test endpoint manually to ensure it responds
- Check `PIX_RECONCILE_SECRET` header is correct
- Review server logs for cron execution

## File Structure

```
/src
  /app
    /api
      /payments/pix/
        /create/route.ts           ← Payment creation endpoint
        /status/[orderId]/route.ts ← Status polling endpoint
        /webhook/route.ts          ← Asaas webhook receiver
        /reconcile/route.ts        ← Cron reconciliation
    /admin
      /pix-reconcile/route.ts      ← Admin reconciliation tool
    /user
      /membership/pix-payment/     ← Membership payment UI
      /bookings/pix-payment/       ← Booking payment UI
  /utils
    /pixUtils.ts                   ← BRCode/QR generation
    /membershipUtils.ts            ← Membership management
/migrations
  /114_add_pix_payment_system.sql ← PIX tables
openapi.json                        ← API documentation
.env.pix.example                    ← Environment template
```

## Security Considerations

1. **Webhook Token Verification** - All webhooks validated via `asaas-access-token`
2. **Order ID Validation** - Orders can only be confirmed if order_id matches database
3. **User Isolation** - Users can only view their own payment status
4. **Idempotency** - Webhook handlers are idempotent (safe to retry)
5. **Expiration** - QR codes expire after 30 minutes (configurable)
6. **Rate Limiting** - Consider adding rate limits to create endpoint

## Next Steps

1. Get Asaas sandbox credentials
2. Register webhook endpoint with Asaas
3. Test full flow in sandbox
4. Start small: Test with 1-2 test transactions
5. Move to production Asaas credentials when ready
6. Set up production cron job
7. Monitor logs and error rates

## Support Contacts

- Asaas Support: use your Asaas account support channel
- Love to Fly Team: support@lovetofly.com
