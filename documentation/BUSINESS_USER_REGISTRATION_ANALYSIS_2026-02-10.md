# Business User Registration System Analysis
**Love to Fly Portal - Two-Tier Registration Implementation**

**Date:** February 10, 2026  
**Status:** Analysis & Recommendation Report  
**Requested By:** Project Owner  
**Prepared By:** AI Assistant  

---

## Executive Summary

This report analyzes the implementation of a **two-tier user registration system** for the Love to Fly portal, enabling distinct registration flows for:
1. **Pessoa Física** (Individual/Natural Person) - Pilots, instructors, mechanics, etc.
2. **Pessoa Jurídica** (Legal Entity/Business) - Airlines, flight schools, maintenance companies, etc.

The proposed solution implements a **user-type selection modal** at the landing page level, presented when users click "Criar Conta", redirecting to the appropriate registration form based on selection.

---

## Current System Analysis

### 1. Current Registration Architecture

#### 1.1 Landing Page Structure
- **File:** `/src/components/LandingPage.tsx`
- **Current Behavior:**
  - "Criar Conta" button opens registration modal directly
  - No user-type discrimination
  - All registrations default to individual users (Pessoa Física)
  - No pathway for business entity registration

#### 1.2 Current Registration Form
- **File:** `/src/app/page.tsx` (RegisterForm component, lines 100-300+)
- **File:** `/src/app/register/page.tsx` (Dedicated register page)
- **Target User Type:** Individual/Natural Person Only
- **Current Fields Collected:**
  ```
  Personal Information:
  - firstName, lastName, birthDate
  - email, password, confirmPassword
  - cpf (unique identifier for individuals)
  - mobilePhone
  
  Address Information:
  - addressStreet, addressNumber, addressComplement
  - addressNeighborhood, addressCity, addressState
  - addressZip, addressCountry (auto-lookup by CEP)
  
  Aviation Profile:
  - aviationRole (student, pilot, instructor, mechanic, etc.)
  - aviationRoleOther (custom role)
  - licencas, habilitacoes (licenses & qualifications)
  - curso_atual (current course)
  
  Consent & Preferences:
  - newsletter (opt-in)
  - terms (required acceptance)
  - plan (default: 'free')
  ```
- **Validation:** CPF format, email uniqueness, password strength
- **Rate Limiting:** 3 registration attempts per hour (critical limit)

#### 1.3 Users Table Schema
- **File:** `/src/migrations/001_create_users_table.sql`
- **Current Columns:**
  ```sql
  id SERIAL PRIMARY KEY
  name VARCHAR(255)
  email VARCHAR(255) UNIQUE
  password VARCHAR(255)
  cpf VARCHAR(20) UNIQUE           -- Individual-only field
  phone_number VARCHAR(20)
  address TEXT
  course_type, current_license, current_ratings
  total_flight_hours INTEGER
  transferred_from_ciac BOOLEAN
  previous_ciac_name VARCHAR(255)
  created_at, updated_at TIMESTAMP
  
  -- From migrations:
  first_name, last_name VARCHAR(255)
  birth_date DATE
  mobile_phone VARCHAR(20)
  address_street, address_number, address_complement
  address_neighborhood, address_city, address_state
  address_zip, address_country
  aviation_role VARCHAR(100)
  aviation_role_other VARCHAR(255)
  licencas TEXT
  habilitacoes TEXT
  curso_atual VARCHAR(100)
  
  -- From migration 040:
  role VARCHAR(50) DEFAULT 'user'  -- Access control
  
  -- From migration 041:
  is_hangar_owner BOOLEAN DEFAULT false
  
  -- From other migrations:
  plan VARCHAR(50)
  newsletter_opt_in BOOLEAN
  terms_agreed BOOLEAN
  password_hash VARCHAR(255)
  ```
- **Issue:** No `user_type` column to distinguish Pessoa Física vs Pessoa Jurídica

#### 1.4 Companies Table Schema
- **File:** `/src/migrations/014_create_companies_table.sql`
- **Current Structure:**
  ```sql
  id SERIAL PRIMARY KEY
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  legal_name VARCHAR(255)
  company_name VARCHAR(255)
  logo_url TEXT
  website VARCHAR(255)
  headquarters_city, headquarters_country
  company_size, industry
  description, culture_statement TEXT
  annual_hiring_volume INTEGER
  hiring_status VARCHAR(50) DEFAULT 'active'  -- active|paused|closed
  faa_certificate_number, insurance_verified
  safety_record_public BOOLEAN
  average_rating DECIMAL(3,2)
  review_count INTEGER
  is_verified BOOLEAN
  verification_status VARCHAR(50)  -- pending|approved|rejected
  created_at, updated_at TIMESTAMP
  ```
