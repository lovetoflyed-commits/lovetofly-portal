# Database Configuration Correction — 2026-02-11

## Critical Correction to Previous Documentation

### Error Identified
The documentation created earlier today (2026-02-11) incorrectly stated:
> "This project uses ONLY ONE database: Neon PostgreSQL (Cloud)"
> "DO NOT use any local database, mock database, or test database unless explicitly instructed."

**This was WRONG and would have prevented local development.**

### Actual Configuration
The project supports **TWO valid database configurations**:

1. **Production/Cloud**: Neon PostgreSQL (via `DATABASE_URL`)
2. **Local Development**: Local PostgreSQL with database name `lovetofly-portal`

### Evidence from Code

#### src/config/db.ts (lines 4-14)
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback para variáveis individuais se DATABASE_URL não estiver definida
  ...(process.env.DATABASE_URL ? {} : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lovetofly-portal', // ⚠️ Local database name
    password: process.env.DB_PASSWORD || 'Master@51',
    port: Number(process.env.DB_PORT) || 5432,
  }),
});
```

The fallback configuration clearly shows support for local PostgreSQL development.

### Problem Discovered
User pointed out:
> "the project local db running at postgres in use must be lovetofly-portal and it can't be changed"

This revealed that:
1. The project DOES support local development
2. The local database name is `lovetofly-portal` (with hyphen)
3. This name cannot be changed (hardcoded in multiple places)

### Additional Issue Found
**.env.example had wrong database name**:
- **Before**: `DB_NAME=lovetofly_portal` (underscore) ❌
- **After**: `DB_NAME=lovetofly-portal` (hyphen) ✅

### Corrections Made

#### 1. .github/copilot-instructions.md
**Before**:
```
### ⚠️ IMPORTANT: Single Source of Truth
**This project uses ONLY ONE database: Neon PostgreSQL (Cloud)**
```

**After**:
```
### ⚠️ IMPORTANT: Dual Database Configuration
**This project supports TWO database configurations:**
1. Production/Cloud: Neon PostgreSQL via DATABASE_URL
2. Local Development: Local PostgreSQL with database name 'lovetofly-portal'
```

#### 2. docs/records/active/DATABASE_GUIDE_2026-02-11.md
**Before**:
```
## ⚠️ CRITICAL: Single Database Policy
**This project uses ONLY ONE database: Neon PostgreSQL (Cloud)**
```

**After**:
```
## ⚠️ CRITICAL: Dual Database Configuration Policy
**This project supports TWO database configurations:**
1. Production/Cloud: Neon PostgreSQL (Cloud) - Used in production
2. Local Development: Local PostgreSQL - Database name MUST be 'lovetofly-portal'
```

#### 3. AGENT_START_HERE.md
**Before**:
```
- O banco de dados web está na Neon (PostgreSQL) - **NUNCA use banco de dados local ou mock sem instrução explícita**.
```

**After**:
```
- **Banco de dados**:
  - **Produção/Cloud**: Neon PostgreSQL (configurado via `DATABASE_URL`)
  - **Desenvolvimento Local**: PostgreSQL local com nome do banco `lovetofly-portal`
```

#### 4. .env.example
**Before**:
```
DB_NAME=lovetofly_portal
```

**After**:
```
# NOTE: Local database name MUST be 'lovetofly-portal' (with hyphen)
DB_NAME=lovetofly-portal
```

### Correct Configuration Examples

#### For Production/Cloud
```bash
# .env
DATABASE_URL=postgresql://neondb_owner:password@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### For Local Development (Option 1)
```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/lovetofly-portal
```

#### For Local Development (Option 2)
```bash
# .env
# Don't set DATABASE_URL, use individual variables instead
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lovetofly-portal
DB_PASSWORD=yourpassword
DB_PORT=5432
```

### Database Name Requirements

**CRITICAL**: The local database name MUST be `lovetofly-portal` with a **hyphen** (not underscore) because:

1. It's hardcoded in `src/config/db.ts` line 10
2. Multiple scripts use this name:
   - `test-api.js`
   - `create-table.js`
   - `migrate-config.js`
   - `scripts/check-hangarshare-advertiser.js`
3. Historical documentation references this name
4. Cannot be changed without breaking existing migrations and scripts

### How the Configuration Works

1. **If `DATABASE_URL` is set**: Uses that connection (production or local)
2. **If `DATABASE_URL` is NOT set**: Uses fallback with individual `DB_*` variables
3. **Priority**: `DATABASE_URL` > individual `DB_*` variables

### Verification

All documentation has been updated to reflect this dual configuration:
- ✅ .github/copilot-instructions.md
- ✅ docs/records/active/DATABASE_GUIDE_2026-02-11.md
- ✅ AGENT_START_HERE.md
- ✅ .env.example
- ✅ logbook/AGENT_ACTIONS_LOG.md
- ✅ Stored corrected memory

### Lessons Learned

1. **Always check the actual code** before making absolute statements
2. **Look for fallback configurations** - they usually indicate dual-mode support
3. **Test assumptions** - "production only" claims should be verified
4. **Local development is important** - developers need to run code locally

### Impact

**Before Correction**:
- Documentation would have prevented local development ❌
- Developers would be confused about local setup ❌
- Wrong database name in .env.example would cause connection errors ❌

**After Correction**:
- Clear guidance for both production and local development ✅
- Correct database name documented ✅
- Developers can work locally without issues ✅

## Summary

The initial documentation was created with good intentions (preventing database confusion) but was **too restrictive**. The correction maintains clarity while supporting the actual dual-configuration design of the project.

**Key Takeaway**: The project properly supports both production (Neon) and local development (local PostgreSQL with database name `lovetofly-portal`). Both configurations use the same `src/config/db.ts` singleton.

---

**Correction Date**: 2026-02-11  
**Issue**: Overly restrictive database documentation  
**Resolution**: Updated all documentation to reflect dual-database support  
**Status**: ✅ Corrected and Verified
