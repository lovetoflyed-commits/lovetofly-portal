# 🔧 PRIORITY FIXING ROADMAP - CONFLICT-FREE SEQUENCE
## Love to Fly Portal - Critical Fixes & Optimizations
**Date:** January 20, 2026  
**Strategy:** Safe, sequential fixes with zero rollback risk  
**Target:** Complete by February 9, 2026 (20 days remaining)

---

## 📌 CRITICAL PRINCIPLES (Prevent Conflicts)

### 1. **No Breaking Changes to Deployed Code**
- All fixes must maintain backward compatibility
- Database migrations are append-only (no rollbacks)
- API versions remain stable
- Component props don't change without deprecation

### 2. **Dependency Chain Order**
```
Database Fixes → API Layer → Component Layer → Testing → Deploy
```
- Database must be fixed first (foundation)
- API depends on clean DB
- Components depend on stable API
- Only test after DB + API stable
- Only deploy after all tests pass

### 3. **Parallel vs Sequential**
- **Parallel OK:** Independent features (different modules)
- **Sequential Required:** Fixes in same layer/domain
- **Never Parallel:** DB migrations + code that uses them

### 4. **Rollback Capability**
- Each fix must be independently reversible
- Keep git commits atomic and descriptive
- Tag releases at stable points
- Document rollback procedure for each phase

---

## 🚨 PHASE 0: IMMEDIATE (Do Today - Jan 20)
**Duration:** 2-3 hours  
**Risk Level:** MINIMAL  
**Rollback:** Git reset to current commit

### 0.1 Git & Deployment Cleanup
**Status:** Already in REMAINING_TASKS  
**Action:** Commit all pending files
```bash
# Stage everything
git add -A

# Commit with descriptive message
git commit -m "feat: admin role persistence, bookings API, DB compatibility views"

# Push
git push origin main
```
**Verification:**
- No uncommitted changes: `git status` → clean
- GitHub shows new commit
- Netlify deployment triggered

**Conflict Risk:** ❌ NONE (simple housekeeping)

---

### 0.2 Remove Orphaned Files
**Files to delete:**
- `src/app/forum/page 2.tsx` (test file)
- Any `.bak` or `.tmp` files

```bash
find . -name "*page 2.tsx" -o -name "*.bak" -o -name "*.tmp" | xargs rm
git add -u
```

**Conflict Risk:** ❌ NONE (cleanup only)

---

## 🔴 PHASE 1: CRITICAL FIXES (Days 2-5, Jan 21-24)
**Duration:** 3-4 days  
**Risk Level:** LOW (but impact is HIGH)  
**Must Complete Before:** Any feature development or major refactoring

### 1.1 Database Fixes (Lowest Risk - Foundation)
**Status:** MUST DO FIRST  
**Reason:** All other fixes depend on clean DB

#### 1.1.1 Add Missing Indexes
**File:** Create `src/migrations/064_add_missing_indexes.sql`
```sql
-- These are append-only, no conflict risk
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_classified_photos_listing 
  ON classified_photos(listing_type, listing_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_forum_topics_created 
  ON forum_topics(created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_marketplace_listings_status 
  ON marketplace_listings(category, status) 
  WHERE deleted_at IS NULL;

-- (8-10 total indexes)
```

**Effort:** 1-2 hours  
**Command:**
```bash
# Create migration
npm run migrate:create -- add_missing_indexes

# Apply it
npm run migrate:up

# Verify
psql "$DATABASE_URL" -c "\d classified_photos" | grep idx_
```