- **Current Usage:** One-to-one relationship with users table via `user_id`
- **Limitation:** Companies are created AFTER user registration, not during

#### 1.5 Authentication Flow
- **Login:** `/src/app/api/auth/login` - Email + password authentication
- **Registration:** `/src/app/api/auth/register/route.ts` (POST endpoint)
  - Validates CPF uniqueness
  - Checks email uniqueness
  - Hashes password with bcryptjs
  - Returns user object with plan: 'free'
- **Token Storage:** JWT stored in localStorage
- **Auth Context:** `/src/context/AuthContext.tsx` - Manages user state and token

---

## Proposed Two-Tier Registration System

### 2. Implementation Architecture

#### 2.1 User Type Selection Modal (New Component)
- **Location:** `/src/components/UserTypeSelectionModal.tsx` (to create)
- **Parent:** LandingPage component
- **Trigger:** "Criar Conta" button click
- **Display:** Modal with radio/dropdown selection:
  ```
  User Type Selection Modal
  ═══════════════════════════════════════════════
  
  Please select your user type:
  
  ○ Pessoa Física (Individual)
    Pilots, instructors, mechanics, students,
    aviation enthusiasts
    
  ○ Pessoa Jurídica (Business Entity)
    Airlines, flight schools, maintenance shops,
    aviation companies
  
  [Cancel]  [Continue]
  ```
- **Behavior:**
  - Selection stored in state/context
  - "Continue" → Redirects to appropriate form
  - Forwards selection to prevent back-navigation

#### 2.2 Database Schema Changes

##### 2.2.1 Users Table Enhancement
- **New Column:** `user_type VARCHAR(20) DEFAULT 'individual'`
  - Values: `'individual'` (Pessoa Física) or `'business'` (Pessoa Jurídica)
  - Non-nullable with index for filtering
- **New Column:** `user_type_verified BOOLEAN DEFAULT false`
  - For business verification status tracking
- **Conditional Requirements:**
  - `cpf` field: Required for individuals, NULL for businesses
  - `cnpj` field: Required for businesses, NULL for individuals
  - index on `user_type` for quick filtering

##### 2.2.2 Business Users Table (New)
- **File:** New migration `XXX_create_business_users_table.sql`
- **Purpose:** Store business-specific data beyond companies table
- **Schema:**
  ```sql
  CREATE TABLE business_users (
    id SERIAL PRIMARY KEY
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
    
    -- Legal Information
    cnpj VARCHAR(18) UNIQUE NOT NULL
    legal_name VARCHAR(255) NOT NULL
    company_name VARCHAR(255) NOT NULL
    business_type VARCHAR(100)  -- airline, flight_school, etc.
    
    -- Contact Information
    business_phone VARCHAR(20)
    business_email VARCHAR(255)
    website VARCHAR(255)
    
    -- Address Information
    headquarters_street VARCHAR(255)
    headquarters_number VARCHAR(20)
    headquarters_complement VARCHAR(255)
    headquarters_neighborhood VARCHAR(100)
    headquarters_city VARCHAR(100)
    headquarters_state VARCHAR(2)
    headquarters_zip VARCHAR(20)
    headquarters_country VARCHAR(100)
    
    -- Business Details
    company_size VARCHAR(50)  -- micro|small|medium|large
    industry VARCHAR(100)
    description TEXT
    established_year INTEGER
    
    -- Verification & Compliance
    is_verified BOOLEAN DEFAULT false
    verification_status VARCHAR(50) DEFAULT 'pending'
    verification_date TIMESTAMP
    
    -- Hiring/Operations Info
    annual_hiring_volume INTEGER
    hiring_status VARCHAR(50) DEFAULT 'active'
    operation_status VARCHAR(50) DEFAULT 'active'
    
    -- Safety & Compliance
    faa_certificate_number VARCHAR(50)
    insurance_verified BOOLEAN DEFAULT false
    safety_record_public BOOLEAN DEFAULT false
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    CONSTRAINT cnpj_format CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$')
  )
  ```

