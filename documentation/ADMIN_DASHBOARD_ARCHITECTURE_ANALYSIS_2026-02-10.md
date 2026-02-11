# Admin Dashboard Architecture Analysis
**Date:** February 10, 2026  
**Status:** Analysis & Recommendations (No Actions Taken)  
**Prepared For:** Review & Decision

---

## Executive Summary

The portal currently has:
- **One Master Admin Dashboard** (`/admin`) with full system access
- **Role-based access control** defined in `accessControl.ts` with 8 role levels
- **Hybrid document review system** - Business documents tied to HangarShare only
- **No dedicated staff member dashboards** for individual role types

This report analyzes:
1. Current registration flow (No document upload required for business users initially)
2. Dashboard structure & access patterns
3. Role/permission hierarchy
4. Gaps in staff-level dashboards
5. Recommended architecture for role-specific dashboards

---

## Part 1: Current Business User Registration Flow

### Registration Process (pessoa jurídica)
**File:** `/src/app/api/auth/register/route.ts`

**Data Collected BUT NO DOCUMENT REQUIRED:**
- Legal Information: CNPJ, Legal Name, Business Name, Business Type
- Contact Info: Email, Phone, Website
- Headquarters Address: Street, Number, City, State, CEP, Country
- Business Details: Size, Industry, Description, Established Year
- Hiring Volume & Operations Info
- **Document Upload: NOT triggered at registration**

**Database State After Registration:**
```
users table:
├── user_type = 'business'
├── user_type_verified = false
├── cnpj = validated CNPJ
└── plan = 'free'

business_users table:
├── verification_status = 'pending'
├── All 30+ business fields populated
└── is_verified = false (default)
```

**User Redirect Flow:**
```
Registration Submit
    ↓
API Validation & CNPJ Check
    ↓
Transaction: Create users + business_users
    ↓
✓ Success
    ↓
→ /business/pending-verification page
    ├── Show "In Review" message
    ├── Display registered business info
    ├── Timeline: 1-5 day verification
    ├── Resend Email button
    └── FAQ & Support info
```

### Current Document Review Locations

**1. HangarShare Owner Documents** (`/admin/hangarshare/owner-documents`)
   - Status: `uploaded | pending | verified | rejected`
   - Document Types: Lease agreements, insurance, ownership proofs
   - Permission Check: `role === 'master' || 'admin' || 'staff'`
   - **Limitation:** Only reviewable AFTER owner setup for HangarShare

**2. General Documents** (`/admin/documents`)
   - Supports: CPF, CNH, ID documents
   - Fields: `owner_company`, `owner_cnpj`, `owner_verification_status`
   - **Current State:** Not actively used for business user verification
   - **Issue:** No document upload trigger at business registration

**3. No Centralized Business Verification Module**
   - ❌ Business registration documents not auto-listed for review
   - ❌ No separate "Business User Verification Queue"
   - ❌ Verification workflow manual/unclear

---

## Part 2: Current Admin Dashboard Structure

### Master Admin Dashboard (`/admin/page.tsx`)

**Defined 9 Modules (All Visible to Master):**

| Module | Key | Status | Metrics Shown |
|--------|-----|--------|---------------|
| HangarShare | `hangarshare` | HIGH | Pending verifications, Pending listings |
| Reservas | `bookings` | HIGH | Active bookings, Bookings today |
| Anúncios | `listings` | NORMAL | Pending, Total |
| Usuários | `users` | NORMAL | Total users, New today |
| Moderação | `moderation` | NORMAL | Open cases, Escalations |
| Finanças | `finance` | LOW | Total revenue, Pending invoices |
| Conformidade | `compliance` | LOW | Compliance pending, Audits |
| Marketing | `marketing` | LOW | Active campaigns, Leads |
| Traslados | `traslados` | HIGH | Pending requests, Pilot assignments |