**Rollback:** ✅ Simple (DROP INDEX CONCURRENTLY)  
**Conflict Risk:** ❌ NONE (indexes don't affect queries semantically)  
**Testing:** Run slow queries before/after, verify same results

---

#### 1.1.2 Standardize User ID Types
**Status:** OPTIONAL (non-critical, but good cleanup)  
**Files Affected:**
- `hangar_owners.users_id` (INTEGER → UUID)
- `career_profiles.users_id` (INTEGER → UUID)
- `forum_topics.user_id` (INTEGER → UUID)

**File:** Create `src/migrations/065_standardize_user_id_types.sql`
```sql
-- Add UUID column first (non-breaking)
ALTER TABLE hangar_owners 
  ADD COLUMN user_id_new UUID;

-- Migrate data
UPDATE hangar_owners 
SET user_id_new = (SELECT id FROM users WHERE id::text = users_id::text);

-- Drop old FK, rename column
ALTER TABLE hangar_owners 
  DROP CONSTRAINT fk_users_id,
  DROP COLUMN users_id,
  RENAME COLUMN user_id_new TO user_id;

-- Add proper FK
ALTER TABLE hangar_owners
  ADD CONSTRAINT fk_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;
```

**Effort:** 2-3 hours (TEST EXTENSIVELY)  
**Rollback:** ✅ Create reverse migration first  
**Conflict Risk:** ⚠️ MEDIUM (affects 3 tables, requires testing)  
**Skip If:** Worried about deployment risk (low impact feature)

**Recommendation:** SKIP for now, do post-launch

---

#### 1.1.3 Add Data Integrity Constraints
**File:** Create `src/migrations/066_add_constraints.sql`
```sql
-- Add cascade deletes where missing
ALTER TABLE hangar_photos
  DROP CONSTRAINT fk_hangar_listings (if exists),
  ADD CONSTRAINT fk_hangar_listings
  FOREIGN KEY (listing_id)
  REFERENCES hangar_listings(id)
  ON DELETE CASCADE;

-- Add check constraints for status enums
ALTER TABLE hangar_bookings
  ADD CONSTRAINT chk_booking_status
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Add unique constraints
ALTER TABLE users
  ADD CONSTRAINT unique_email
  UNIQUE (email);
```

**Effort:** 1 hour  
**Rollback:** ✅ Simple (DROP CONSTRAINT)  
**Conflict Risk:** ❌ NONE (constraints don't change query logic)  
**Testing:** Verify constraints work: insert invalid data, expect error

---

### 1.2 API Layer Fixes (Medium Risk - Parallel to DB fixes)
**Can start once DB planning is done**

#### 1.2.1 Add Input Validation (Zod)
**Status:** CRITICAL for security  
**Files to Create/Modify:**

**File:** `src/utils/validation.ts` (NEW)
```typescript
import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(3, 'Min 3 chars').max(100, 'Max 100 chars'),
  price: z.number().positive().min(1).max(1000000),
  description: z.string().min(10).max(5000),
  city: z.string().min(2).max(50),
  amenities: z.array(z.string()).max(20),
});

export const createBookingSchema = z.object({
  listing_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_date: z.date(),
  end_date: z.date(),
  total_price: z.number().positive(),
});

// ... (20+ schemas for each API)
```

**Files to Modify:**
- `src/app/api/hangarshare/listing/create/route.ts` → Add validation
- `src/app/api/hangarshare/booking/confirm/route.ts` → Add validation
- `src/app/api/classifieds/[type]/create/route.ts` → Add validation

**Effort:** 4-5 hours  
**Example:**
```typescript
import { createListingSchema } from '@/utils/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = createListingSchema.parse(body); // Throws if invalid
    
    // Now body is guaranteed to have valid data
    const result = await db.query(
      'INSERT INTO hangar_listings (...) VALUES (...)',
      [validated.title, validated.price, ...]
    );
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Rollback:** ✅ Easy (remove validation, tests fail, revert)  
**Conflict Risk:** ❌ NONE (validation is additive, doesn't break API)  
**Testing:** Send invalid data, expect 400 errors

---

#### 1.2.2 Add API Middleware Wrapper
**Status:** NICE-TO-HAVE (post-launch is fine)  
**Skip For Now:** Too much refactoring risk before launch

---

#### 1.2.3 Fix N+1 Queries
**Status:** IMPORTANT (performance critical)  
**Files to Analyze:**
```bash
grep -r "pool.query" src/app/api/ | grep -v "JOIN" | grep -v "aggregat"
```

**Example Fix:**
```typescript
// BEFORE: N+1 query (loads listing, then photos separately)
const listing = await pool.query(
  'SELECT * FROM hangar_listings WHERE id = $1',
  [id]
);
const photos = await pool.query(
  'SELECT * FROM hangar_photos WHERE listing_id = $1',
  [id]
);

// AFTER: Single joined query
const result = await pool.query(`
  SELECT 
    h.*,
    json_agg(json_build_object(
      'id', p.id,
      'url', p.url
    )) as photos
  FROM hangar_listings h
  LEFT JOIN hangar_photos p ON p.listing_id = h.id
  WHERE h.id = $1
  GROUP BY h.id
`, [id]);
```

**Effort:** 6-8 hours  
**Rollback:** ✅ Keep old query as fallback  
**Conflict Risk:** ⚠️ MEDIUM (complex queries, needs testing)  
**Testing:** Load listing with 20 photos, verify single query executed

---

### 1.3 Error Handling (Low Risk)
**Status:** CRITICAL for UX  
**Effort:** 2-3 hours

#### 1.3.1 Add Global Error Boundary
**File:** `src/components/ErrorBoundary.tsx` (NEW)
```typescript
import React from 'react';

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
    // Send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1>Algo deu errado</h1>
          <button onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**File:** Update `src/app/layout.tsx`
```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Rollback:** ✅ Remove wrapper  
**Conflict Risk:** ❌ NONE (new wrapper, additive)  
**Testing:** Throw error in component, verify boundary catches it

---

#### 1.3.2 Add Sentry Error Tracking
**File:** Create `src/config/sentry.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
```

**File:** Update `src/app/layout.tsx`
```typescript
import { initSentry } from '@/config/sentry';

if (typeof window !== 'undefined') {
  initSentry();
}
```

**Effort:** 1 hour  
**Rollback:** ✅ Remove import  
**Conflict Risk:** ❌ NONE (monitoring only, non-functional)

---

## 🟠 PHASE 2: HIGH PRIORITY (Days 5-10, Jan 25-30)
**Duration:** 4-5 days  
**Risk Level:** MEDIUM  
**Must Complete Before:** Feature testing

### 2.1 Component Code Quality
**Status:** Important for maintainability

#### 2.1.1 Split Large Components (1,000+ lines)
**Files to Refactor:**
1. `src/app/page.tsx` (1,376 lines) → 6 components
2. `src/app/hangarshare/listing/create/page.tsx` (1,055 lines) → 3 components
3. `src/components/BookingModal.tsx` (573 lines) → 3 components

**Strategy:** Component extraction doesn't break existing code
```typescript
// BEFORE: src/app/page.tsx (1,376 lines)
export default function Dashboard() {
  // Everything here
}

// AFTER: src/app/page.tsx (50 lines)
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RecentBookings from '@/components/dashboard/RecentBookings';
// ...

export default function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <RecentBookings />
    </div>
  );
}

