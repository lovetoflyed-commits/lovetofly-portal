# Phase 1: Database & Backend - Implementation Complete ✅

**Date:** February 10, 2026  
**Status:** Phase 1 Development Completed  
**Language:** Portuguese (PT-BR)

---

## Summary

**Phase 1: Database & Backend** has been successfully implemented with all foundational backend infrastructure for the two-tier business/individual user registration system.

---

## Completed Tasks

### 1. Database Migrations ✅

#### Migration 089: Add user_type and cnpj to users table
- **File:** `src/migrations/089_add_user_type_and_cnpj_to_users.sql`
- **Changes:**
  - Added `user_type VARCHAR(20)` column (default: 'individual')
  - Added `user_type_verified BOOLEAN` column (default: false)
  - Added `cnpj VARCHAR(18)` column (for business users)
  - Created unique index on CNPJ (allowing NULL values)
  - Created index on user_type for filtering
  - Created index on user_type_verified for verification status
- **Impact:** Allows database to distinguish between individual and business users

#### Migration 090: Create business_users table
- **File:** `src/migrations/090_create_business_users_table.sql`
- **New Table Structure:**
  ```
  - id (SERIAL PRIMARY KEY)
  - user_id (UNIQUE FOREIGN KEY to users)
  - cnpj (UNIQUE, NOT NULL)
  - legal_name, business_name, business_type
  - business_phone, business_email, website
  - representative_name, representative_title
  - headquarters_* (street, number, complement, neighborhood, city, state, zip, country)
  - company_size, industry, description, established_year
  - annual_hiring_volume
  - primary_operations (JSON array support)
  - is_verified, verification_status (pending|approved|rejected)
  - verification_notes, verification_date
  - faa_certificate_number, insurance_verified, safety_record_public
  - hiring_status, operation_status
  - created_at, updated_at
  ```
- **Impact:** Stores all business-specific information separate from users table
- **Indexes Created:** user_id, cnpj, verification_status, hiring_status, operation_status, business_type

#### Migration 091: Create business_verification_audit table
- **File:** `src/migrations/091_create_business_verification_audit_table.sql`
- **New Table Structure:**
  ```
  - id (SERIAL PRIMARY KEY)
  - business_user_id (FOREIGN KEY to business_users)
  - status_from, status_to (VARCHAR)
  - verified_by (FOREIGN KEY to users - admin who approved)
  - notes, rejection_reason (TEXT)
  - created_at (TIMESTAMP)
  ```
- **Impact:** Provides complete audit trail for verification process changes

### 2. Validation Utilities ✅

#### Updated src/utils/masks.ts
- **Added CNPJ Functions:**
  - `maskCNPJ(value)` - Formats CNPJ to XX.XXX.XXX/XXXX-XX format
  - `isValidCNPJ(cnpj)` - Validates CNPJ using official algorithm
    - Checks length (14 digits)
    - Validates check digits
    - Rejects all-same-digit patterns
    - Returns boolean

- **Existing Functions Preserved:**
  - `isValidCPF(cpf)` - CPF validation
  - `maskCPF(value)` - CPF formatting
  - `maskCEP(value)` - CEP formatting
  - `maskPhone(value)` - Phone formatting

### 3. API Endpoints ✅

#### Updated: POST /api/auth/register
- **File:** `src/app/api/auth/register/route.ts`
- **Changes:**
  - Added `userType` parameter (individual|business)
  - Split into two handler functions:
    - `handleIndividualRegistration(userData)` - Existing logic enhanced
    - `handleBusinessRegistration(userData)` - New business handler
  
- **Individual Registration Flow:**
  - Validates CPF format and uniqueness
  - Creates user with `user_type='individual'` and `user_type_verified=true`
  - Returns user object with plan=free
  - All existing validations preserved

- **Business Registration Flow:**
  - Validates CNPJ format and uniqueness
  - Checks both users and business_users tables for duplicates
  - Creates user record with `user_type='business'` and `user_type_verified=false`
  - Creates business_users record with `verification_status='pending'`
  - Uses database transaction (BEGIN/COMMIT/ROLLBACK)
  - Returns user, businessUser, and verification status
  - All fields in Portuguese message responses