**Current Access Pattern:**
```
User with user.role = 'master'
    ↓
Passes authentication check: user.role === 'master' ✓
    ↓
Sees full admin dashboard with all 9 modules
    ↓
Direct links to each module
```

**Sidebar Navigation:**
- 9 module cards
- Sub-items for detailed views
- Color-coded metrics (Red=Urgent, Yellow=Pending, Green=Active, Blue=Info)

---

## Part 3: Role Hierarchy & Permissions System

### Defined Roles (8 Levels)
**File:** `/src/app/admin/accessControl.ts`

```typescript
Hierarchy (Top → Bottom):
1. MASTER (Super Admin) - All permissions
2. OPERATIONS_LEAD - System management
3. SUPPORT_LEAD - Support operations
4. CONTENT_MANAGER - Content management
5. BUSINESS_MANAGER - Business operations
6. FINANCE_MANAGER - Financial operations
7. MARKETING - Marketing operations
8. COMPLIANCE - Compliance & audit
```

### Permission Matrix

| Role | manage_system | manage_support | manage_content | manage_business | manage_finance | manage_marketing | manage_compliance | view_reports | escalate_issues |
|------|---------------|----------------|----------------|-----------------|----------------|-----------------|------------------|-------------|-----------------|
| MASTER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| OPERATIONS_LEAD | ✓ | | | | | | | ✓ | ✓ |
| SUPPORT_LEAD | | ✓ | | | | | | ✓ | ✓ |
| CONTENT_MANAGER | | | ✓ | | | | | ✓ | ✓ |
| BUSINESS_MANAGER | | | | ✓ | | | | ✓ | ✓ |
| FINANCE_MANAGER | | | | | ✓ | | | ✓ | ✓ |
| MARKETING | | | | | | ✓ | | ✓ | ✓ |
| COMPLIANCE | | | | | | | ✓ | ✓ | ✓ |

### Assignment Rules
- Master can assign any below-level role
- Operations Lead can assign Support, Content, Business, etc.
- Each role can only assign to roles below their level
- Cannot assign to self or higher-level roles

---

## Part 4: Staff User Management

### Current Staff Dashboard Status
**❌ NOT IMPLEMENTED**

**What Exists:**
1. UserManagementPanel component receives `currentRole` parameter
2. Individual staff members can be assigned roles via `/admin/users` page
3. No role-specific dashboard views (all roles see same Master layout)

**Current Flow for Staff Users:**
```
Staff User Login
    ↓
Check: user.role === 'master' || 'admin' || 'staff'
    ↓
If passed:
    ├── Redirect to /admin (Master dashboard)
    └── See full module list (same as Master)
    
If failed:
    └── Redirect to / (home page)
```