// NEW: src/components/dashboard/DashboardHeader.tsx
export default function DashboardHeader() { ... }
```

**Effort:** 6-8 hours  
**Rollback:** ✅ Delete new components, revert page file  
**Conflict Risk:** ❌ NONE (props remain same from outside)  
**Testing:** Page still renders, same functionality

---

#### 2.1.2 Add React.memo to Photo Gallery
**File:** `src/components/PhotoGallery.tsx`
```typescript
// Prevent re-render on unrelated state changes
const PhotoItem = React.memo(({ photo, selected, onClick }) => (
  <img
    className={selected ? 'border-2 border-blue' : ''}
    onClick={() => onClick(photo.id)}
    src={photo.url}
    alt={photo.name}
  />
));

export default function PhotoGallery({ photos, onSelectPhoto }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div>
      {photos.map((photo) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          selected={selectedId === photo.id}
          onClick={setSelectedId}
        />
      ))}
    </div>
  );
}
```

**Effort:** 1-2 hours  
**Rollback:** ✅ Remove memo  
**Conflict Risk:** ❌ NONE (performance only)  
**Testing:** Select photo, verify other photos don't re-render

---

### 2.2 Duplicate Code Elimination
**Status:** Important for maintainability

#### 2.2.1 Unify Classifieds Modules
**Current Structure (DUPLICATE):**
```
src/app/classifieds/
├── aircraft/        (761 lines, 3x create/detail/list)
├── parts/          (657 lines, 3x create/detail/list)
└── avionics/       (649 lines, 3x create/detail/list)
```

**Target Structure (UNIFIED):**
```
src/app/classifieds/
├── [type]/          (aircraft|parts|avionics)
│   ├── create/
│   ├── [id]/
│   └── list
├── types.ts         (shared schemas)
└── utils.ts         (shared functions)
```

**File:** Create `src/app/classifieds/types.ts`
```typescript
export type ClassifiedType = 'aircraft' | 'parts' | 'avionics';