- **Rate Limiting:**
  - Preserved critical rate limiting (3 attempts per hour)
  - Applied to both registration types

- **Error Messages (Portuguese):**
  - "Muitas tentativas de cadastro. Tente novamente mais tarde."
  - "Tipo de usuário inválido"
  - "Por favor, preencha todos os campos obrigatórios"
  - "CPF inválido" / "CNPJ inválido"
  - "E-mail já cadastrado"
  - "CPF já cadastrado" / "CNPJ já cadastrado no sistema"

#### New: GET /api/auth/check-document
- **File:** `src/app/api/auth/check-document/route.ts`
- **Purpose:** Real-time validation and availability checking for CPF/CNPJ
- **Query Parameters:**
  - `type`: 'cpf' or 'cnpj' (required)
  - `value`: document number with or without formatting (required)
  
- **Response:**
  ```json
  {
    "available": boolean,
    "valid": boolean,
    "message": string
  }
  ```
  
- **Behavior:**
  - Validates document format and check digits
  - Returns `valid: false` if format is invalid
  - Checks both users table AND business_users table (for CNPJ)
  - Returns `available: false` if document already registered
  - All messages in Portuguese

- **Use Cases:**
  - Real-time validation as user types
  - Pre-submission validation
  - Prevents duplicate registrations
  - Accessible from frontend via fetch API

---

## Technical Details

### Database Relationship
```
users (1) ──────── (1) business_users
       ← user_id
       (via UNIQUE constraint)
       
users → business_verification_audit
       (audit trail for history)
```

### User Type Logic
- **Individual (Pessoa Física):**
  - `user_type = 'individual'`
  - `user_type_verified = true` (immediately)
  - `cpf` field populated
  - `cnpj` field NULL
  - No business_users record
  - Full access immediately after registration

- **Business (Pessoa Jurídica):**
  - `user_type = 'business'`
  - `user_type_verified = false` (pending)
  - `cpf` field NULL
  - `cnpj` field populated
  - business_users record created
  - Limited access until verification_status = 'approved'

### Transaction Safety
- Business registration uses database transactions
- If any step fails, entire registration is rolled back
- Prevents partial data inconsistencies
- Atomic operation for data integrity

---

## API Examples

### Individual Registration Request
```bash
POST /api/auth/register
Content-Type: application/json

{
  "userType": "individual",
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@example.com",
  "password": "SecurePass123!",
  "cpf": "123.456.789-10",
  "birthDate": "1990-05-15",
  "mobilePhone": "(11) 99999-8888",
  "addressStreet": "Rua das Flores",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "01234-567",
  "aviationRole": "pilot",
  "terms": true,
  "newsletter": true
}
```

**Response (201 Created):**
```json
{
  "message": "Usuário criado com sucesso!",
  "user": {
    "id": 123,
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "plan": "free",
    "userType": "individual"
  }
}
```

### Business Registration Request
```bash
POST /api/auth/register
Content-Type: application/json

{
  "userType": "business",
  "legalName": "Empresa de Aviação LTDA",
  "businessName": "Emy Aviação",
  "businessType": "airline",
  "email": "contato@emyaviacao.com.br",
  "password": "SecurePass123!",
  "cnpj": "12.345.678/0001-90",
  "businessPhone": "(11) 3333-4444",
  "businessEmail": "contato@emyaviacao.com.br",
  "website": "www.emyaviacao.com.br",
  "representativeName": "Maria Silva",
  "representativeTitle": "Gerente de RH",
  "headquartersStreet": "Av. Brasil",
  "headquartersCity": "São Paulo",
  "headquartersState": "SP",
  "headquartersZip": "01234-567",
  "companySize": "medium",
  "industry": "Aviation",
  "description": "Companhia aérea regional",
  "establishedYear": 2015,
  "terms": true,
  "newsletter": true
}
```

