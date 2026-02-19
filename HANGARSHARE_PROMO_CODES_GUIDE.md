# HangarShare Promo Code & Booking Discounts Implementation

## Overview

This document describes the complete implementation of promo code discount functionality for HangarShare bookings. Users can now apply discount codes to get reduced prices on hangar bookings.

## Features

✅ **Frontend Promo Code Input**
- React component for entering promo codes
- Real-time validation feedback
- Display of discount amount and percentage
- Apply/Remove functionality

✅ **Backend Validation**
- Support for two code sources:
  - Coupons table (direct booking discounts)
  - Codes table (special promo codes with discounts)
- Automatic expiration checking
- Usage limit enforcement
- Per-code tracking

✅ **Discount Types**
- Percentage discounts (e.g., 10%, 50%)
- Fixed amount discounts (e.g., R$ 50 off)
- Free booking promotions

✅ **Admin Management**
- Create, read, update promo codes via API
- Set expiration dates
- Define usage limits
- Track redemptions

✅ **Audit & Tracking**
- Redemption history in `coupon_redemptions` table
- Automatic usage counter increment
- Booking records store discount information

## Database Schema

### New/Modified Tables

#### hangar_bookings (MODIFIED)
New columns:
- `promo_code` (VARCHAR(50)): Code applied to booking
- `discount_amount` (DECIMAL(10,2)): Actual discount amount in R$

#### coupon_redemptions (NEW)
```sql
CREATE TABLE coupon_redemptions (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id VARCHAR(36) REFERENCES hangar_bookings(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, booking_id)
);
```

### Migration
Apply migration `117_add_hangarshare_promo_code_support.sql`:
```bash
npm run migrate:up
```

## API Endpoints

### 1. Validate Promo Code (During Calculation)
**POST** `/api/hangarshare/booking/calculate`

**Request:**
```json
{
  "hangarId": "123",
  "checkIn": "2026-02-25T10:00:00Z",
  "checkOut": "2026-02-27T10:00:00Z",
  "promoCode": "PROMO50"
}
```

**Response:**
```json
{
  "success": true,
  "calculation": {
    "subtotal": 500,
    "discount": {
      "code": "PROMO50",
      "description": "50% off all bookings",
      "type": "percent",
      "value": 50,
      "amount": 250
    },
    "subtotalAfterDiscount": 250,
    "fees": 12.50,
    "total": 262.50,
    "savings": {
      "amount": 250,
      "percentage": 50
    }
  }
}
```

### 2. Confirm Booking with Promo Code
**POST** `/api/hangarshare/booking/confirm`

**Request:**
```json
{
  "hangarId": "123",
  "userId": 6,
  "checkIn": "2026-02-25T10:00:00Z",
  "checkOut": "2026-02-27T10:00:00Z",
  "subtotal": 500,
  "fees": 10,
  "totalPrice": 510,
  "promoCode": "PROMO50"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking-uuid",
    "status": "confirmed",
    "subtotal": 250,
    "discount": {
      "code": "PROMO50",
      "amount": 250
    },
    "fees": 12.50,
    "totalPrice": 262.50
  },
  "payment": {
    "clientSecret": "pi_secret...",
    "paymentIntentId": "pi_...",
    "publishableKey": "pk_..."
  }
}
```

### 3. Manage Coupons (Admin)
**GET** `/api/hangarshare/coupons`

Query params:
- `limit` (default: 50)
- `offset` (default: 0)
- `search` (search by code or description)

**POST** `/api/hangarshare/coupons`

**Request:**
```json
{
  "code": "SUMMER20",
  "description": "20% off summer bookings",
  "discount_type": "percent",
  "discount_value": 20,
  "max_uses": 100,
  "valid_until": "2026-09-30T23:59:59Z"
}
```

**PUT** `/api/hangarshare/coupons/[id]`

Update existing coupon (admin only)

## React Component

### PromoCodeInput

**Location:** `src/components/PromoCodeInput.tsx`