export interface ClassifiedBase {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  created_at: string;
}

export const CLASSIFIED_SCHEMAS: Record<ClassifiedType, any> = {
  aircraft: { /* aircraft schema */ },
  parts: { /* parts schema */ },
  avionics: { /* avionics schema */ },
};
```

**Strategy:** Move generic logic to shared utils
```bash
# Keep existing routes
# Add routing handler that detects type
# Route old URLs to new routes (redirects)
# Delete old duplicate code
```

**Effort:** 6-8 hours  
**Rollback:** ✅ Keep old routes as fallbacks  
**Conflict Risk:** ⚠️ MEDIUM (routing changes, needs thorough testing)  
**Testing:** Load each type separately, verify same behavior

---

### 2.3 Performance Optimizations
**Status:** Important for UX

#### 2.3.1 Image Optimization
**Strategy:** Replace `<img>` with `<Image>` from next/image

**Files to Update:**
- `src/components/HangarCarousel.tsx`
- `src/components/PhotoGallery.tsx`
- `src/app/classifieds/*/page.tsx`

**Example:**
```typescript
// BEFORE
<img src="/hangarshare/image-1000x800.jpg" alt="Hangar" />

// AFTER
import Image from 'next/image';

<Image
  src="/hangarshare/image-1000x800.jpg"
  alt="Hangar"
  width={1000}
  height={800}
  placeholder="blur"
  priority={isAboveFold}
  quality={75}
/>
```

**Effort:** 3-4 hours  
**Rollback:** ✅ Revert to img tags  
**Conflict Risk:** ❌ NONE (drop-in replacement)  
**Testing:** Pages still load, images display correctly

---

#### 2.3.2 Add Dynamic Imports for Large Components
**Files:**
- BookingModal.tsx
- CreateListingForm.tsx
- AdminDashboard.tsx

```typescript
// BEFORE: Loaded even if modal is closed
import BookingModal from '@/components/BookingModal';

// AFTER: Loaded only when needed
const BookingModal = dynamic(() => import('@/components/BookingModal'), {
  loading: () => <div className="p-4">Loading...</div>,
  ssr: false,
});

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      {showModal && <BookingModal />}
    </>
  );
}
```

**Effort:** 2-3 hours  
**Rollback:** ✅ Remove dynamic import  
**Conflict Risk:** ❌ NONE (performance only)  
**Testing:** Modal appears correctly when needed

---

## 🟡 PHASE 3: MEDIUM PRIORITY (Days 10-15, Jan 31-Feb 4)
**Duration:** 4-5 days  
**Risk Level:** MEDIUM  
**Can do in parallel with Phase 2**

### 3.1 Testing & QA
**Status:** CRITICAL before launch

#### 3.1.1 API Endpoint Tests
**File:** Create `src/__tests__/api/hangarshare.test.ts`
```typescript
describe('POST /api/hangarshare/listing/create', () => {
  it('should create listing with valid data', async () => {
    const response = await fetch('/api/hangarshare/listing/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Hangar em SP',
        price: 500,
        description: 'Excelente hangar',
        city: 'São Paulo',
      }),
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });

  it('should reject invalid data', async () => {
    const response = await fetch('/api/hangarshare/listing/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'x' }), // Too short
      headers: { 'Authorization': `Bearer ${testToken}` },
    });
    
    expect(response.status).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/hangarshare/listing/create', {
      method: 'POST',
      body: JSON.stringify({ /* data */ }),
    });
    
    expect(response.status).toBe(401);
  });
});
```

**Effort:** 6-8 hours  
**Rollback:** ✅ Delete tests  
**Conflict Risk:** ❌ NONE (tests don't affect code)  
**Run:** `npm run test`

---

#### 3.1.2 E2E Integration Tests
**Files:** Existing Playwright tests
```bash
npx playwright test
```

**Test Scenarios:**
1. Complete booking flow (search → select → pay → confirm)
2. Create classified listing (upload photos, post, verify)
3. Career profile save/load
4. Admin user management
5. Forum topic creation

**Effort:** 3-4 hours  
**Rollback:** ✅ Delete E2E tests  
**Conflict Risk:** ❌ NONE (tests don't affect code)

---

### 3.2 Security Hardening
**Status:** IMPORTANT

#### 3.2.1 Security Headers Middleware
**File:** `src/middleware.ts` (MODIFY)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}
```