**Response (201 Created):**
```json
{
  "message": "Empresa registrada com sucesso! Aguardando verificação.",
  "user": {
    "id": 124,
    "email": "contato@emyaviacao.com.br",
    "plan": "free",
    "userType": "business",
    "verificationStatus": "pending"
  },
  "businessUser": {
    "id": 45,
    "legalName": "Empresa de Aviação LTDA",
    "businessName": "Emy Aviação",
    "cnpj": "12345678000190",
    "verificationStatus": "pending"
  }
}
```

### Document Validation Request
```bash
GET /api/auth/check-document?type=cnpj&value=12.345.678/0001-90
```

**Response:**
```json
{
  "available": true,
  "valid": true,
  "message": "CNPJ disponível"
}
```

**Response (Already Registered):**
```json
{
  "available": false,
  "valid": true,
  "message": "CNPJ já registrado no sistema"
}
```

**Response (Invalid Format):**
```json
{
  "available": false,
  "valid": false,
  "message": "CNPJ inválido. Verifique o número."
}
```

---

## Next Steps: Phase 2

The following Phase 2 tasks are ready for frontend implementation:

### Frontend Components to Create
1. **UserTypeSelectionModal.tsx** - Modal for choosing Pessoa Física vs Pessoa Jurídica
2. **IndividualRegisterForm.tsx** - Extracted from existing page.tsx with enhancements
3. **BusinessRegisterForm.tsx** - New business registration form with all fields
4. **/app/register-business/page.tsx** - Dedicated business registration page
5. **PendingVerificationPage.tsx** - Shows when business awaits approval

### Frontend Updates
1. Update LandingPage.tsx to show UserTypeSelectionModal
2. Integrate form components with register API
3. Add real-time validation using check-document endpoint
4. Create loading and error states
5. Display verification status for business users

### All Text Content
- All user-facing messages in Portuguese (PT-BR)
- Form labels and placeholders in Portuguese
- Error messages in Portuguese
- Success messages in Portuguese
- UI text and buttons in Portuguese

---

## Files Modified/Created

### New Files
- ✅ `src/migrations/089_add_user_type_and_cnpj_to_users.sql`
- ✅ `src/migrations/090_create_business_users_table.sql`
- ✅ `src/migrations/091_create_business_verification_audit_table.sql`
- ✅ `src/app/api/auth/check-document/route.ts`
- ✅ Implementation document (this file)

### Modified Files
- ✅ `src/utils/masks.ts` - Added CNPJ functions
- ✅ `src/app/api/auth/register/route.ts` - Enhanced with business logic

---

## Testing Checklist (Phase 1 Verification)

Before proceeding to Phase 2, verify:

- [ ] Database migrations execute without errors
- [ ] `users` table has new columns (user_type, user_type_verified, cnpj)
- [ ] `business_users` table exists with correct schema
- [ ] `business_verification_audit` table exists
- [ ] CNPJ validation function works correctly
- [ ] Individual registration still works as before
- [ ] Individual registration creates user with user_type='individual'
- [ ] Business registration creates both user and business_users records
- [ ] Business registration returns verification_status='pending'
- [ ] CNPJ uniqueness validation prevents duplicates
- [ ] CPF uniqueness validation still prevents duplicates
- [ ] Document check endpoint validates format correctly
- [ ] Document check endpoint detects duplicates
- [ ] All error messages appear in Portuguese
- [ ] Rate limiting still works for both registration types

---

## Deployment Instructions

### Database Migration Steps
```bash
# Run migrations in order
npm run migrate:up

# Or manually:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < src/migrations/089_*.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < src/migrations/090_*.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < src/migrations/091_*.sql
```

### Verification
```sql
-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('user_type', 'user_type_verified', 'cnpj');

-- Check business_users table exists
\dt business_users;

-- Check business_verification_audit table exists
\dt business_verification_audit;
```

---

## Phase 1 Status: ✅ COMPLETE

All backend infrastructure is ready for frontend development. Phase 2 can proceed immediately with no backend dependencies.

---

**Report Generated:** February 10, 2026  
**Next Phase:** Frontend Components (Phase 2)  
**Estimated Frontend Time:** 1-2 weeks
