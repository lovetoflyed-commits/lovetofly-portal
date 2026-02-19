# Code Integration with Membership System

## Overview
The invitation and promotional code system has been fully integrated with the membership system. Users can now use codes during registration or when upgrading their membership to receive benefits such as:
- Automatic tier upgrades
- Percentage-based or fixed-amount discounts
- Feature access
- Role grants

## Features Implemented

### 1. Registration Form Integration
**File:** `src/components/IndividualRegisterForm.tsx`

- Added `membershipPlan` field to allow users to select from 4 tiers (Free, Standard, Premium, Pro)
- Added `invitationCode` field with real-time validation
- Code validation displays benefits directly in the form
- Auto-upgrade to higher tier if code grants it
- Membership plan selector shows pricing and descriptions

### 2. Code Validation Utility
**File:** `src/utils/codeUtils.ts`

Functions provided:
- `validateAndGetCodeInfo()` - Validates code and retrieves benefits
- `getCodeBenefits()` - Extracts discount, upgrade, and feature info
- `incrementCodeUsage()` - Tracks code usage count
- `validateCodeForUser()` - Email/domain eligibility checks
- `recordUserCodeUsage()` - Tracks per-user code usage

### 3. Registration API Enhancement
**File:** `src/app/api/auth/register/route.ts`

Changes:
- Accepts `membershipPlan` parameter (defaults to 'free')
- Accepts `invitationCode` parameter for code validation
- Validates code before user creation
- Auto-upgrades membership plan if code grants it
- Creates `user_memberships` record for paid plans
- Tracks code usage in database

Flow:
```
1. User submits registration with membership plan + optional code
2. Code is validated if provided
3. Code benefits override plan if upgrade is granted
4. User is created with selected plan
5. user_memberships record is created if plan is paid
6. Code usage is incremented and tracked
```

### 4. Membership Upgrade API Enhancement
**File:** `src/app/api/user/membership/upgrade/route.ts`

Changes:
- Accepts `code` parameter in upgrade request
- Validates code and applies benefits
- Overrides target plan if code grants upgrade
- Tracks code usage when applied to upgrade
- Returns code benefits in response

### 5. Code Validation Endpoint
**File:** `src/app/api/codes/validate/route.ts`

Endpoint: `POST /api/codes/validate`

Request:
```json
{
  "code": "CPN-SAVE20-2026",
  "userEmail": "user@example.com" (optional)
}
```

Response:
```json
{
  "success": true,
  "code": {
    "id": 123,
    "type": "promo",
    "benefits": {
      "discountType": "percent",
      "discountValue": 20,
      "membershipUpgrade": null,
      "features": []
    },
    "validFrom": "2026-02-18T00:00:00Z",
    "validUntil": "2026-05-18T00:00:00Z"
  }
}
```

### 6. Database Tables
**Migration:** `src/migrations/114_create_code_usage_tracking.sql`

New tables:
- `code_usage_history` - Tracks all code usage by user (for per-user limits)
- `user_code_usage` - Tracks code application to memberships

Fields tracked:
- User ID
- Code ID
- Membership ID
- Discount applied amount
- Membership upgrade target
- Application timestamp

## Test Codes in Database

4 sample codes have been seeded for testing:

1. **LTF-TEST-INVITE-001** (code_hint: TEST)
   - Type: Invitation
   - Effect: No upgrade or discount
   - Limite: 100 uses

2. **CPN-SAVE20-2026** (code_hint: SAVE20)
   - Type: Promotional
   - Effect: 20% discount on subscriptions
   - Limit: 500 uses
   - Valid for 90 days

3. **CPN-PREMIUM-TRIAL** (code_hint: PREMIU)
   - Type: Promotional
   - Effect: Auto-upgrade to Premium tier
   - Limit: 50 uses
   - Valid for 60 days

