# HangarShare Database Schema Analysis
**Date:** January 6, 2026  
**Status:** ⚠️ INCOMPLETE - Missing Critical Fields

---

## Executive Summary

**Result:** ❌ **Database schema is INCOMPLETE** for HangarShare registration forms.

**Critical Issues Found:**
1. **hangar_listings** table missing 8+ fields from the form
2. **hangar_owners** table missing 2 optional fields
3. No photo storage structure implemented

---

## Analysis: Registration Forms vs Database Tables

### 1️⃣ Owner Setup Form (`/hangarshare/owner/setup`)

#### ✅ Fields Covered in `hangar_owners` table:
| Form Field | DB Column | Type | Status |
|------------|-----------|------|--------|
| Company Name | `company_name` | VARCHAR(255) | ✅ EXISTS |
| CNPJ | `cnpj` | VARCHAR(18) | ✅ EXISTS |
| Bank Code | `bank_code` | VARCHAR(10) | ✅ EXISTS |
| Bank Agency | `bank_agency` | VARCHAR(10) | ✅ EXISTS |
| Bank Account | `bank_account` | VARCHAR(20) | ✅ EXISTS |
| Account Holder Name | `account_holder_name` | VARCHAR(255) | ✅ EXISTS |

#### ⚠️ Extra Fields in DB (not in form):
- `first_name` VARCHAR(100) - Not used in form
- `last_name` VARCHAR(100) - Not used in form
- `email` VARCHAR(255) - Not used in form
- `phone` VARCHAR(20) - Not used in form
- `company_website` VARCHAR(255) - Not used in form
- `tax_id` VARCHAR(50) - Not used in form

**Note:** Migration `008_create_hangar_owners_table.sql` has extra fields, but the actual deployed table (from `027_create_hangar_owners_table.sql`) is simplified and matches the form perfectly.

**Verdict:** ✅ **Owner Setup form is FULLY COVERED**

---

### 2️⃣ Listing Creation Form (`/hangarshare/listing/create`)

#### Form Fields Analysis (4 Steps):

**STEP 1 - Location:**
| Form Field | DB Column | Type | Status |
|------------|-----------|------|--------|
| `icaoCode` | `icao_code` | VARCHAR(4) | ✅ EXISTS |
| `airportData.airport_name` | `aerodrome_name` | VARCHAR(255) | ✅ EXISTS |
| `airportData.city` | `city` | VARCHAR(100) | ✅ EXISTS |
| `airportData.state` | `state` | VARCHAR(2) | ✅ EXISTS |
| `airportData.country` | `country` | VARCHAR(100) | ✅ EXISTS |

**STEP 2 - Characteristics:**
| Form Field | DB Column | Type | Status |
|------------|-----------|------|--------|
| `hangarNumber` | `hangar_number` | VARCHAR(20) | ✅ EXISTS |
| `hangarSizeSqm` | `size_sqm` | INTEGER | ✅ EXISTS |
| `maxWingspanMeters` | `max_wingspan` | NUMERIC(6,2) | ✅ EXISTS |
| `maxLengthMeters` | `max_length` | NUMERIC(6,2) | ✅ EXISTS |
| `maxHeightMeters` | `max_height` | NUMERIC(6,2) | ✅ EXISTS |
| `hangarLocationDescription` | ❌ **MISSING** | TEXT | ❌ NOT IN DB |
| `photos` (File[]) | ❌ **MISSING** | - | ❌ NOT IN DB |
| Photo previews | `image_url` | VARCHAR(255) | ⚠️ SINGLE URL ONLY |

**STEP 3 - Pricing & Availability:**
| Form Field | DB Column | Type | Status |
|------------|-----------|------|--------|
| `hourlyRate` | ❌ **MISSING** | NUMERIC(12,2) | ❌ NOT IN DB |
| `dailyRate` | `daily_rate` | NUMERIC(12,2) | ✅ EXISTS |
| `weeklyRate` | `weekly_rate` | NUMERIC(12,2) | ✅ EXISTS |
| `monthlyRate` | `monthly_rate` | NUMERIC(12,2) | ✅ EXISTS |
| `availableFrom` | ❌ **MISSING** | TIMESTAMP | ❌ NOT IN DB |
| `availableUntil` | ❌ **MISSING** | TIMESTAMP | ❌ NOT IN DB |
| `acceptsOnlinePayment` | ❌ **MISSING** | BOOLEAN | ❌ NOT IN DB |
| `acceptsPaymentOnArrival` | ❌ **MISSING** | BOOLEAN | ❌ NOT IN DB |
| `acceptsPaymentOnDeparture` | ❌ **MISSING** | BOOLEAN | ❌ NOT IN DB |
| `cancellationPolicy` | ❌ **MISSING** | VARCHAR(50) | ❌ NOT IN DB |