##### 2.2.3 Index Strategy
```sql
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
CREATE INDEX idx_business_users_cnpj ON business_users(cnpj);
CREATE INDEX idx_business_users_verification ON business_users(verification_status);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_user_type_verified ON users(user_type_verified);
```

---

### 3. Frontend Implementation Plan

#### 3.1 Component Structure

**New/Modified Components:**
```
src/components/
├── UserTypeSelectionModal.tsx          (NEW)
│   ├── Props: onSelect(type), onCancel()
│   ├── State: selectedType
│   └── Emits: Selection to parent
│
├── LandingPage.tsx                      (MODIFY)
│   ├── Add: UserTypeSelectionModal state
│   ├── Remove: Direct RegisterForm trigger
│   └── Pass: onOpenRegister → openUserTypeModal()
│
└── RegistrationForms/
    ├── IndividualRegisterForm.tsx        (EXTRACT from page.tsx)
    │   └── Current form, minimal changes
    │
    └── BusinessRegisterForm.tsx          (NEW)
        ├── Fields: CNPJ, company name, business info
        ├── Validation: CNPJ format, unique check
        └── Requires: Address lookup by CEP

src/app/
├── register/page.tsx                    (MODIFY)
│   ├── Routes based on userType param
│   ├── Shows appropriate form
│   └── Handles submission to correct API
│
└── register-business/page.tsx           (NEW)
    └── Dedicated business registration page
```

#### 3.2 Proposed Business Registration Form Fields

**Section 1: Legal Entity Information**
```
- CNPJ*                    (18 chars, unique, validated)
- Legal Name*              (255 chars, required)
- Business Name            (255 chars, optional if same as legal)
- Business Type*           (dropdown):
                            ├── Airline
                            ├── Flight School
                            ├── Maintenance Facility
                            ├── Aviation Consulting
                            ├── Aircraft Sales/Leasing
                            └── Other (specify)
```

**Section 2: Contact Information**
```
- Business Email*          (unique, required)
- Business Phone*          (validated)
- Website                  (optional)
- Business Representative Name*  (point of contact)
- Representative Title*    (position)
```

**Section 3: Headquarters Address**
```
- CEP*                     (auto-lookup existing endpoint)
- Street*
- Number*
- Complement
- Neighborhood*
- City*
- State*
- Country                  (default: Brasil)
```

**Section 4: Business Details**
```
- Company Size*            (dropdown):
                            ├── Microenterprise (1-10)
                            ├── Small (11-50)
                            ├── Medium (51-250)
                            └── Large (251+)
- Industry*                (text field)
- Business Description*    (textarea, 500 chars max)
- Year Established*        (date picker)
- Annual Hiring Volume     (integer)
```

**Section 5: Operational Information**
```
- Primary Operations       (checkboxes):
                            ├── Passenger Transport
                            ├── Cargo
                            ├── Flight Training
                            ├── Maintenance Services
                            ├── Aircraft Sales
                            └── Other
- FAA Certificate #        (optional, for validation)
- Insurance Verified       (checkbox, auto-updated by admin)
```

**Section 6: Security & Consent**
```
- Email Verification       (link sent after form completion)
- CNPJ Verification        (pending admin approval)
- Terms of Service*        (required checkbox)
- Data Processing*         (LGPD compliance checkbox)
- Newsletter Opt-in        (optional)
```

**Process:**
1. User fills form
2. Submit → Validation (backend)
3. Create user (user_type = 'business')
4. Create business_users record
5. Create empty company record (placeholder)
6. Send verification email
7. Redirect to pending verification page
8. Admin approves business before full access

---

### 4. Backend Implementation Plan

#### 4.1 New API Endpoints

**Endpoint 1: Register Individual (Existing - Minimal Changes)**
```
POST /api/auth/register
Request Body:
{
  userType: 'individual',
  firstName, lastName, birthDate, cpf,
  email, password, mobilePhone,
  address_*, aviation_role,
  terms, newsletter
}
Response: { user, token, company: null }
Status: 201 Created
```

