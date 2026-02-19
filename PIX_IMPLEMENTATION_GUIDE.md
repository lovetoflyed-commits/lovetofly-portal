# PIX Payment Integration Guide

## Overview

This document describes the complete PIX payment integration for the Love to Fly portal. PIX is Brazil's instant payment system (Pix - Pagamento Instantâneo) operated by Banco Central do Brasil.

## Architecture

### Components

1. **Database Schema** (`migrations/115_create_pix_payment_system.sql`)
   - `pix_keys`: Stores merchant PIX account details
   - `pix_payments`: Tracks all PIX transactions
   - `pix_webhook_logs`: Audit trail for webhooks

2. **Backend Utilities** (`utils/pixUtils.ts`)
   - BRCode generation (EMV QR Code standard)
   - Payment tracking
   - PIX key validation

3. **API Endpoints**
   - `POST /api/payments/pix`: Generate PIX payment QR code
   - `GET /api/payments/pix?paymentId=X`: Check payment status
   - `POST /api/admin/pix/keys`: Create PIX key (Admin)
   - `DELETE /api/admin/pix/keys/[id]`: Delete PIX key (Admin)
   - `PATCH /api/admin/pix/keys/[id]/toggle`: Toggle PIX key active status (Admin)

4. **UI Components**
   - `PIXPaymentComponent`: Display QR code and payment details
   - `PIXConfigAdmin`: Admin panel for managing PIX keys

## Setup Instructions

### 1. Database Migration

Run the migration to create PIX tables:

```bash
npm run migrate:up
```

This creates:
- `pix_keys` table (merchant account storage)
- `pix_payments` table (transaction tracking)
- `pix_webhook_logs` table (webhook audit)
- New `payment_method` enum type
- New columns in `memberships` and `hangar_bookings` tables

### 2. Admin Configuration

1. Go to Admin Dashboard → PIX Configuration
2. Click "Add PIX Key"
3. Select PIX Key Type:
   - **CPF**: Individual taxpayer (11 digits or formatted as 000.000.000-00)
   - **CNPJ**: Business taxpayer (14 digits or formatted as 00.000.000/0000-00)
   - **Email**: Email address registered with Banco Central
   - **Phone**: Phone number registered with Banco Central
   - **Random Key**: 32-character alphanumeric key for privacy

4. Enter your PIX Key
5. Enter Account Holder Name
6. (Optional) Enter Bank Name
7. Save

Once created, the PIX key is immediately active and ready for use.

## Usage Guide

### For Users (Payment)

1. **Select PIX as Payment Method**
   ```tsx
   <PIXPaymentComponent
     orderId="membership-123"
     orderType="membership"
     amountCents={99900} // R$ 999.00
     description="Premium Membership"
     onPaymentComplete={(paymentId, transactionId) => {
       // Payment confirmed - activate membership
     }}
   />
   ```

2. **User Workflow**
   - Component displays QR code
   - User scans with banking app or copies BRCode
   - User confirms payment details in bank app
   - System auto-detects payment completion
   - Membership/booking activated

### For Developers (Integration)

#### Generate PIX Payment

```typescript
const response = await fetch('/api/payments/pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'membership-123',
    orderType: 'membership',
    amountCents: 99900,
    description: 'Premium Membership'
  })
});

const data = await response.json();
// Returns: { paymentId, brCode, qrCodeUrl, amount, expiresAt, pixKey }
```

#### Check Payment Status

```typescript
const response = await fetch(`/api/payments/pix?paymentId=${paymentId}`);
const data = await response.json();
// Returns: { status, transactionId, ... }
```

#### Integrate into Membership Upgrade

In `src/app/api/user/membership/upgrade/route.ts`:

```typescript
// Add to POST handler
const paymentMethod = body.paymentMethod || 'stripe'; // 'stripe' or 'pix'

if (paymentMethod === 'pix') {
  // Generate PIX payment
  const pixPayment = await createPIXPayment({
    userId: user.id,
    orderId: `membership-${membership.id}`,
    orderType: 'membership',
    amountCents: Math.floor(plan.price_usd * 100 * exchangeRate),
    description: `${plan.name} - ${user.email}`
  }, organizationId);
  
  // Return PIX payment data instead of Stripe URL
  return NextResponse.json({
    paymentUrl: `/membership/pay/${pixPayment.id}`,
    paymentMethod: 'pix',
    paymentId: pixPayment.id
  });
}
```

## BRCode Standard

The system generates BRCodes according to Banco Central do Brasil specifications (EMV QR Code ISO/IEC 18004).

### BRCode Structure

```
Format Indicator (00)
PIX Key Information (26)
Amount (54) [optional]
Currency Code (5903) = 986 (BRL)
Country Code (5891) = BR
Reference Label (62) [optional - max 72 chars]
CRC16 Checksum (6304)
```

### Example BRCode

```
00020126580014br.gov.bcb.pix...
(raw BRCode string)
```

### QR Code Display

- **Desktop**: Show QR code image, allow copy of BRCode text
- **Mobile**: Allow copy of BRCode, user opens banking app
- **Auto-Refresh**: Check payment status every 8 seconds
- **Expiration**: QR codes expire after 15 minutes

## Payment Flow

### Timeline

1. **User initiates payment** (T+0)
   - Payment component renders
   - BRCode generated
   - Expires in 15 minutes

2. **User scans QR** (T+0-15min)
   - User opens banking app
   - Scans QR code or enters BRCode
   - Reviews payment details
   - Confirms transaction

3. **Payment sent** (T+0-15min)
   - Banking app sends payment
   - PIX network processes (usually < 30 seconds)