**STEP 4 - Additional Info:**
| Form Field | DB Column | Type | Status |
|------------|-----------|------|--------|
| `description` | `description` | TEXT | ✅ EXISTS |
| `specialNotes` | ❌ **MISSING** | TEXT | ❌ NOT IN DB |

**Verdict:** ❌ **Listing form is INCOMPLETE - 10 fields missing from database**

---

## Current Database Schema

### Table: `hangar_owners`
```sql
CREATE TABLE hangar_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  bank_agency VARCHAR(10) NOT NULL,
  bank_account VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ✅ Complete for owner setup form

---

### Table: `hangar_listings`
```sql
CREATE TABLE hangar_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES hangar_owners(id) ON DELETE CASCADE,
  icao_code VARCHAR(4) NOT NULL,
  aerodrome_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  country VARCHAR(100) NOT NULL,
  hangar_number VARCHAR(20) NOT NULL,
  size_sqm INTEGER NOT NULL,
  max_wingspan NUMERIC(6,2),
  max_length NUMERIC(6,2),
  max_height NUMERIC(6,2),
  daily_rate NUMERIC(12,2),
  weekly_rate NUMERIC(12,2),
  monthly_rate NUMERIC(12,2),
  description TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  image_url VARCHAR(255)
);
```
**Status:** ❌ Incomplete - missing 10 fields from form

---

## Missing Fields Summary

### Critical Missing Fields (Form → DB):

1. **`hangar_location_description`** (TEXT)
   - Form field: `hangarLocationDescription`
   - Usage: "Próximo à pista 03, setor norte, fácil acesso"
   - Priority: **MEDIUM** (Nice to have for user experience)

2. **`hourly_rate`** (NUMERIC(12,2))
   - Form field: `hourlyRate`
   - Usage: R$ por hora pricing option
   - Priority: **HIGH** (Critical pricing option)

3. **`available_from`** (TIMESTAMP or DATE)
   - Form field: `availableFrom`
   - Usage: Start date of availability
   - Priority: **HIGH** (Required field in form)

4. **`available_until`** (TIMESTAMP or DATE)
   - Form field: `availableUntil`
   - Usage: End date of availability (nullable)
   - Priority: **MEDIUM** (Optional but in form)

5. **`accepts_online_payment`** (BOOLEAN)
   - Form field: `acceptsOnlinePayment`
   - Usage: Payment method flag
   - Priority: **HIGH** (Critical for booking flow)

6. **`accepts_payment_on_arrival`** (BOOLEAN)
   - Form field: `acceptsPaymentOnArrival`
   - Usage: Payment method flag
   - Priority: **HIGH** (Critical for booking flow)

7. **`accepts_payment_on_departure`** (BOOLEAN)
   - Form field: `acceptsPaymentOnDeparture`
   - Usage: Payment method flag
   - Priority: **HIGH** (Critical for booking flow)

8. **`cancellation_policy`** (VARCHAR(50))
   - Form field: `cancellationPolicy`
   - Usage: 'flexible', 'moderate', 'strict'
   - Priority: **HIGH** (Important for user trust)

9. **`special_notes`** (TEXT)
   - Form field: `specialNotes`
   - Usage: Additional information
   - Priority: **LOW** (Can be combined with description)

10. **Photo Storage System**
    - Form field: `photos` (File[])
    - Current: Only `image_url` VARCHAR(255) for single URL
    - Priority: **CRITICAL** (Multiple photos required)
    - **Action needed:** Create `hangar_photos` table or JSON array column

---

## Photo Storage Gap

### Current Issue:
- Form collects: **Multiple photos** (`File[]`)
- Database has: **Single URL** (`image_url VARCHAR(255)`)

### Options to Fix:

**Option 1: Separate Photos Table (RECOMMENDED)**
```sql
CREATE TABLE hangar_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangar_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_hangar_photos_hangar_id ON hangar_photos(hangar_id);
```

**Option 2: JSON Array Column**
```sql
ALTER TABLE hangar_listings ADD COLUMN photos JSONB DEFAULT '[]';
```

**Option 3: Multiple URL Columns**
```sql
ALTER TABLE hangar_listings ADD COLUMN photo_url_1 VARCHAR(500);
ALTER TABLE hangar_listings ADD COLUMN photo_url_2 VARCHAR(500);
ALTER TABLE hangar_listings ADD COLUMN photo_url_3 VARCHAR(500);
-- ... up to 10 photos
```

**Recommendation:** Use **Option 1** (separate table) for better scalability and querying.

---

## Required Migration Script

### File: `src/migrations/XXX_add_missing_hangar_listing_fields.sql`

```sql
-- Add missing fields to hangar_listings table
-- Date: 2026-01-06