**Endpoint 2: Register Business (New)**
```
POST /api/auth/register-business
Request Body:
{
  userType: 'business',
  cnpj, legalName, businessName,
  businessType, businessPhone,
  businessEmail, website,
  representativeName, representativeTitle,
  headquarters_*,
  companySize, industry, description,
  establishedYear, annualHiringVolume,
  primaryOperations: [],
  faaCertificateNumber,
  terms, newsletter
}
Response: { user, token, businessUser, company: { id, placeholder: true } }
Status: 201 Created
Behavior:
- Validate CNPJ format + uniqueness
- Hash password
- Create user record (user_type='business')
- Create business_users record
- Create placeholder company record
- Send verification email
- Return user object
```

**Endpoint 3: Validate CNPJ/CPF Availability**
```
GET /api/auth/check-document
Query: ?type=cnpj&value=XX.XXX.XXX/XXXX-XX
Query: ?type=cpf&value=XXX.XXX.XXX-XX
Response: { available: boolean, message?: string }
Status: 200 OK
```

**Endpoint 4: Business Profile Verification (Admin)**
```
PATCH /api/admin/business-users/{id}/verify
Request Body:
{
  verification_status: 'approved'|'rejected',
  verification_notes?: string,
  require_additional_docs?: boolean
}
Requires: Admin role
Response: { businessUser: {...} }
Status: 200 OK
```

#### 4.2 Register API Logic Changes

**File:** `/src/app/api/auth/register/route.ts` (MODIFY)

```typescript
// Add userType parameter handling
const { userType = 'individual', ...formData } = body;

// Conditional validation
if (userType === 'business') {
  // Validate CNPJ instead of CPF
  // Check CNPJ uniqueness
  // Verify business owner name
  // Require business email
} else {
  // Validate CPF (existing logic)
  // Check CPF uniqueness
}

// Conditional user creation
if (userType === 'business') {
  // Create user with user_type = 'business'
  // Create business_users record
  // Create placeholder company record
  // Return with business verification pending
} else {
  // Create user with user_type = 'individual'
  // Return as before
}
```

#### 4.3 Validation Functions (New Utils)

**File:** `/src/utils/validation.ts` (Create/Extend)

```typescript
// CNPJ Validation
function isValidCNPJ(cnpj: string): boolean
function formatCNPJ(cnpj: string): string

// Document checking
function maskCNPJ(cnpj: string): string

// Business term validation
function isValidBusinessType(type: string): boolean

// Existing CPF functions remain unchanged
```

---

### 5. Data Flow Diagrams

#### 5.1 Registration Flow - Pessoa Física (Individual)

```
┌─────────────────────────────────────────────────────────────────┐
│ Landing Page                                                      │
│ [Criar Conta] button                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPE SELECTION MODAL (NEW)                                  │
│ ○ Pessoa Física                                                  │
│ ○ Pessoa Jurídica                                                │
│ ┌── [Continue] ──┐                                               │
└─┼────────────────┼──────────────────────────────────────────────┘
  │ userType='individual'
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ INDIVIDUAL REGISTER FORM                                        │
│ (Current form - minimal changes)                                │
│ - Personal: Name, birthDate, CPF, email, password             │
│ - Address: Street, city, ZIP (auto-lookup)                    │
│ - Aviation: Role, licenses, qualifications                    │
│ - Consent: Terms, newsletter                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/auth/register                                         │
│ {                                                                │
│   userType: 'individual',                                       │
│   firstName, lastName, cpf, email, password,                   │
│   ... (personal data)                                           │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                 ┌───────┴──────────┐
                 │                  │
                 ▼                  ▼
         ✓ Validation       ✗ Error
            Success         Response
             │               │
             ▼               ▼
         Create User    Show Error
         (user_type=    Message
         'individual')  
             │
             ▼
         Save Token
         Login User
             │
             ▼
         Redirect to
         Dashboard
```

#### 5.2 Registration Flow - Pessoa Jurídica (Business)

