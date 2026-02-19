# Quick Reference: Using Codes with Membership System

## Available Test Codes

### 1. Invitation Code (Testing Only)
- **Code:** `LTFTESTINVITE001`
- **Type:** Invitation
- **Hint:** LFTTEST
- **Effect:** No discount, no upgrade
- **Use Case:** Track user referrals
- **Limit:** 100 uses

### 2. 20% Savings Code
- **Code:** `CPNSAVE202026`
- **Type:** Promotional
- **Hint:** CPNSAVE
- **Effect:** 20% discount on any plan subscription
- **Valid Until:** 90 days from today
- **Limit:** 500 uses
- **Use Case:** Promotional campaign

### 3. Premium Tier Upgrade
- **Code:** `CPNPREMIUMTRIAL`
- **Type:** Promotional
- **Hint:** CPNPREM
- **Effect:** Automatic upgrade to Premium tier (instead of selected plan)
- **Valid Until:** 60 days from today
- **Limit:** 50 uses
- **Use Case:** Limited time premium trial

### 4. Team Discount (Domain Restricted)
- **Code:** `CPNTEAMAIRACADEMY`
- **Type:** Promotional
- **Hint:** CPNTEAM
- **Effect:** 30% discount + Standard tier (only for @airlineacademy.com)
- **Eligible emails:** Must end with @airlineacademy.com
- **Valid Until:** 180 days from today
- **Limit:** 100 uses
- **Use Case:** Corporate/partner discounts

## How to Use

### During Registration
1. Fill out registration form
2. Select desired membership plan
3. Enter promotional code (optional)
4. Code validation happens real-time
5. Benefits display immediately
6. Submit registration

### When Upgrading Membership
1. Go to profile → membership settings
2. Select new plan
3. Optionally enter code
4. Review benefits
5. Complete payment/change

## Testing Flow

### Test Registration with Code
```bash
Visit: http://localhost:3000
Tab: Register
Steps:
  1. Fill basic info
  2. Select "Standard" plan
  3. Enter code: CPNSAVE202026
  4. See "✓ Código válido: Desconto aplicável"
  5. Complete registration
Result: User created on Standard with 20% discount noted
```

### Test Code That Upgrades Plan
```bash
Steps:
  1. Fill basic info
  2. Select "Standard" plan
  3. Enter code: CPNPREMIUMTRIAL
  4. See "✓ Código válido: Upgrade para premium"
  5. Notice plan changed to Premium
  6. Complete registration
Result: User created on Premium (code overrode selection)
```

### Test Domain-Restricted Code
```bash
Case 1 - Invalid domain:
  Email: user@company.com
  Code: CPNTEAMAIRACADEMY
  Result: "You are not eligible for this code"

Case 2 - Valid domain:
  Email: john@airlineacademy.com
  Code: CPNTEAMAIRACADEMY
  Result: "✓ Código válido: Desconto aplicável"
```

## API Testing

### Validate Code via API
```bash
curl -X POST http://localhost:3000/api/codes/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CPNSAVE202026",
    "userEmail": "test@example.com"
  }'

# Response:
{
  "message": "Code valid.",
  "data": {
    "codeType": "promo",
    "discountType": "percent",
    "discountValue": "20.00",
    "membershipPlanCode": null
  }
}
```

### Register with Code via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@test.com",
    "password": "SecurePass123!",
    "membershipPlan": "standard",
    "invitationCode": "CPNSAVE202026",
    "userType": "individual",
    ... other fields ...
  }'
```

## Membership Plans Available

| Plan | Monthly | Annual | Users | Projects | Storage | Support |
|------|---------|--------|-------|----------|---------|---------|
| Free | R$ 0 | R$ 0 | 1 | 3 | 1 GB | None |
| Standard | R$ 9.99 | R$ 99.99 | 1 | 10 | 10 GB | Email |
| Premium | R$ 29.99 | R$ 299.99 | 5 | 50 | 100 GB | Priority |
| Pro | R$ 99.99 | R$ 999.99 | ∞ | ∞ | 1 TB | Dedicated |

## Code Status Dashboard

To check code usage in database:
```sql
-- See all test codes
SELECT code_hint, code_type, used_count, max_uses, valid_until 
FROM codes 
WHERE code_hint IN ('LFTTEST', 'CPNSAVE', 'CPNPREM', 'CPNTEAM');

-- See code applications
SELECT 
  uc.user_id, 
  u.email,
  c.code_hint,
  uc.membership_upgrade_to,
  uc.discount_applied,
  uc.applied_at
FROM user_code_usage uc
JOIN codes c ON c.id = uc.code_id
JOIN users u ON u.id = uc.user_id
ORDER BY uc.applied_at DESC;
```

## Important Notes

1. **Code Validation** is real-time in the form
2. **Domain checking** happens automatically based on email
3. **Plan upgrades** from codes are immediate
4. **Discounts** are tracked for Stripe application
5. **Usage limits** are enforced at validation time
6. **Expired codes** show as invalid automatically

## Troubleshooting

### Code shows as invalid
- Check expiration date (valid_until)
- Verify usage limit not exceeded (used_count < max_uses)
- If domain-restricted, check email domain matches
- Ensure code is marked `is_active = true`

### Code not applying upgrade
- Verify `membership_plan_code` is set in database
- Check `is_active = true`
- Ensure user is not already on that plan or higher

### Discount not showing at checkout
- Current system validates discount but doesn't auto-apply to Stripe
- Stripe coupon integration is next phase
- Manual Stripe coupon creation required

## Next Phase Features (Coming Soon)

- ✋ Stripe coupon auto-creation from discount codes
- ✋ Email campaign integration for code distribution
- ✋ Admin dashboard for code management
- ✋ QR codes for physical marketing
- ✋ Usage analytics and ROI tracking
- ✋ A/B testing for promotion effectiveness

## Support

For integration details, see:
- `CODE_INTEGRATION_WITH_MEMBERSHIP.md` - Full technical guide
- `PHASE10_COMPLETION_SUMMARY.md` - Phase completion details
- `src/utils/codeUtils.ts` - Code utility functions
