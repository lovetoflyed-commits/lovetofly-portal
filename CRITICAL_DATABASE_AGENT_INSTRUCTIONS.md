# ⚠️ CRITICAL DATABASE CONFIGURATION - FOR ALL AGENTS

**Date:** February 10, 2026  
**Priority:** 🔴 CRITICAL - READ THIS BEFORE ANY WORK

---

## 🎯 THE ESSENTIAL RULE

**USE ONLY THE LOCAL DATABASE: `lovetofly-portal`**

**Database Details:**
```
Database Name: lovetofly-portal
User: postgres
Password: Master@51
Host: localhost
Port: 5432
Connection: postgresql://postgres:Master@51@localhost:5432/lovetofly-portal
```

**DO NOT USE:**
- ❌ Neon cloud database (neondb) for local development
- ❌ Any other remote databases
- ❌ Any other local PostgreSQL databases

---

## 📋 CURRENT DATABASE STATUS (as of Feb 10, 2026)

### ✅ Configuration Fixed
- `.env.local` now correctly points to `lovetofly-portal` (localhost:5432)
- `.env` was also reviewed for accuracy

### ✅ Migrations Applied (Feb 10, 2026)

**Three essential business user migrations have been applied:**

1. **Migration 093:** `093_add_user_type_and_cnpj_to_users.sql`
   - Added `user_type` column (individual|business)
   - Added `user_type_verified` boolean flag
   - Added `cnpj` varchar field
   - Status: ✅ APPLIED

2. **Migration 094:** `094_create_business_users_table.sql`
   - Created `business_users` table with 35+ fields
   - Stores comprehensive business profile data
   - Includes verification status tracking
   - Status: ✅ APPLIED

3. **Migration 095:** `095_create_business_verification_audit_table.sql`
   - Created `business_verification_audit` table
   - Tracks verification history and changes
   - Status: ✅ APPLIED

### ✅ Total Database Tables
- **Current Count:** 68 tables (65 before migrations + 3 new)
- **All critical tables present:** users, business_users, business_verification_audit

---

## 🚨 MIGRATION FILE FIXES COMPLETED

### Duplicate Migration Numbers - RESOLVED

**Problem:** Migrations 089, 090, 091 had duplicate file names
**Solution:** Renamed new business user migrations to 093, 094, 095

**Before:**
```
089_create_admin_tasks.sql              (old)
089_add_user_type_and_cnpj_to_users.sql (new) ❌ DUPLICATE
090_add_hangar_owner_contact_fields.sql (old)
090_create_business_users_table.sql     (new) ❌ DUPLICATE
091_add_owner_document_review_fields.sql (old)
091_create_business_verification_audit_table.sql (new) ❌ DUPLICATE
```

**After:**
```
089_create_admin_tasks.sql              (old) ✅
090_add_hangar_owner_contact_fields.sql (old) ✅
091_add_owner_document_review_fields.sql (old) ✅
092_add_admin_activity_log_details.sql  (old) ✅
093_add_user_type_and_cnpj_to_users.sql (new) ✅
094_create_business_users_table.sql     (new) ✅
095_create_business_verification_audit_table.sql (new) ✅
```

**Status:** All duplicate numbers resolved, sequential ordering maintained

---

## 📁 MIGRATION SOURCE FILES LOCATION

All migration files are located in:
```
/Users/edsonassumpcao/Desktop/lovetofly-portal/src/migrations/
```

**Migration tracking table:** `pgmigrations` in PostgreSQL

---

## 🔗 CRITICAL TABLE RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS TABLE                             │
│ ___________________________________________________________  │
│ id (PK)  | email | password | ... | user_type | cnpj       │
│                                     └─────┬────────┘        │
│                                     New Feb 10               │
└────────────────────┬──────────────────────────────────────┘
                     │
                     │ FK: user_id
                     │
        ┌────────────▼──────────────────────────────────┐
        │        BUSINESS_USERS TABLE (NEW)            │
        │  ──────────────────────────────────────────  │
        │  id | user_id (FK) | cnpj | legal_name |     │
        │  business_name | verification_status |       │
        │  ... 30+ business profile fields ...          │
        └────────────────┬────────────────────────────┘
                         │
                         │ FK: business_user_id
                         │
        ┌────────────────▼──────────────────────────┐
        │  BUSINESS_VERIFICATION_AUDIT TABLE (NEW)  │
        │  ──────────────────────────────────────  │
        │  id | business_user_id (FK) |             │
        │  status_from | status_to |                │
        │  verified_by | notes | created_at         │
        └──────────────────────────────────────────┘
```

---

## 🛡️ DATABASE VALIDATION QUERIES

### Verify lovetofly-portal is correct database
```bash
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT datname FROM pg_database WHERE datname='lovetofly-portal';"
```

### Verify user_type columns exist
```bash
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('user_type', 'user_type_verified', 'cnpj');"
```

### Verify business_users table exists
```bash
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT table_name FROM information_schema.tables WHERE table_name='business_users';"
```

### Verify audit table exists
```bash
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT table_name FROM information_schema.tables WHERE table_name='business_verification_audit';"
```

### Verify table relationships
```bash
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='business_users' AND constraint_type='FOREIGN KEY';"
```

---

## 🧪 TEST BUSINESS USER REGISTRATION

### Step 1: Restart dev server
```bash
npm run dev
```

### Step 2: Navigate to registration
Open: http://localhost:3000/register

### Step 3: Select "Pessoa Jurídica"

### Step 4: Fill form with test data
```
CNPJ: 11.222.333/0001-81 (valid test CNPJ)
Legal Name: Test Company Ltd
Business Name: Test Company
Email: testbiz@example.com
Password: TestPass123!
Representative: Test Admin
Headquarters: Rua das Flores, 100, São Paulo, SP 01310-100
```

### Step 5: Verify in database
```bash
psql -U postgres -h localhost -d lovetofly-portal << 'EOF'
-- Check users table for the business user
SELECT id, email, user_type, cnpj FROM users 
WHERE user_type='business' 
ORDER BY created_at DESC LIMIT 1;

