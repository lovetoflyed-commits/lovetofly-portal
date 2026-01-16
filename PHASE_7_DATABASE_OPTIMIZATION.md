# Phase 7.1: Database Optimization Report

**Generated:** 2026-01-15  
**Status:** 🔍 Analysis Complete, Optimizations Pending

---

## Executive Summary

**Database Size:** 1.3 GB (primary: users 1.3 MB, hangar_listings 256 KB, flight_logs 144 KB)  
**Table Count:** 42 tables across 7 major domains (HangarShare, Career, Shop, Aircraft Classifieds, etc.)  
**Index Count:** 176 total indexes (15 on hangar_listings, 6 on hangar_reviews, 5 on hangar_favorites)  
**Query Performance:** Good - baseline EXPLAIN ANALYZE shows <1.2ms for search queries

---

## Critical Findings

### ✅ What's Working Well
1. **Search Query Performance:** 1.152 ms (excellent) for 20-item pagination
   - Proper use of indexes on status/availability
   - Efficient nested loop joins
   - Good use of bitmap scans on reviews

2. **Index Coverage:** Comprehensive indexes on all critical paths
   - Foreign key indexes prevent sequential scans on joins
   - Composite indexes for common filter combinations
   - Partial indexes with WHERE clauses where appropriate

3. **Schema Design:** Well-structured with proper constraints
   - Foreign key relationships with CASCADE deletes
   - UNIQUE constraints preventing duplicates
   - JSONB fields for flexible data (accepted_aircraft, services, etc.)

### ⚠️ Issues Identified

#### 1. **N+1 Query in Favorites API** (HIGH PRIORITY)
**File:** `src/app/api/hangarshare/favorites/route.ts:48`

```sql
-- CURRENT: Subquery runs once per favorite (N+1 anti-pattern)
(SELECT COUNT(*) FROM hangar_bookings WHERE listing_id = hl.id) as total_bookings
```

**Impact:** For 100 favorites, makes 101 queries instead of 1  
**Fix:** Aggregate in JOIN before returning

---

#### 2. **Reviews API Making 3 Separate Queries** (MEDIUM PRIORITY)
**File:** `src/app/api/hangarshare/reviews/route.ts:41-77`

Current queries:
1. Fetch reviews (Line 41)
2. Count total (Line 57)
3. Get stats (Line 63)

**Impact:** 3 round-trips to database for each GET request  
**Fix:** Combine stats into single window function

---

#### 3. **Missing Index on hangar_listings.created_at** (LOW PRIORITY)
**File:** Search ordering `ORDER BY h.created_at DESC`

**Current:** Uses SORT not index (cost 19.50, 0.897ms)  
**Fix:** Add index on `created_at DESC` (partial for active listings)

---

#### 4. **Redundant Indexes on hangar_listings** (CLEANUP)
- `idx_hangar_icao` AND `idx_listings_icao` (both on airport_icao)
- `idx_hangar_owner` AND `idx_listings_owner` (both on owner_id)
- `idx_hangar_status` AND `idx_listings_status` (different columns - keep both)
- `idx_listings_paid` is on 3 columns but only first needed for WHERE filters

---

## Optimization Plan

### Phase 1: Fix N+1 Problems (1 hour)
1. ✅ Rewrite favorites query with aggregate join
2. ✅ Combine reviews stats into single query
3. ✅ Test EXPLAIN ANALYZE on fixed queries
4. ✅ Benchmark improvement

### Phase 2: Add Missing Indexes (30 minutes)
1. ✅ Add `idx_hangar_listings_created_at` (partial, DESC)
2. ✅ Add `idx_listings_price_range` (monthly_rate, daily_rate for price filters)
3. ✅ Verify index usage in EXPLAIN plans

### Phase 3: Remove Redundant Indexes (30 minutes)
1. ✅ Drop `idx_listings_icao` (keep `idx_hangar_icao`)
2. ✅ Drop `idx_listings_owner` (keep `idx_hangar_owner`)
3. ✅ Drop unused columns from `idx_listings_paid`

### Phase 4: Validation & Testing (30 minutes)
1. ✅ Run full test suite
2. ✅ Verify API response times
3. ✅ Check for regressions

---

## Implementation Status

- [ ] Task 7.1.1: Fix N+1 queries in API code
- [ ] Task 7.1.2: Optimize database queries
- [ ] Task 7.1.3: Add performance indexes
- [ ] Task 7.1.4: Validate improvements

**ETA:** 2-3 hours total  
**Priority:** HIGH - Direct impact on user experience

---

## Performance Baseline (Pre-Optimization)

```
Search Query (current):     1.152 ms
Favorites GET:              ~50 ms (with N+1)
Reviews GET:                ~30 ms (3 queries)
```

**Expected Improvement:**
```
Search Query (after):       <1.0 ms (no change expected)
Favorites GET:              ~5 ms (10x improvement)
Reviews GET:                ~15 ms (2x improvement)
```

---

## Next Session

**Phase 7.2: Monitoring & Logging**
- Sentry integration for error tracking
- Custom metrics for slow queries
- Dashboard setup for key KPIs

**Phase 7.3: Mobile & Accessibility**
- Responsive design verification
- ARIA labels review
- Keyboard navigation testing