```
┌─────────────────────────────────────────────────────────────────┐
│ Landing Page                                                      │
│ [Criar Conta] button                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER TYPE SELECTION MODAL (NEW)                                  │
│ ○ Pessoa Física                                                  │
│ ○ Pessoa Jurídica                                                │
│ ┌────────────────────┐                                           │
└─┤ [Continue]         ├──────────────────────────────────────────┘
  │ userType='business'│
  └────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS REGISTER FORM (NEW)                                    │
│ Section 1: Legal Entity Information                             │
│  - CNPJ* (validated, unique)                                    │
│  - Legal Name*                                                   │
│  - Business Name                                                 │
│  - Business Type* (airline, school, etc.)                       │
│                                                                  │
│ Section 2: Contact Information                                  │
│  - Business Email* (unique)                                     │
│  - Business Phone*                                              │
│  - Website                                                       │
│  - Representative Name* & Title*                                │
│                                                                  │
│ Section 3: Headquarters Address                                 │
│  - CEP* (auto-lookup)                                           │
│  - Street*, Number*, Complement                                 │
│  - City*, State*                                                │
│                                                                  │
│ Section 4: Business Details                                     │
│  - Company Size* (micro to large)                               │
│  - Industry*                                                     │
│  - Description*                                                  │
│  - Year Established*                                            │
│  - Annual Hiring Volume                                         │
│                                                                  │
│ Section 5: Operations & Sec.                                    │
│  - Primary Operations (checkboxes)                              │
│  - FAA Certificate#, Insurance                                  │
│  - Terms*, Data Processing*                                     │
│  - Newsletter (optional)                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/auth/register-business                                │
│ {                                                                │
│   userType: 'business',                                         │
│   cnpj, legalName, businessName, businessType,                 │
│   businessPhone, businessEmail, website,                        │
│   representativeName, representativeTitle,                      │
│   address_*, companySize, industry, description,               │
│   establishedYear, annualHiringVolume,                         │
│   primaryOperations: [...], email, password,                   │
│   terms, newsletter                                             │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                 ┌───────┴──────────┐
                 │                  │
                 ▼                  ▼
         ✓ Validation       ✗ Error
            Success         Response
             │               │
             ▼               ▼
         Create user    Show Error
         (user_type=    Details
         'business')    
             │
             ├─→ Create business_users record
             │
             ├─→ Create placeholder company record
             │
             ├─→ Save token (business unverified)
             │
             ├─→ Send verification email
             │
             │   Email Contains:
             │   - Email verification link
             │   - Business info summary
             │   - Next steps
             │
             ▼
         Redirect to
         "Pending Verification" Page
         ┌─────────────────────────────┐
         │ PENDING VERIFICATION PAGE   │
         │ Thank you for registering!  │
         │ Your business is pending    │
         │ verification.               │
         │                             │
         │ Next steps:                 │
         │ 1. Verify email address     │
         │ 2. Admin review (1-5 days)  │
         │ 3. Account activation       │
         │                             │
         │ [Resend Email]              │
         └─────────────────────────────┘
```

---

### 6. Database Relationship Changes

#### 6.1 Current Relationship
```
users (1) ──────── (1) companies
         ← user_id
         (one user can have one company profile)
```

#### 6.2 Proposed Relationship
```
users (1) ──────── (1) business_users
       ← user_id
       (business users have detailed profile)
       
       ├────── (1) companies (placeholder, linked via user)
       │
       └────── (n) jobs
              ← company_id
              (post job listings)


users (1) ──────── (n) hangar_owners
       ← user_id
       (individuals can also be hangar owners)
```

---

## Technical Specifications

### 7. UI/UX Considerations

#### 7.1 User Type Selection Modal
```
Visual Design:
- Modal overlay on landing page
- Two equal-width options (radio buttons or cards)
- Icon for each type (person icon vs building icon)
- Clear description for each type
- Cancel button to dismiss
- Prominent Continue button

Accessibility:
- Keyboard navigation (Tab/Arrow keys)
- ARIA labels for screen readers
- Focus indicators
- Responsive on mobile (full-width)

Mobile Responsiveness:
- Stacked options on small screens
- Touch-friendly button sizes
- Full modal height on mobile
```

#### 7.2 Business Registration Form
```
Layout:
- Multi-section form or steps (optional)
- Progress indicator if multi-step
- Field grouping by category
- Clear visual hierarchy

Validation UX:
- Real-time field validation (on blur)
- Clear error messages below field
- Green checkmark on valid fields
- Disable submit until all required fields valid

Loading States:
- Spinner during API calls
- Disabled inputs during submission
- "Processing..." button text

Success Flow:
- Confirmation page with next steps
- Email sent confirmation message
- Option to resend verification email
- FAQ or support link
```

---

### 8. Implementation Phases