4. **Payment received** (T+0-30sec)
   - Funds arrive in your account
   - System auto-detects via status polling
   - Membership/booking activated

5. **Confirmation** (T+0-5min)
   - User sees success message
   - Email confirmation sent
   - Dashboard updated

### Status Values

- **pending**: QR code generated, awaiting payment
- **completed**: Payment received and verified
- **expired**: QR code expired (15 minutes)
- **cancelled**: User cancelled transaction
- **refunded**: Payment was refunded

## Payment Verification

### Automatic Detection

The `PIXPaymentComponent` automatically polls payment status every 8 seconds. When status changes to "completed", the `onPaymentComplete` callback fires.

### Manual Verification (Optional)

For additional security, you can verify payments via:

1. **Banco Central's PIX Webhook APIs** (requires bank integration)
2. **Manual bank statement reconciliation**
3. **Transaction ID matching** (stored in `pix_payments.transaction_id`)

## Security Considerations

### Data Protection

1. **PIX Keys Storage**
   - Stored in encrypted PostgreSQL database
   - Access restricted to admin users
   - No PIX key transmission in responses to users

2. **Transaction Data**
   - All transactions logged with timestamps
   - Webhook events audited in `pix_webhook_logs`
   - User IDs linked for reconciliation

3. **QR Code Expiration**
   - Dynamic codes expire after 15 minutes
   - Prevents accidental/malicious use of old codes
   - User must regenerate for retry

### Fraud Prevention

1. **Amount Verification**
   - System verifies paid amount matches expected amount
   - Exact cent matching prevents underpayment

2. **User Verification**
   - Payment linked to authenticated user
   - PIX transaction must match order details
   - Admin audit trail maintained

3. **PIX Key Rotation**
   - Can deactivate old PIX keys
   - Switch to new key without disrupting active payments
   - Only active keys used for new payments

## Integration Checklist

- [ ] Run migration: `npm run migrate:up`
- [ ] Configure PIX key in Admin Dashboard
- [ ] Test: Generate PIX payment code
- [ ] Test: Complete test payment
- [ ] Add PIX payment option to membership upgrade
- [ ] Add PIX payment option to hangar booking checkout
- [ ] Add PIX option to classifieds checkout
- [ ] Update payment documentation
- [ ] Train support team on PIX payments
- [ ] Monitor webhook logs in admin panel
- [ ] Set up bank account monitoring

## Testing

### Development Testing

1. **Generate Test QR Code**
   ```bash
   curl -X POST http://localhost:3000/api/payments/pix \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "test-123",
       "orderType": "membership",
       "amountCents": 10000,
       "description": "Test Payment"
     }'
   ```

2. **Check Status**
   ```bash
   curl http://localhost:3000/api/payments/pix?paymentId=1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Production Testing

1. Use small test amounts (R$ 1.00)
2. Test with different PIX key types
3. Test QR code scanning on mobile
4. Test manual BRCode entry
5. Test payment expiration
6. Monitor transaction logs

## Troubleshooting

### "No active PIX key configured"

- **Cause**: No PIX key set to active in admin panel
- **Solution**: Go to Admin → PIX Configuration → Add or activate a PIX key

### QR Code not generating

- **Cause**: Invalid PIX key format or database issue
- **Solution**: Verify PIX key format matches selected type (CPF must be 11 digits, etc.)

### Payment not detecting completion

- **Cause**: Webhook integration not set up, or polling disabled
- **Solution**: Keep `autoRefresh` enabled in component. For production, add Asaas webhook coverage.

### "Invalid PIX key format"

- **Valid CPF**: `12345678901` or `123.456.789-01`
- **Valid CNPJ**: `12345678901234` or `12.345.678/0001-23`
- **Valid Email**: `user@domain.com`
- **Valid Phone**: `+5511999999999`
- **Valid Random**: 32-character alphanumeric string

## Advanced Configuration

### Custom QR Code Image Service

The component uses `qr-server.com` by default. To use a different service:

```typescript
// In pixUtils.ts
export function generateQRCodeImageURL(brCode: string, size: number = 300): string {
  // Replace with your QR code service
  return `your-service.com/generate?data=${encodeURIComponent(brCode)}&size=${size}`;
}
```

### Database Archival

For audit purposes, archive old PIX payment records:

```sql
-- Archive payments older than 1 year
INSERT INTO pix_payments_archive
SELECT * FROM pix_payments 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete archived payments
DELETE FROM pix_payments 
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Webhook Integration (Future)

When ready to expand Asaas webhook coverage:

1. Configure webhook endpoint in Asaas
2. Handle incoming webhook events in `/api/payments/pix/webhook`
3. Verify webhook token with `asaas-access-token`
4. Update payment status based on webhook data
5. Log all webhook events in `pix_webhook_logs`

## Support & Monitoring

### Admin Dashboard Stats

Add to admin dashboard:
```typescript
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END) / 100 as total_revenue
FROM pix_payments
WHERE DATE(created_at) = CURRENT_DATE;
```

### Common Issues Log

Regularly review `pix_webhook_logs` and `pix_payments` status to identify:
- Payments that failed to complete
- QR codes that expired without payment attempt
- Unusual payment patterns

## References

- [Banco Central do Brasil - PIX](https://www.bcb.gov.br/en/financialstability/pix_en)
- [PIX - Regulamentação](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [EMV QR Code Specification](https://www.emvco.com)
- [ISO/IEC 18004:2015 - QR Code](https://www.iso.org/standard/62021.html)

## Version History

- **v1.0** (2024-01-20): Initial PIX implementation
  - BRCode generation
  - QR code display
  - Payment tracking
  - Admin key management