-- Check business_users table for full profile
SELECT id, user_id, legal_name, business_name, verification_status 
FROM business_users 
ORDER BY created_at DESC LIMIT 1;
EOF
```

---

## ⚡ ENVIRONMENT VARIABLES (VERIFIED)

### .env.local (LOCAL DEVELOPMENT)
```dotenv
DATABASE_URL=postgresql://postgres:Master@51@localhost:5432/lovetofly-portal
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=Master@51
```

**Status:** ✅ CORRECT - Points to localhost:5432/lovetofly-portal

### .env (FALLBACK - May contain Neon reference)
```
Contains Neon reference for production
Only use when developing against cloud
NOT for local development work
```

---

## 🔑 KEY FACTS FOR ALL AGENTS

| Item | Details |
|------|---------|
| **Project Project Database** | `lovetofly-portal` on localhost:5432 |
| **Do Not Use** | Neon cloud database for local work |
| **Business User Migrations** | 093, 094, 095 (Applied Feb 10) |
| **Form Location** | `/src/app/register-business/page.tsx` |
| **API Endpoint** | POST `/api/auth/register` with `userType: 'business'` |
| **Success Redirect** | `/business/pending-verification` |
| **Data Storage** | users + business_users tables (linked by FK) |
| **Audit Trail** | business_verification_audit table |

---

## 📌 IF YOU'RE STARTING WORK

**Checklist before any coding:**

1. ✅ Confirm database is `lovetofly-portal` (localhost:5432)
2. ✅ Verify `.env.local` points to localhost
3. ✅ Verify migrations 093, 094, 095 are in src/migrations/
4. ✅ Confirm no duplicate migration numbers (089-095 should all be unique)
5. ✅ Run `npm run dev` to start dev server
6. ✅ Test business registration form if making changes to it

**If migrations haven't been applied:**
```bash
# Check if migrations are applied
psql -U postgres -h localhost -d lovetofly-portal -c "SELECT COUNT(*) FROM business_users;"

# If error "table doesn't exist", apply migrations:
psql -U postgres -h localhost -d lovetofly-portal -f src/migrations/093_add_user_type_and_cnpj_to_users.sql
psql -U postgres -h localhost -d lovetofly-portal -f src/migrations/094_create_business_users_table.sql
psql -U postgres -h localhost -d lovetofly-portal -f src/migrations/095_create_business_verification_audit_table.sql
```

---

## 🚀 WHAT'S READY TO GO

✅ **Frontend:** Business registration form (BusinessRegisterForm.tsx) - COMPLETE
✅ **API:** POST /api/auth/register with business handler - COMPLETE  
✅ **Database:** All tables created and linked - COMPLETE
✅ **Validation:** CEP masking, CNPJ checking - COMPLETE
✅ **Error Handling:** Portuguese error messages - COMPLETE

---

## ⚠️ WHAT NEEDS WORK

⏳ **Test the complete flow** - Register a business user end-to-end
⏳ **Admin verification module** - Who verifies businesses?
⏳ **SLA tracking** - 1-5 day verification promise
⏳ **Email notifications** - Notify user when approved/rejected

---

## 📞 TROUBLESHOOTING

### Error: "relation 'business_users' does not exist"
→ Migrations not applied  
→ Run: `psql -U postgres -h localhost -d lovetofly-portal -f src/migrations/094_create_business_users_table.sql`

### Error: "column 'user_type' does not exist"
→ Migration 093 not applied  
→ Run: `psql -U postgres -h localhost -d lovetofly-portal -f src/migrations/093_add_user_type_and_cnpj_to_users.sql`

### Connecting to wrong database
→ Check `.env.local` DATABASE_URL  
→ Must be: `postgresql://postgres:Master@51@localhost:5432/lovetofly-portal`

### Data saved to Neon instead of local
→ Check `.env.local` is active  
→ Restart dev server with: `npm run dev`

---

## 📚 RELATED DOCUMENTATION

- [DATABASE_CONFIGURATION_AUDIT_2026-02-10.md](DATABASE_CONFIGURATION_AUDIT_2026-02-10.md)
- [/src/app/register-business/page.tsx](../src/app/register-business/page.tsx)
- [/src/components/BusinessRegisterForm.tsx](../src/components/auth/BusinessRegisterForm.tsx)
- [/src/app/api/auth/register/route.ts](../src/app/api/auth/register/route.ts)

---

**This file must be read by ANY agent working on:**
- Database operations
- Business user registration
- Authentication changes
- Migration modifications
- Environment configuration

**Last Updated:** February 10, 2026 at 15:30 BRT  
**Status:** ✅ All migrations applied, ready for testing