#### Phase 1: Database & Backend (Week 1)
- [ ] Create database migration for `business_users` table
- [ ] Add `user_type` column to `users` table
- [ ] Add indexes for performance
- [ ] Create CNPJ validation functions
- [ ] Update `/api/auth/register/route.ts` for business handling
- [ ] Create `/api/auth/register-business/route.ts` endpoint
- [ ] Create `/api/auth/check-document/route.ts` for real-time validation
- [ ] Add business verification admin endpoints

#### Phase 2: Frontend Components (Week 1-2)
- [ ] Create `UserTypeSelectionModal.tsx` component
- [ ] Extract `IndividualRegisterForm.tsx` from page.tsx
- [ ] Create `BusinessRegisterForm.tsx` component
- [ ] Create `/app/register-business/page.tsx`
- [ ] Update `/src/components/LandingPage.tsx` for modal integration
- [ ] Create "Pending Verification" page component
- [ ] Add loading/error states throughout

#### Phase 3: Integration & Testing (Week 2)
- [ ] Wire components together
- [ ] Test individual registration flow
- [ ] Test business registration flow
- [ ] Verify API responses
- [ ] Test form validation (client & server)
- [ ] Test rate limiting
- [ ] Test email verification flow

#### Phase 4: Admin & Verification (Week 2-3)
- [ ] Create admin dashboard for business verification
- [ ] Add business approval/rejection flows
- [ ] Create notification system for business owners
- [ ] Document verification checklist

#### Phase 5: Deployment & Monitoring (Week 3)
- [ ] Database migration execution
- [ ] Code deployment
- [ ] Monitor error rates
- [ ] User acceptance testing
- [ ] Documentation updates

---

## Risk Assessment & Mitigation

### Risks & Mitigation Strategies

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Duplicate CNPJ entries | High | Medium | Add unique constraint + validation before insert |
| Business owners frustrated by verification delays | Medium | High | Send status updates, allow dashboard view of status |
| Legacy company data conflicts | Medium | Medium | Create migration script to link existing companies |
| Rate limiting impacts bulk registrations | Low | Low | Adjust rate limit thresholds for testing |
| CEP lookup failures for some addresses | Low | Low | Allow manual address entry as fallback |
| Email verification emails flagged as spam | Medium | Medium | Use verified domain, proper SPF/DKIM |

---

## User Segmentation Strategy

### 9. User Type and Access Patterns

#### 9.1 Individual Users (Pessoa Física)
```
What They Can Do:
- Apply for jobs posted by companies
- View company profiles and reviews
- Create career profile with qualifications
- Participate in forum discussions
- Access learning resources/courses
- Post on classifieds as seller
- Lease hangars at HangarShare
- Create logbook entries
- Use flight planning tools

What They Cannot Do:
- Post jobs (requires business account)
- Create company profile
- Access hiring dashboard
- Submit timesheets (except as contractor)
- Create flight school courses
```

#### 9.2 Business Users (Pessoa Jurídica)
```
What They Need:
- Job posting capability
- Hiring dashboard / applicant tracker
- Company profile management
- Team member invitations
- Financial/payroll integration
- Candidate communication features
- Analytics & reporting
- Custom branding

Verification Steps:
1. Email verification
2. CNPJ validation via government database
3. Business information review
4. Document verification (optional)
5. Manual admin approval
6. Activation email sent

Time-to-Full-Access:
- Immediate: Email verification, basic features
- 24-48 hours: Admin verification
- Full access: Job posting, hiring dashboard
```

---

## Database Migration Scripts

### 10. Required Migration Files

#### Migration 1: Update Users Table
```sql
-- File: XXX_add_user_type_to_users.sql
ALTER TABLE users
ADD COLUMN user_type VARCHAR(20) DEFAULT 'individual',
ADD COLUMN user_type_verified BOOLEAN DEFAULT false,
ADD COLUMN cnpj VARCHAR(18);

CREATE UNIQUE INDEX idx_users_cnpj ON users(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_users_user_type ON users(user_type);

COMMENT ON COLUMN users.user_type IS 'individual (Pessoa Física) or business (Pessoa Jurídica)';
COMMENT ON COLUMN users.cnpj IS 'Business ID for Pessoa Jurídica users only';
```

#### Migration 2: Create Business Users Table
```sql
-- File: XXX_create_business_users_table.sql
[See schema in section 2.2.2]
```