**Problems:**
- ❌ Support Lead sees Finance module (shouldn't)
- ❌ Marketing Manager sees Compliance tools (shouldn't)
- ❌ No granular permission enforcement in UI
- ❌ All non-master users treated as generic "staff"
- ❌ No role-specific dashboards

---

## Part 5: Business User Verification Gap

### Current State: Unclear Verification Workflow

**What Should Happen (Desired):**
```
Business User Registers
    ├── No document upload at this stage ✓ (User request)
    ├── Ask about HangarShare plans
    └── Redirect to pending-verification page

    ↓ (Admin Action Needed)

Admin Reviews Business Profile
    ├── Validates CNPJ
    ├── Reviews submitted business information
    ├── May request additional documents IF needed
    └── Approves or Rejects

    ↓ (After Approval)

Business User Gets Access to:
    ├── Main portal features
    ├── HangarShare (if selected)
    └── Document upload IF HangarShare needed
```

**Actual Current State:**
- ✓ Registration creates pending record
- ❌ No admin queue for business verification
- ❌ Documents only reviewed in HangarShare context
- ❌ No "Business Verification Dashboard" for admins
- ❌ Verification status change mechanism unclear

### Missing Module: Business User Verification

**Should be added to admin dashboard:**
```
Módulo: Verificação de Empresas
├── Pendente: Count of businesses awaiting verification
├── Aprovadas: Count approved
├── Rejeitadas: Count rejected
├── Documentos Solicitados: Count waiting for docs
└── Sub-items:
    ├── Fila de Verificação (status=pending)
    ├── Aguardando Documentos (status=docs_requested)
    ├── Histórico (status=approved|rejected)
    └── Relatório de Conformidade
```

---

## Part 6: Recommended Dashboard Architecture

### Option A: Tiered Role-Specific Dashboards (RECOMMENDED)

**Create 8 Separate Dashboards - One Per Role**

```
/admin/dashboard/[role]/page.tsx

├── /admin/dashboard/master/
│   ├── All 9 modules
│   ├── System health
│   ├── Cross-module analytics
│   └── Staff management
│
├── /admin/dashboard/operations-lead/
│   ├── HangarShare
│   ├── Traslados
│   ├── Reservas
│   ├── Usuários
│   ├── System logs
│   └── Incident reports
│
├── /admin/dashboard/support-lead/
│   ├── Usuários
│   ├── Moderação
│   ├── Support tickets
│   ├── SLA tracking
│   └── Escalations
│
├── /admin/dashboard/business-manager/
│   ├── Verificação de Empresas [NEW]
│   ├── Usuários (filter: businesses only)
│   ├── Anúncios
│   ├── HangarShare
│   └── Business metrics
│
├── /admin/dashboard/compliance/
│   ├── Conformidade
│   ├── Verificação de Empresas [NEW]
│   ├── Auditoria
│   ├── KYC/KYB
│   └── Compliance reports
│
├── /admin/dashboard/finance-manager/
│   ├── Finanças
│   ├── Invoices
│   ├── Revenue reports
│   └── Financial analytics
│
├── /admin/dashboard/marketing/
│   ├── Marketing
│   ├── Campanhas
│   ├── Leads
│   └── Campaign analytics
│
└── /admin/dashboard/content-manager/
    ├── Conteúdo (if exists)
    ├── FAQ management
    ├── Documentation
    └── Content analytics
```

### Option B: Hybrid Approach (SIMPLER)

**Keep Master Dashboard, Add Role-Based Filtering**

```
/admin/dashboard/role-adaptive/

Single dashboard that:
├── Detects user role
├── Shows only relevant modules
├── Permission checks on all module links
├── Same layout, filtered content
└── Easier to maintain
```

### Recommended Approach: **Option A (Tiered Dashboards)**

**Advantages:**
- Clear role-specific workflows
- Enhanced security (only see relevant data)
- Better UX for specialized staff
- Scalable to new roles
- Audit trail per role
- Can customize metrics per role

---

## Part 7: Implementation Plan for Business User Verification

### New Module: "Verificação de Empresas" (Business Verification)

**Target Roles:** Master, Business Manager, Compliance

**Database Schema Needed:**
```sql
-- Already exists but needs status tracking
business_users table columns:
├── verification_status (pending|approved|rejected|docs_requested)
├── verified_by (admin user_id)
├── verified_at (timestamp)
├── verification_notes (text)
└── documents_requested (JSON array)

-- Track verification audit trail
business_verification_audit table:
├── id (PK)
├── business_user_id
├── admin_id
├── action (review|request_docs|approve|reject)
├── notes
├── created_at
└── documents_list
```

**Admin Dashboard Items:**

1. **Fila de Verificação** - Businesses awaiting review
   - Show: CNPJ, Legal Name, Business Type, Submitted Date
   - Actions: View full profile, Request documents, Approve, Reject
   - Filter: By industry, by submission date, by location

2. **Aguardando Documentos** - Waiting for additional docs
   - Show: Business name, Requested docs, Request date
   - Actions: View uploaded docs, Resend request, Approve, Reject
   - Auto-escalate if overdue (7+ days)

3. **Aprovadas Recentemente** - Recently verified (30 days)
   - Show: Business name, Approval date, Approver
   - Actions: View profile, Revert approval (if needed)

4. **Rejeitadas** - Denied applications
   - Show: Business name, Rejection reason, Rejection date
   - Actions: View profile, Allow resubmission

**Document Upload Flow (Conditional):**

```
If Business Selects HangarShare:
├── During registration OR
└── From pending-verification page
    └── Trigger document upload modal
        ├── Insurance certificate
        ├── Business license
        ├── Ownership proof
        └── Additional as needed

Admin Reviews:
├── Through /admin/documents (if general)
├── Or /admin/hangarshare/owner-documents (if HangarShare)
└── Updates business_users.verification_status
```

---

## Part 8: Current Gaps & Risks

### Gap 1: No Business Verification Queue
- ❌ New business users register successfully
- ❌ Admin has no central place to review them
- ❌ Verification happens implicitly (no clear workflow)
- **Impact:** Manual tracking required, SLAs not enforced

### Gap 2: No Staff-Specific Dashboards
- ❌ All staff roles see Master dashboard
- ❌ Support Lead can access Finance data
- ❌ No role enforcement at UI level
- **Impact:** Data leakage risk, poor UX, confusion

### Gap 3: Document Upload Not Integrated
- ❌ Business users register without documents
- ❌ If HangarShare needed, docs required separately
- ❌ Verification and document review separate workflows
- **Impact:** Friction, unclear process, compliance issues

### Gap 4: Missing Audit Trail
- ❌ No tracking of who verified which business
- ❌ No timestamp of verification actions
- ❌ Cannot revert inappropriate approvals
- **Impact:** Compliance risk, accountability gap

### Gap 5: No SLA/Escalation for Business Verification
- ❌ No target time to verify (e.g., 1-5 days promised)
- ❌ No auto-escalation if overdue
- ❌ Manual follow-up required
- **Impact:** Inconsistent user experience

---

## Part 9: Module Mapping by Role

### Master Admin
```
Access: ALL modules
├── HangarShare (Full)
├── Reservas (Full)
├── Anúncios (Full)
├── Usuários (Full)
├── Moderação (Full)
├── Finanças (Full)
├── Conformidade (Full)
├── Marketing (Full)
├── Traslados (Full)
├── Verificação de Empresas (Full) [NEW]
└── Staff Management (Full)
```

### Operations Lead
```
Access: Operations-focused modules
├── HangarShare (Read/Write)
├── Traslados (Read/Write)
├── Reservas (Read-only)
├── Usuários (Read-only)
└── System Health (Dashboard-level)
```

### Support Lead
```
Access: Support-focused modules
├── Usuários (Read/Write for support)
├── Moderação (Read/Write)
├── Support Tickets (Read/Write) [IF EXISTS]
├── Escalations (Read/Write)
└── SLA Tracking (Read-only)
```

### Business Manager
```
Access: Business-focused modules
├── Verificação de Empresas (Full) [NEW]
├── Usuários (Filter: businesses only)
├── Anúncios (HangarShare)
├── HangarShare (Listing review)
└── Business Metrics (Read-only)
```

### Compliance Officer
```
Access: Compliance-focused modules
├── Conformidade (Full)
├── Verificação de Empresas (Full) [NEW]
├── Auditoria (Full)
├── KYC/KYB (Full)
├── Documents (Full)
└── Audit Logs (Read-only)
```

### Finance Manager
```
Access: Finance-focused modules
├── Finanças (Full)
├── Invoices (Full)
├── Revenue Reports (Full)
└── Financial Analytics (Read-only)
```

### Marketing Manager
```
Access: Marketing-focused modules
├── Marketing (Full)
├── Campanhas (Full)
├── Leads (Full)
└── Analytics (Read-only)
```

### Content Manager
```
Access: Content-focused modules
├── Conteúdo (Full) [IF EXISTS]
├── FAQ Management (Full)
├── Documentation (Full)
└── Content Analytics (Read-only)
```

---

## Part 10: Recommended Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create `/admin/dashboard` folder structure
- [ ] Move current `/admin/page.tsx` to `/admin/dashboard/master/page.tsx`
- [ ] Implement role detection & redirect logic
  ```
  /admin → redirects to /admin/dashboard/[role]/
  ```
- [ ] Add permission check middleware

### Phase 2: Role-Specific Dashboards (Week 3-4)
- [ ] Create 7 role-specific dashboard components
- [ ] Implement module filtering per role
- [ ] Add role-specific metrics/KPIs
- [ ] Test permission enforcement

### Phase 3: Business Verification Module (Week 5-6)
- [ ] Create "Verificação de Empresas" module
- [ ] Build pending business queue view
- [ ] Implement verification actions (approve/reject/request-docs)
- [ ] Add audit logging for verification actions
- [ ] Create dashboard cards for Business Manager & Compliance roles

### Phase 4: Integration & Polish (Week 7)
- [ ] Connect document upload flow to business registration
- [ ] Add SLA tracking for verification (1-5 day promise)
- [ ] Implement escalations for overdue reviews
- [ ] Add analytics per role
- [ ] Testing & QA

### Phase 5: Documentation & Deployment (Week 8)
- [ ] Admin role guide documentation
- [ ] Staff onboarding materials
- [ ] Permission reference guide
- [ ] Gradual rollout with testing

---

## Part 11: Database Changes Needed

### Existing Tables (Modifications)
```sql
-- Update business_users table
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS (
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  documents_status VARCHAR(50) DEFAULT 'pending'
);

-- Already have
-- verification_status VARCHAR(50) DEFAULT 'pending'
-- is_verified BOOLEAN DEFAULT false
```

### New Audit Table
```sql
CREATE TABLE business_verification_audit (
  id SERIAL PRIMARY KEY,
  business_user_id INTEGER NOT NULL REFERENCES business_users(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- review|request_docs|approve|reject
  status_before VARCHAR(50),
  status_after VARCHAR(50),
  notes TEXT,
  documents_requested JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_user_id) REFERENCES business_users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_business_user_id (business_user_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
);
```

---

## Summary & Recommendations

### What IS Working ✓
1. Business registration without mandatory docs
2. Role/permission system defined
3. HangarShare document verification for owners
4. Master dashboard with module structure

### What NEEDS Implementation ✗
1. **Role-specific dashboards** (8 separate views)
2. **Business verification queue** (management module)
3. **Staff member permission enforcement** (UI level)
4. **Document upload integration** (for businesses needing HangarShare)
5. **Audit trail** (who verified what, when)
6. **SLA tracking** (1-5 day promise notification)

### Critical Decision Points

**Q1: Should verification be required for all businesses or HangarShare-only?**
- Current: HangarShare only (documents conditional)
- Recommend: All businesses get base verification (CNPJ validation at minimum)

**Q2: Should staff dashboards be separate or filtered views of Master?**
- Option A: Separate dashboards (more secure, better UX)
- Option B: Filtered Master dashboard (easier to maintain)
- **Recommend: Option A** (8 separate dashboard files)

**Q3: How quickly to implement?**
- Minimum: 4-6 weeks for full implementation
- Quick win: 1-2 weeks for Business Manager verification module only

**Q4: Should non-Master admins be able to assign roles?**
- Current: Not clearly implemented
- Recommend: Master only, OR Operations Lead can assign below roles

---

## Next Steps (For Your Decision)

Please review and decide:

1. ✅ Approve tiered dashboard architecture (Option A)?
2. ✅ Prioritize Business Verification module?
3. ✅ Target timeline for implementation?
4. ✅ Should verification be mandatory for all or HangarShare-only?
5. ✅ Who should have Business Verification access? (Master + Business Manager + Compliance?)

Once decisions are made, implementation can proceed immediately.

---

**Report prepared by:** AI Assistant  
**Date:** February 10, 2026  
**Status:** Ready for Review & Decision