-- Pricing
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12,2);

-- Availability dates
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS available_until DATE;

-- Payment methods
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS accepts_online_payment BOOLEAN DEFAULT TRUE;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS accepts_payment_on_arrival BOOLEAN DEFAULT TRUE;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS accepts_payment_on_departure BOOLEAN DEFAULT FALSE;

-- Policy
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50) DEFAULT 'flexible';

-- Descriptions
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS hangar_location_description TEXT;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- Create separate photos table
CREATE TABLE IF NOT EXISTS hangar_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangar_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hangar_photos_hangar_id ON hangar_photos(hangar_id);
CREATE INDEX IF NOT EXISTS idx_hangar_photos_primary ON hangar_photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_hangar_photos_order ON hangar_photos(hangar_id, display_order);

-- Add comment for documentation
COMMENT ON COLUMN hangar_listings.cancellation_policy IS 'Options: flexible, moderate, strict';
COMMENT ON TABLE hangar_photos IS 'Stores multiple photos per hangar listing';
```

---

## API Impact Assessment

### Files Needing Updates After Migration:

1. **`src/app/api/hangarshare/listing/create/route.ts`** (TO BE CREATED)
   - Needs to handle all new fields
   - Must process photo uploads to S3/storage
   - Insert into both `hangar_listings` and `hangar_photos` tables

2. **`src/app/api/hangarshare/listing/[id]/route.ts`** (UPDATE)
   - GET: Return all new fields including photos array
   - PUT: Update all fields (when edit feature is implemented)

3. **`src/app/api/hangarshare/search/route.ts`** (UPDATE)
   - Include payment method filters
   - Include date availability filters
   - Join with `hangar_photos` to return primary photo

4. **Frontend Components:**
   - `src/app/hangarshare/listing/create/page.tsx` - Already ready for new fields
   - Photo upload component needs AWS S3 integration

---

## Action Items Priority

### 🔴 **CRITICAL (Must do before production):**
1. ✅ Run migration to add 10 missing columns
2. ✅ Create `hangar_photos` table
3. 🔧 Implement photo upload to AWS S3/storage
4. 🔧 Create POST `/api/hangarshare/listing/create` endpoint
5. 🔧 Update all search/detail APIs to return new fields

### 🟡 **HIGH (Needed for full functionality):**
6. Implement photo upload UI integration
7. Update search filters for payment methods
8. Add date availability validation logic
9. Implement cancellation policy display

### 🟢 **MEDIUM (Enhancement):**
10. Add photo reordering functionality
11. Add photo deletion functionality
12. Validate hourly/daily/weekly/monthly rate logic

---

## Testing Checklist

After migration:
- [ ] Run migration successfully
- [ ] Verify all new columns exist in `hangar_listings`
- [ ] Verify `hangar_photos` table created
- [ ] Test INSERT with all form fields
- [ ] Test photo upload to storage
- [ ] Test INSERT into `hangar_photos` table
- [ ] Test JOIN query: `hangar_listings` + `hangar_photos`
- [ ] Test search with new filters
- [ ] Test detail page with multiple photos

---

## Conclusion

**Current State:** ❌ Database schema is **incomplete** and cannot store all data from the registration forms.

**Impact:** 
- Owner setup form: ✅ **Works perfectly**
- Listing creation form: ❌ **Cannot save 10 out of 19 fields** (47% data loss)
- Photo uploads: ❌ **No storage mechanism**

**Next Steps:**
1. Create and run the migration script above
2. Implement photo storage (AWS S3 or similar)
3. Create the listing creation API endpoint
4. Test end-to-end flow

**Estimated Effort:** 6-8 hours (2h migration + 4h photo upload + 2h API)

---

**Generated:** January 6, 2026  
**Tool:** GitHub Copilot Analysis