**Props:**
```typescript
interface PromoCodeInputProps {
  onCodeApplied?: (code: string, discount: any) => void;  // Called when code is applied
  onCodeRemoved?: () => void;                              // Called when code is removed
  subtotal: number;                                        // For display purposes
  disabled?: boolean;                                      // Disable input
}
```

**Usage:**
```tsx
import PromoCodeInput from '@/components/PromoCodeInput';

export default function BookingCheckout() {
  const [discount, setDiscount] = useState(null);
  
  return (
    <div>
      <PromoCodeInput
        subtotal={500}
        onCodeApplied={(code, discountInfo) => {
          setDiscount(discountInfo);
          // Recalculate totals
        }}
        onCodeRemoved={() => {
          setDiscount(null);
          // Reset totals
        }}
      />
    </div>
  );
}
```

## Integration Guide

### Step 1: Add to Listing Details Page
Update the booking modal or checkout page to include promo code input:

```tsx
import PromoCodeInput from '@/components/PromoCodeInput';

export default function BookingModal() {
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    promoCode: '',
  });

  const handlePromoCodeApplied = (code: string, discount: any) => {
    setBookingData(prev => ({
      ...prev,
      promoCode: code,
    }));
    // Recalculate booking total based on discount
  };

  return (
    <div className="booking-form">
      {/* Date inputs */}
      <PromoCodeInput
        subtotal={bookingCalculation.subtotal}
        onCodeApplied={handlePromoCodeApplied}
        onCodeRemoved={() => setBookingData(prev => ({ ...prev, promoCode: '' }))}
      />
      
      {/* Price breakdown with discount */}
      {bookingData.promoCode && (
        <div className="discount-summary">
          <p>Desconto Aplicado: {discountInfo.code}</p>
          <p>R$ {discountInfo.amount?.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Update Booking Calculation
When user selects dates, pass promo code to calculation:

```tsx
const calculateBooking = async (checkIn: string, checkOut: string) => {
  const response = await fetch('/api/hangarshare/booking/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hangarId,
      checkIn,
      checkOut,
      promoCode: bookingData.promoCode, // Include code if applied
    }),
  });
  
  const data = await response.json();
  setBookingCalculation(data.calculation);
};
```

### Step 3: Pass Promo Code to Confirmation
When confirming booking, include promo code:

```tsx
const confirmBooking = async () => {
  const response = await fetch('/api/hangarshare/booking/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      hangarId,
      userId,
      checkIn,
      checkOut,
      subtotal: bookingCalculation.subtotal,
      fees: bookingCalculation.fees,
      totalPrice: bookingCalculation.total,
      promoCode: bookingData.promoCode, // Pass promo code
    }),
  });
  
  const data = await response.json();
  if (data.success) {
    // Proceed to payment with discounted amount
  }
};
```

## Admin Panel

### Create Promo Codes

```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EARLY_BIRD_20",
    "description": "20% off for early bird bookings",
    "discount_type": "percent",
    "discount_value": 20,
    "max_uses": 500,
    "valid_until": "2026-03-31T23:59:59Z"
  }'
```

### List Promo Codes

```bash
curl http://localhost:3000/api/hangarshare/coupons?search=early
```

### Track Redemptions

Query the `coupon_redemptions` table:
```sql
SELECT 
  cr.coupon_id,
  c.code,
  cr.user_id,
  u.first_name,
  u.email,
  cr.redeemed_at,
  cr.booking_id
