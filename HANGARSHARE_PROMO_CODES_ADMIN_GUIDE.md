# Quick Start: HangarShare Promo Codes for Admins

## Overview
Admins can now create and manage discount codes that customers can apply to HangarShare bookings. This guide covers the essentials.

## Creating Your First Promo Code

### Via API (curl)
```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME20",
    "description": "20% welcome discount for new customers",
    "discount_type": "percent",
    "discount_value": 20,
    "max_uses": 100,
    "valid_until": "2026-12-31T23:59:59Z"
  }'
```

### Via Admin Panel (Coming Soon)
Navigate to: `/admin/hangarshare/coupons`

## Code Types

### Percentage Discount
```json
{
  "code": "SUMMER50",
  "discount_type": "percent",
  "discount_value": 50
}
```
Effect: Customer saves 50% on booking subtotal

### Fixed Amount
```json
{
  "code": "FLAT50",
  "discount_type": "fixed",
  "discount_value": 50
}
```
Effect: Customer saves R$ 50 from booking subtotal

### Free Booking
```json
{
  "code": "FREE100",
  "discount_type": "free_booking",
  "discount_value": 100
}
```
Effect: Customer gets booking for free (100% off)

## Common Use Cases

### 1. Launch Promotion
```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAUNCH30",
    "description": "30% off - HangarShare Launch Special",
    "discount_type": "percent",
    "discount_value": 30,
    "max_uses": 500
  }'
```

### 2. Seasonal Promotion
```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WINTER25",
    "description": "25% off winter bookings (Jun-Aug)",
    "discount_type": "percent",
    "discount_value": 25,
    "max_uses": 300,
    "valid_until": "2026-08-31T23:59:59Z"
  }'
```

### 3. Event-Based Offer
```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AIRSHOW2026",
    "description": "R$ 100 off for bookings during Airshow week",
    "discount_type": "fixed",
    "discount_value": 100,
    "max_uses": 50,
    "valid_until": "2026-09-30T23:59:59Z"
  }'
```

### 4. Limited-Time Flash Sale
```bash
curl -X POST http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FLASHSALE",
    "description": "60% off - Flash Sale (24 hours)",
    "discount_type": "percent",
    "discount_value": 60,
    "max_uses": 100,
    "valid_until": "2026-02-19T23:59:59Z"
  }'
```

## Managing Codes

### List All Active Codes
```bash
curl http://localhost:3000/api/hangarshare/coupons \
  -H "Authorization: Bearer TOKEN"
```

### Search for Code
```bash
curl "http://localhost:3000/api/hangarshare/coupons?search=LAUNCH" \
  -H "Authorization: Bearer TOKEN"
```

### Update Code
```bash
curl -X PUT http://localhost:3000/api/hangarshare/coupons/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "max_uses": 200,
    "valid_until": "2026-03-31T23:59:59Z"
  }'
```

### Deactivate Code
```bash
curl -X PUT http://localhost:3000/api/hangarshare/coupons/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

## Tracking & Analytics

### View Redemptions
```sql
SELECT 
  c.code,
  COUNT(*) as redeemed,
  SUM(hb.discount_amount) as total_saved,
  SUM(hb.total_price) as revenue
FROM coupons c
LEFT JOIN hangar_bookings hb ON hb.promo_code = c.code
GROUP BY c.code
ORDER BY redeemed DESC;
```

### Most Popular Codes
```sql
SELECT 
  c.code,
  COUNT(*) as usage_count,
  c.max_uses - COUNT(*) as remaining
FROM coupon_redemptions cr
JOIN coupons c ON c.id = cr.coupon_id
GROUP BY c.id
ORDER BY usage_count DESC;
```

### Revenue Impact
```sql
SELECT 
  c.code,
  c.discount_type,
  c.discount_value,
  COUNT(*) as bookings,
  SUM(hb.discount_amount) as total_discount,
  SUM(hb.subtotal) as gross_revenue,
  SUM(hb.total_price) as net_revenue
FROM coupons c
LEFT JOIN hangar_bookings hb ON hb.promo_code = c.code
GROUP BY c.id;
```

## Best Practices

### ✅ DO
- Set clear expiration dates
- Use meaningful code names (e.g., LAUNCH30, not XYZ123)
- Set reasonable max usage limits
- Test codes before promotion
- Monitor redemption rates

### ❌ DON'T
- Create unlimited codes
- Set extremely high discount percentages
- Leave codes active indefinitely
- Stack multiple codes (not supported yet)
- Create duplicate codes

## Testing Codes

### As Admin
1. Create test code with high discount
2. Go to HangarShare listing
3. Try booking with test code
4. Verify discount applies
5. Confirm payment shows discounted amount

### Troubleshooting
- **Code not working?** Check `valid_until` date
- **Wrong discount?** Verify `discount_type` and `discount_value`
- **Can't create code?** Verify admin token is valid
- **Code limits reached?** Increase `max_uses` or create new code

## Token Format

Your admin bearer token should look like:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "coupon": {
      "id": 1,
      "code": "WELCOME20",
      "description": "20% welcome discount",
      "discount_type": "percent",
      "discount_value": 20,
      "max_uses": 100,
      "used_count": 0,
      "is_active": true,
      "created_at": "2026-02-18T10:00:00Z"
    }
  }
}
```

### Error Responses
```json
{
  "success": false,
  "error": "Código já existe"
}
```

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Webhook Notifications (Future)

When ready, we'll add:
- Email to admin when code limit reached
- Alerts for popular codes
- Reports on code effectiveness

## FAQ

**Q: Can customers stack multiple codes?**
A: Not yet. Currently one code per booking.

**Q: What happens if a code expires?**
A: It automatically becomes invalid. Customers get "Code expired" error.

**Q: How long does discount tracking take?**
A: Instant. Tracked in real-time via `coupon_redemptions` table.

**Q: Can I track which customer used which code?**
A: Yes! Check `coupon_redemptions` table with user_id.

**Q: Can I give different codes to different customer segments?**
A: Coming soon with customer eligibility rules.

---

**Need Help?** Check `HANGARSHARE_PROMO_CODES_GUIDE.md` for complete documentation.