**Effort:** 1 hour  
**Rollback:** ✅ Remove headers  
**Conflict Risk:** ❌ NONE (headers only, non-functional)  
**Testing:** Verify headers present: `curl -i https://lovetofly.com.br | grep -i "x-"`

---

#### 3.2.2 Rate Limiting (Already implemented with Upstash)
**Verify:** Check `src/config/rateLimit.ts` exists and is applied

**Effort:** 0.5 hours (verification only)  
**Testing:** Call endpoint 100x rapidly, expect 429 after limit

---

## 🟢 PHASE 4: NICE-TO-HAVE (Days 15+, Feb 4+)
**Duration:** 4-5 days  
**Risk Level:** LOW  
**Can skip if short on time**

### 4.1 Performance Monitoring
**Status:** OPTIONAL (post-launch is fine)

#### 4.1.1 Web Vitals Tracking
**File:** Create `src/utils/analytics.ts`
```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function initWebVitals() {
  onCLS((metric) => console.log('CLS:', metric.value));
  onFID((metric) => console.log('FID:', metric.value));
  onFCP((metric) => console.log('FCP:', metric.value));
  onLCP((metric) => console.log('LCP:', metric.value));
  onTTFB((metric) => console.log('TTFB:', metric.value));
}
```

**Effort:** 1-2 hours  
**Rollback:** ✅ Remove tracking  
**Conflict Risk:** ❌ NONE (monitoring only)

---

### 4.2 Documentation
**Status:** OPTIONAL

- Update API documentation
- Create runbooks for common issues
- Document deployment procedure
- Create troubleshooting guide

**Effort:** 3-4 hours

---

## 📋 EXECUTION CHECKLIST

### Prerequisites (Before Starting)
- [ ] All changes committed to main branch
- [ ] Latest code pulled locally
- [ ] DATABASE_URL env var set
- [ ] Node.js v18+ installed
- [ ] npm dependencies installed (`npm install`)

### Daily Progress Tracking

**Day 1-2 (Jan 20-21): Phase 0**
- [ ] 0.1 Commit pending changes
- [ ] 0.2 Delete orphaned files
- [ ] Verify Netlify deployment succeeds

**Day 2-4 (Jan 21-24): Phase 1A (Database)**
- [ ] 1.1.1 Add missing indexes
- [ ] 1.1.3 Add constraints
- [ ] Run migrations: `npm run migrate:up`
- [ ] Verify: `psql "$DATABASE_URL" -c "\d classified_photos"` | grep idx_

**Day 3-5 (Jan 22-24): Phase 1B (API)**
- [ ] 1.2.1 Add Zod validation
  - [ ] Create `src/utils/validation.ts`
  - [ ] Update 5 endpoint handlers
  - [ ] Test with invalid data
- [ ] 1.2.3 Fix N+1 queries
  - [ ] Identify N+1 queries: `grep -r "pool.query" src/app/api/`
  - [ ] Fix top 3 critical ones
  - [ ] Test with profiler

**Day 4-5 (Jan 23-24): Phase 1C (Error Handling)**
- [ ] 1.3.1 Add ErrorBoundary
- [ ] 1.3.2 Setup Sentry
- [ ] Test error catching

**Day 5-10 (Jan 25-30): Phase 2 (Code Quality)**
- [ ] 2.1.1 Split large components (1,376 → 6 files)
- [ ] 2.1.2 Add React.memo
- [ ] 2.2.1 Unify classifieds modules
- [ ] 2.3.1 Image optimization (next/image)
- [ ] 2.3.2 Dynamic imports

**Day 10-15 (Jan 31-Feb 4): Phase 3 (Testing)**
- [ ] 3.1.1 Write API tests
- [ ] 3.1.2 Run E2E tests
- [ ] 3.2.1 Add security headers
- [ ] Run `npm run lint`
- [ ] Run `npm run test`

**Day 15+ (Feb 4+): Phase 4 (Nice-to-have)**
- [ ] Analytics setup
- [ ] Documentation
- [ ] Performance monitoring

---