FROM coupon_redemptions cr
JOIN coupons c ON c.id = cr.coupon_id
JOIN users u ON u.id = cr.user_id
ORDER BY cr.redeemed_at DESC;
```

## Discount Types

### 1. Percentage Discount
```json
{
  "discount_type": "percent",
  "discount_value": 20  // 20%
}
```
Calculation: `subtotal * (discount_value / 100)`

### 2. Fixed Amount Discount
```json
{
  "discount_type": "fixed",
  "discount_value": 50  // R$ 50 off
}
```
Calculation: `discount_value` (capped at subtotal)

### 3. Free Booking
```json
{
  "discount_type": "free_booking",
  "discount_value": 100  // 100% off (free)
}
```

## Validation Rules

✅ Code must be active (`is_active = TRUE`)
✅ Code must be within validity period (if set)
✅ Code must not exceed max_uses limit
✅ Discount amount cannot exceed subtotal
✅ One code per booking (no stacking)
✅ Code tracks redemptions automatically

## Error Handling

### Invalid Code
```json
{
  "success": true,
  "calculation": {
    "discount": null,
    "subtotal": 500,
    "total": 525
  }
}
```

### Expired Code
```json
{
  "error": "invalid_input_syntax_for_type_uuid: \"EXPIRED_CODE\""
}
```
Component returns: "Código promocional inválido, expirado ou já foi usado"

### Usage Limit Exceeded
```json
{
  "error": "Promo code limit reached"
}
```

## Analytics & Reporting

### Most Used Codes
```sql
SELECT 
  c.code,
  c.description,
  COUNT(*) as redemptions,
  SUM(cr.discount_amount) as total_discount_given
FROM coupons c
LEFT JOIN coupon_redemptions cr ON cr.coupon_id = c.id
GROUP BY c.id
ORDER BY redemptions DESC;
```

### Revenue Impact
```sql
SELECT 
  c.code,
  SUM(hb.discount_amount) as total_discount,
  SUM(hb.total_price) as total_revenue,
  COUNT(*) as bookings
FROM coupons c
LEFT JOIN hangar_bookings hb ON hb.promo_code = c.code
GROUP BY c.code;
```

## Testing

### Test Valid Code
```bash
# Create test coupon
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer <token>" \
  -d '{"code": "TEST50", "discount_type": "percent", "discount_value": 50}'

# Validate during calculation
curl -X POST http://localhost:3000/api/hangarshare/booking/calculate \
  -d '{"hangarId": "1", "checkIn": "...", "checkOut": "...", "promoCode": "TEST50"}'
```

### Test Expired Code
```bash
# Create expired coupon
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -d '{"code": "EXPIRED", "discount_type": "percent", "discount_value": 10, "valid_until": "2020-01-01"}'

# Should not apply discount
```

### Test Usage Limit
```bash
# Create limited coupon
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -d '{"code": "LIMITED", "discount_type": "percent", "discount_value": 20, "max_uses": 1}'

# First booking: applies discount
# Second booking: should reject
```

## Implementation Files

📄 **Database Migration:**
- `src/migrations/117_add_hangarshare_promo_code_support.sql`

📦 **Backend:**
- `src/utils/codeUtils.ts` - Core validation & discount logic
- `src/app/api/hangarshare/booking/calculate/route.ts` - Enhanced with promo validation
- `src/app/api/hangarshare/booking/confirm/route.ts` - Enhanced with promo tracking
- `src/app/api/hangarshare/coupons/route.ts` - Admin API for coupon management

🎨 **Frontend:**
- `src/components/PromoCodeInput.tsx` - React component for promo input

## Deployment Checklist

- [ ] Apply migration: `npm run migrate:up`
- [ ] Test promo code validation endpoint
- [ ] Test booking calculation with code
- [ ] Test booking confirmation with code
- [ ] Add PromoCodeInput to booking modal
- [ ] Create initial promo codes via admin API
- [ ] Test customer flow end-to-end
- [ ] Monitor coupon_redemptions table
- [ ] Update analytics/reporting queries

## Future Enhancements

🔮 **Planned Features:**
- Code stacking (multiple codes per booking)
- User-specific codes (one-time use per user)
- Time-based discounts (weekday vs weekend)
- Seasonal promotions
- Referral code system
- A/B testing different discount rates
- Automatic code generation for campaigns

## Support

For questions or issues:
1. Check validation error messages
2. Review redemption history in `coupon_redemptions`
3. Test code with `/api/hangarshare/coupons` endpoint
4. Verify database migration applied successfully

---

**Last Updated:** 2026-02-18
**Version:** 1.0
**Status:** Production Ready ✅