4. **CPN-TEAM-AIRACADEMY** (code_hint: TEAM)
   - Type: Promotional
   - Effect: 30% discount + Standard tier
   - Eligible Domain: airlineacademy.com only
   - Limit: 100 uses
   - Valid for 180 days

## Usage Examples

### Registration with Code
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@example.com",
  "password": "SecurePass123!",
  "cpf": "12345678901",
  "membershipPlan": "standard",
  "invitationCode": "CPN-SAVE20-2026",
  "userType": "individual",
  ...other fields...
}
```

Response:
```json
{
  "message": "Usuário criado com sucesso!",
  "user": {
    "id": 456,
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "plan": "standard",
    "userType": "individual"
  }
}
```

### Upgrade Membership with Code
```bash
POST /api/user/membership/upgrade
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "planCode": "premium",
  "billingCycle": "monthly",
  "code": "CPN-PREMIUM-TRIAL"
}
```

Response (code upgrades to pro):
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "action": "redirect_to_checkout",
    "codeBenefits": {
      "discountType": null,
      "discountValue": null,
      "membershipUpgrade": "pro"
    }
  }
}
```

## Restrictions & Validations

1. **Date Validity**
   - Code is only valid between `valid_from` and `valid_until`

2. **Usage Limits**
   - Max uses enforced via `max_uses` and `used_count`
   - Per-user limits enforced via `code_usage_history` table

3. **Email/Domain Eligibility**
   - If `eligible_email` is set, only matching emails can use code
   - If `eligible_domain` is set, only users from that email domain can use code

4. **Code Expiration**
   - `access_expires_at` can be used for temporary access grants

## Code Processing Flow

```
User Registration
    ↓
[Invitation/Promo Code Entered?]
    ├─ NO → Use selected plan
    └─ YES → Validate Code
            ├─ Invalid/Expired → Show error
            ├─ User ineligible → Show error
            └─ Valid → Apply Benefits
                ├─ Discount stored for Stripe
                ├─ Plan override applied
                └─ Create Membership

User Upgrade
    ↓
[Code Provided?]
    ├─ NO → Use selected plan for checkout/change
    └─ YES → Validate Code
            └─ Apply benefits & override plan

Code Applied
    ↓
├─ Increment `used_count`
├─ Record in `code_usage_history`
├─ Record in `user_code_usage`
└─ Track discount/upgrade applied
```

## Next Steps

1. **Stripe Coupon Integration**
   - Map percentage discounts to Stripe coupons during checkout
   - Apply `stripe_coupon_id` to checkout sessions

2. **Admin Code Management UI**
   - View code usage statistics
   - Disable/revoke codes
   - Create new codes with various restrictions

3. **Email Campaigns**
   - Send promo codes to segments via email
   - Track code redemption rates

4. **Analytics Dashboard**
   - Code redemption rates
   - Revenue impact by code
   - Performance of different code types

## Files Modified/Created

**Created:**
- `src/utils/codeUtils.ts` - Code validation utilities
- `src/migrations/114_create_code_usage_tracking.sql` - Database tables
- `scripts/seed_test_codes.sql` - Test code data
- `src/app/api/codes/validate/route.ts` - Code validation endpoint

**Modified:**
- `src/components/IndividualRegisterForm.tsx` - Added membership selector & code input
- `src/app/api/auth/register/route.ts` - Added code validation in registration
- `src/app/api/user/membership/upgrade/route.ts` - Added code support for upgrades

## Testing Checklist

- [ ] Register with Free plan (no code)
- [ ] Register with Standard plan (no code)
- [ ] Register with Standard plan + SAVE20 code (20% discount)
- [ ] Register with Standard plan + PREMIU code (upgrades to Premium)
- [ ] Validate TEAM code with non-eligible domain (should fail)
- [ ] Validate TEAM code with airlineacademy.com domain (should succeed)
- [ ] Track code usage in database
- [ ] Verify code_hint displays correctly in UI
- [ ] Test code expiration (valid_until)
- [ ] Test per-user code limits