#### Migration 3: Create Verification Audit Table
```sql
-- File: XXX_create_business_verification_audit.sql
CREATE TABLE business_verification_audit (
  id SERIAL PRIMARY KEY
  business_user_id INTEGER NOT NULL REFERENCES business_users(id)
  status_from VARCHAR(50)
  status_to VARCHAR(50)
  verified_by INTEGER REFERENCES users(id)
  notes TEXT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Configuration & Environment Variables

### 11. Required Configuration

**Frontend (.env.local):**
```env
# Business registration features
NEXT_PUBLIC_BUSINESS_REGISTRATION_ENABLED=true
NEXT_PUBLIC_BUSINESS_VERIFICATION_REQUIRED=true
NEXT_PUBLIC_BUSINESS_VERIFICATION_TIMEOUT_DAYS=5
```

**Backend Configuration:**
```env
# Rate limiting
REGISTRATION_RATE_LIMIT_ATTEMPTS=3
REGISTRATION_RATE_LIMIT_WINDOW_HOURS=1

# CNPJ Validation
CNPJ_VALIDATION_EXTERNAL_API_ENABLED=false  # Set to true if integrating with government DB

# Email Verification
SEND_VERIFICATION_EMAIL_BUSINESS=true
BUSINESS_VERIFICATION_EMAIL_TEMPLATE=business_verification
```

---

## Reporting & Monitoring

### 12. Key Metrics to Track

**Registration Metrics:**
- Individual registrations per day
- Business registrations per day
- Registration completion rate (started vs completed)
- Form abandonment rate by step
- API error rate for both registration types

**Verification Metrics:**
- Pending verifications queue size
- Average verification time
- Approval vs rejection rate
- Re-submission rate

**Validation Metrics:**
- CPF validation success rate
- CNPJ validation success rate
- CEP lookup success rate
- Rate limit hits

---

## Deployment Checklist

### 13. Pre-Deployment Requirements

- [ ] All database migrations tested in staging
- [ ] API endpoints tested with mock data
- [ ] Form validation working client-side and server-side
- [ ] Error handling implemented for all edge cases
- [ ] Email templates created and tested
- [ ] Rate limiting configured appropriately
- [ ] Admin interface for verification created
- [ ] Documentation updated
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## Summary of Changes Required

### 14. Complete Change List

| Component | Change | Type | Impact |
|-----------|--------|------|--------|
| Users Table | Add `user_type` column | Schema | Breaking |
| Users Table | Add `cnpj` column | Schema | Breaking |
| Users Table | Add `user_type_verified` column | Schema | Breaking |
| business_users | Create new table | Schema | New |
| LandingPage | Add UserTypeSelectionModal | Frontend | UX |
| RegisterForm | Extract to IndividualRegisterForm | Frontend | Refactor |
| N/A | Create BusinessRegisterForm | Frontend | New |
| /api/auth/register | Add userType parameter handling | Backend | Enhancement |
| N/A | Create /api/auth/register-business | Backend | New Endpoint |
| N/A | Create /api/auth/check-document | Backend | New Endpoint |
| N/A | Create validation utilities for CNPJ | Backend | New Utilities |
| AuthContext | Update user object structure | Frontend | Minor |
| Users Dashboard | Add business-specific features | Frontend | Enhancement |

---

## Conclusion

The proposed **two-tier registration system** provides a clean, scalable architecture for supporting both individual and business users on the Love to Fly platform:

### Key Advantages
1. **Separation of Concerns** - Individual and business data stored appropriately
2. **Scalable** - Business users can grow into multi-team structures later
3. **Compliance** - Distinct user types support proper legal documentation
4. **User Experience** - Clear path for each user type from registration
5. **Business Logic** - Enables company-specific features (hiring, payroll, etc.)

### Implementation Effort
- **Estimated Development Time:** 2-3 weeks
- **Database Changes:** Low-risk (additive, backward-compatible with proper migration)
- **Frontend Changes:** Moderate (new components, updated flows)
- **Backend Changes:** Moderate (new endpoints, enhanced validation)

### Next Steps (Awaiting User Decision)
1. Approve/modify proposed architecture
2. Prioritize feature implementation
3. Assign development resources
4. Schedule migration execution
5. Plan rollout strategy (phased vs. all-at-once)

---

**Report Status:** ✅ Analysis Complete - Awaiting User Feedback and Decision

**No Further Actions Will Be Taken Until User Confirms Next Steps**

---

*Report prepared on February 10, 2026*  
*Love to Fly Portal - Business User Registration Implementation Analysis*
