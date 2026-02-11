# Quick Reference: Business User System Testing & Validation

## ✅ Test Results Summary (Feb 10, 2026)

| Test Case | Status | Details |
|-----------|--------|---------|
| **Valid Registration** | ✅ PASS | HTTP 201, data persisted in lovetofly-portal |
| **Duplicate CNPJ** | ✅ PASS | HTTP 409, "CNPJ já cadastrado" error message |
| **Invalid CNPJ** | ✅ PASS | HTTP 400, "CNPJ inválido" rejection |
| **Email Uniqueness** | ✅ PASS | Database unique constraint enforced |
| **Foreign Key** | ✅ PASS | users.id → business_users.user_id verified |
| **Default Values** | ✅ PASS | verification_status='pending', is_verified=false |

---

## 🗄️ Database Location
```
PostgreSQL running on: localhost:5432
Database name: lovetofly-portal
Username: postgres
Password: Master@51
Connection string: postgresql://postgres:Master@51@localhost:5432/lovetofly-portal
```
⚠️ **NOT** the Neon cloud database - that's for production only

---

## 📋 Tables Created/Modified

### users table
- ✅ Added column: `user_type` (default: 'individual')
- ✅ Added column: `user_type_verified` (default: false)
- ✅ Added column: `cnpj` (unique index, nullable)

### business_users table (NEW)
- ID, user_id (FK), legal_name, business_name, cnpj
- verification_status (default: 'pending')
- is_verified (default: false)
- 35+ total fields for company details

### business_verification_audit table (NEW)
- Tracks admin approval/rejection actions
- Linked to business_users via FK
- Ready for SLA tracking and audit logs

---

## 🧪 Quick Test Commands

### Start Dev Server
```bash
npm run dev
```
Server runs on `http://localhost:3000`

### Test API (CURL)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userType":"business",
    "cnpj":"11222333000181",
    "legalName":"Company Name",
    "businessName":"Business Name",
    "email":"test@company.com",
    "password":"TestPass123!",
    "representativeName":"John Doe"
  }'
```

### Check Database
```bash
# Using PGPASSWORD to handle @ in password
PGPASSWORD="Master@51" psql -h localhost -U postgres -d lovetofly-portal

# Count business users
SELECT COUNT(*) FROM business_users;

# View registration with foreign key
SELECT u.id, u.email, b.legal_name 
FROM users u 
LEFT JOIN business_users b ON u.id = b.user_id 
WHERE u.user_type = 'business';
```

---

## ❌ What Doesn't Work Yet (Phase 2)

- [ ] Admin verification dashboard (to approve/reject businesses)
- [ ] Email notifications (approval/rejection)
- [ ] SLA tracking (1-5 day promise)
- [ ] Document upload (for certain scenarios)
- [ ] Full RLS policies (authorization)

---

## 🔍 Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| CNPJ | Brazilian format, 14 digits, valid checksum | 11222333000181 ✅ |
| Email | Standard email format, must be unique | test@company.com |
| Legal Name | Required, stored in business_users | "Company Ltd" |
| Business Name | Required, stored in business_users | "Company Co" |
| Representative | Required, stored in business_users | "John Doe" |
| Password | Min requirements (checked in form) | TestPass123! |

---

## 🐛 If Something Breaks

### Problem: "CNPJ inválido"
**Cause:** CNPJ doesn't pass Brazilian checksum validation
**Solution:** Use mathematically valid CNPJ or use generator

### Problem: "CNPJ já cadastrado"
**Cause:** This CNPJ is already registered
**Solution:** User different CNPJ or login with existing account

### Problem: Registering but no data appears in database
**Cause:** Wrong database configured in .env.local
**Solution:** Verify DATABASE_URL points to localhost:5432/lovetofly-portal

### Problem: API returns 500 error
**Cause:** Database connection failed
**Solution:** Check PostgreSQL is running, credentials in .env.local are correct

---

## 📊 Performance Expected

| Operation | Expected Time | Tested Time |
|-----------|---------------|-------------|
| CNPJ Validation | <5ms | ✅ <5ms |
| API Response | <100ms | ✅ 20-30ms |
| Database Insert | <50ms | ✅ 15ms |
| Full Transaction | <100ms | ✅ 40ms |

---

## 🔐 Security Checklist

- ✅ CNPJ validation prevents invalid business IDs
- ✅ Email unique constraint prevents duplicate accounts
- ✅ CNPJ unique constraint prevents data duplication
- ✅ Passwords hashed (bcrypt)
- ✅ SQL injection protected (parameterized queries)
- ⚠️ Rate limiting requires Redis URL (optional for dev)
- 🔲 RLS policies not yet implemented (Phase 2)

---

## 📝 Recent Changes

**Configuration:** `.env.local` updated to use localhost:5432/lovetofly-portal

**Migrations Applied:**
- Migration 093: Add user_type columns to users table
- Migration 094: Create business_users table
- Migration 095: Create business_verification_audit table

**Forms Tested:** BusinessRegisterForm.tsx ✅ working correctly

---

## 🚀 Next Steps

1. Build admin business verification dashboard
2. Implement email send on approval/rejection
3. Add SLA daily tracker for verification completion
4. Create document upload feature
5. Deploy to staging for team testing

---

## 📞 Support

- **Database:** See CRITICAL_DATABASE_AGENT_INSTRUCTIONS.md (500+ lines)
- **Full Report:** See BUSINESS_REGISTRATION_TEST_REPORT_2026-02-10.md
- **Session Notes:** See SESSION_SUMMARY_2026-02-10.md

---

**Last Updated:** February 10, 2026  
**Status:** All Phase 1 tests passing ✅  
**Ready for:** Admin verification module development