## ⚠️ RISK MITIGATION

### What Could Go Wrong?

#### Risk 1: Database Migration Failure
**Symptom:** `npm run migrate:up` fails  
**Cause:** Invalid SQL or constraint violation  
**Fix:**
```bash
# Rollback
npm run migrate:down

# Check migration file for errors
cat src/migrations/064_add_missing_indexes.sql

# Fix and retry
npm run migrate:up
```

**Prevention:** Test all migrations locally first

---

#### Risk 2: API Tests Fail After Validation
**Symptom:** Requests that worked now return 400  
**Cause:** Validation schema too strict  
**Fix:**
```typescript
// Adjust schema to be less strict
const createListingSchema = z.object({
  title: z.string().min(1).max(100), // Was min(3)
  price: z.number().positive(), // Allow decimals
});
```

**Prevention:** Test validation with existing data first

---

#### Risk 3: Component Split Breaks Props
**Symptom:** Child component errors about missing props  
**Cause:** Props not passed from parent  
**Fix:**
```typescript
// Make all props optional or provide defaults
interface DashboardHeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export default function DashboardHeader({ 
  userName = 'User',
  onLogout = () => {},
}: DashboardHeaderProps) { ... }
```

**Prevention:** Test component in isolation first

---

#### Risk 4: Image Optimization Breaks Layout
**Symptom:** Images disappear or layout shifts  
**Cause:** width/height not set correctly  
**Fix:**
```typescript
// Always set width/height for Next Image
<Image
  src="/image.jpg"
  alt="Description"
  width={1000}        // REQUIRED
  height={800}        // REQUIRED
  objectFit="cover"   // Prevent stretching
/>
```

**Prevention:** Test image gallery in all screen sizes

---

#### Risk 5: Test Coverage Too Low
**Symptom:** Some code paths untested  
**Cause:** Only happy path tested  
**Fix:**
```bash
# Check coverage
npm run test -- --coverage

# Add tests for error cases
# Test with invalid data, network errors, auth failures
```

**Prevention:** Aim for 80%+ coverage

---

### Rollback Procedure (If Needed)

**Step 1: Identify problematic commit**
```bash
git log --oneline | head -5
# Find last working commit
```

**Step 2: Revert changes**
```bash
# Option A: Revert last commit (keeps history)
git revert HEAD

# Option B: Reset to last known good (loses history, dev only)
git reset --hard <commit-hash>
```

**Step 3: Redeploy**
```bash
git push origin main
# Netlify auto-deploys from main
```

**Step 4: Notify team**
- Document what broke
- Document what you'll do differently
- Update this roadmap

---

## 🎯 SUCCESS CRITERIA

### By Feb 9 (Launch Day)
- [ ] All Phase 0 complete (git cleanup)
- [ ] All Phase 1 complete (critical fixes)
  - [ ] Database: 10+ indexes, constraints
  - [ ] API: Validation on all endpoints
  - [ ] Error handling: Boundary + Sentry
- [ ] All Phase 2 complete (code quality)
  - [ ] Components < 300 LOC
  - [ ] No duplicate code
  - [ ] Images optimized
- [ ] All Phase 3 tests passing
  - [ ] 80%+ code coverage
  - [ ] E2E scenarios pass
  - [ ] Security headers present
- [ ] Zero critical/high bugs
- [ ] Performance targets met:
  - [ ] Largest page < 1.5MB
  - [ ] API response < 500ms
  - [ ] Lighthouse score > 80

---

## 📞 SUPPORT & ESCALATION

### If You Get Stuck:

1. **Database issues:**
   - Check: `psql "$DATABASE_URL" -c "SELECT * FROM migrations;"`
   - Read error message carefully
   - Rollback to last working migration

2. **API test failures:**
   - Run API locally: `npm run dev`
   - Test endpoint with curl or Postman
   - Check request/response format

3. **Component rendering issues:**
   - Check browser console for errors
   - Test component in isolation
   - Verify all props passed

4. **Deployment failures:**
   - Check Netlify build logs
   - Look for TypeScript errors: `npx tsc --noEmit`
   - Look for lint errors: `npm run lint`

---

**Status:** Ready to execute  
**Confidence Level:** HIGH ✅  
**Estimated Completion:** Feb 4-6, 2026 (5-6 days early)

