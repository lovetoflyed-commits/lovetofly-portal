# 🎯 Phase 2 Quick Start Guide - Financial Dashboard

**Date:** January 20, 2026  
**Status:** Ready to Begin  
**Estimated Duration:** 4.5 hours (based on Phase 1 velocity)  
**Current Branch:** `feature/hangarshare-v2-dashboard`  

---

## 📋 Phase 1 Context (What You Just Built)

### ✅ Completed Components (Available for Reuse)
1. **FeatureFlagWrapper** → Wraps new features safely
2. **MetricCard + MetricsGrid** → Display any metrics with status colors
3. **RevenueChart** → LineChart pattern for trends
4. **OccupancyChart** → AreaChart pattern for percentages
5. **Dashboard Layout** → Responsive 9-section structure

### 📂 Useful Files to Reference
- [src/app/api/admin/hangarshare/v2/overview-stats/route.ts](src/app/api/admin/hangarshare/v2/overview-stats/route.ts) → API pattern
- [src/components/hangarshare-v2/MetricCard.tsx](src/components/hangarshare-v2/MetricCard.tsx) → Component reusable
- [src/app/admin/hangarshare-v2/page.tsx](src/app/admin/hangarshare-v2/page.tsx) → Dashboard structure

---

## 🚀 Phase 2 Tasks Overview

### Task 2.1: Build Financial Stats API
**File:** `/src/app/api/admin/hangarshare/v2/financial-stats/route.ts`  
**Duration:** 1.5-2 hours  
**Pattern:** Copy from overview-stats, adapt queries

**Required Database Queries:**
1. Total revenue (all-time)
2. Monthly revenue (last 12 months)
3. Commission collected
4. Pending payouts
5. Payout history (last 10)
6. Revenue by airport
7. Revenue by owner (TOP 10)
8. Average commission rate
9. Revenue trend (month-over-month growth)
10. Payment method breakdown

**Expected Response Structure:**
```typescript
{
  totalRevenue: number,
  monthlyRevenue: Array<{month, revenue, target}>,
  commissionMetrics: {collected, rate, outstanding},
  payoutMetrics: {pending, processed, failed},
  topOwners: Array<{id, name, revenue}>,
  revenueByAirport: Array<{airport, revenue}>,
  payoutHistory: Array<{id, amount, date, status}>,
  trend: {growthRate, forecast}
}
```

### Task 2.2: Build Financial Components
**Duration:** 1.5-2 hours  
**Components to Create:**
1. `FinancialMetricsGrid.tsx` → Using MetricCard (reuse!)
2. `CommissionChart.tsx` → Pie chart for breakdown
3. `RevenueByAirportChart.tsx` → Bar chart
4. `PayoutStatusChart.tsx` → Donut chart

### Task 2.3: Build Financial Dashboard Page
**File:** `/src/app/admin/hangarshare/v2/financial/page.tsx`  
**Duration:** 1-1.5 hours  
**Pattern:** Copy dashboard structure, swap components

**9 Sections:**
1. Header (Financial Dashboard)
2. Key metrics (4 cards: Total Revenue, Commissions, Pending Payouts, Growth)
3. Revenue trend (LineChart with 12 months)
4. Commission breakdown (PieChart)
5. Revenue by airport (BarChart)
6. Payout status (DonutChart)
7. Recent transactions (Table)
8. Alerts (Unpaid invoices, failed payouts)
9. Actions (Export report, adjust commission)

### Task 2.4: Add Feature Flag for Financial Dashboard
**Duration:** 15 minutes  
**Action:** Add new feature flag to database

**SQL:**
```sql
INSERT INTO feature_flags (name, description, enabled, environment)
VALUES (
  'hangarshare_financial_dashboard',
  'Enable financial analytics dashboard',
  false,
  'production'
);
```

### Task 2.5: Test & Verify
**Duration:** 30 minutes  
**Actions:**
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Feature flag toggle works
- [ ] Data displays correctly
- [ ] Charts render properly
- [ ] Responsive on mobile/tablet/desktop

---

## 📦 Development Workflow

### Before You Start
```bash
# Make sure you're on the feature branch
git checkout feature/hangarshare-v2-dashboard

# Update main locally
git pull origin main

# Verify current status
npm run build  # Should still pass
```

### During Development

#### Step 1: Create API Endpoint (Task 2.1)
```bash
# Create file
touch src/app/api/admin/hangarshare/v2/financial-stats/route.ts

# Add content (copy from overview-stats, adapt queries)
# Remember: Use Promise.all for parallel queries
# Remember: Database connection is default export: import pool from '@/config/db'

# Test locally
npm run dev
# Visit: http://localhost:3000/api/admin/hangarshare/v2/financial-stats
```

#### Step 2: Create Components (Task 2.2)
```bash
# Create component files
touch src/components/hangarshare-v2/CommissionChart.tsx
touch src/components/hangarshare-v2/RevenueByAirportChart.tsx
touch src/components/hangarshare-v2/PayoutStatusChart.tsx

# Test each component in isolation
npm run build
```

#### Step 3: Create Dashboard Page (Task 2.3)
```bash
# Create page
touch src/app/admin/hangarshare/v2/financial/page.tsx

# Copy structure from src/app/admin/hangarshare-v2/page.tsx
# Replace components with new ones
# Update API endpoint to /api/admin/hangarshare/v2/financial-stats

# Test build
npm run build
```

#### Step 4: Add Feature Flag (Task 2.4)
```bash
# Add SQL flag to database
# Use existing flag API: POST /api/admin/feature-flags

# Or add manually:
psql "$DATABASE_URL" << EOF
INSERT INTO feature_flags (name, description, enabled, environment)
VALUES (
  'hangarshare_financial_dashboard',
  'Enable financial analytics dashboard',
  false,
  'production'
);
EOF
```

#### Step 5: Verify & Test (Task 2.5)
```bash
# Full build verification
npm run build

# Check for errors
npm run lint

# Verify feature flag integration
# Toggle flag on/off and confirm dashboard appears/disappears
```

### After Each Task
```bash
git add .
git commit -m "feat: Phase 2 - Task 2.X description"
git push origin feature/hangarshare-v2-dashboard
```

---

## 🧩 Component Reuse Checklist

### Copy-Paste These Components
- ✅ Use `MetricCard` for financial metrics (4-card grid)
- ✅ Use `RevenueChart` pattern for monthly revenue trend
- ✅ Use Recharts library (already installed)

### Database Query Pattern (Copy from Task 2.1)
```typescript
// Example: Parallel queries
const [revenue, commissions, payouts] = await Promise.all([
  pool.query('SELECT SUM(amount) as total FROM transactions WHERE type = $1', ['revenue']),
  pool.query('SELECT SUM(amount) as total FROM transactions WHERE type = $1', ['commission']),
  pool.query('SELECT SUM(amount) as total FROM transactions WHERE type = $1', ['payout']),
]);

// Format and return
return NextResponse.json({
  totalRevenue: revenue.rows[0]?.total || 0,
  // ... more fields
});
```

### Dashboard Structure Pattern (Copy from page.tsx)
```typescript
'use client';

import { FeatureFlagWrapper } from '@/components/hangarshare-v2/FeatureFlagWrapper';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function FinancialDashboardPage() {
  return (
    <FeatureFlagWrapper flag="hangarshare_financial_dashboard">
      {/* Dashboard content */}
    </FeatureFlagWrapper>
  );
}
```

---

## ⚡ Common Gotchas (Lessons from Phase 1)

### 🔴 Import Errors
**Wrong:**
```typescript
import { createPool } from '@/config/db';
```

**Correct:**
```typescript
import pool from '@/config/db';
```

### 🔴 Missing Dependencies
If you use a new library:
```bash
npm install library-name --save
npm run build  # Verify before pushing
```

### 🔴 TypeScript Errors
Always run this before pushing:
```bash
npm run build  # Will catch type errors
```

### 🔴 Feature Flag Not Working
Check:
1. Flag created in database with exact name
2. FeatureFlagWrapper has correct flag name
3. Flag is enabled in database (or toggle in UI)

---

## 📊 Expected Deliverables (Phase 2)

### Files to Create (5 total, ~2,500 lines expected)
- [ ] `/src/app/api/admin/hangarshare/v2/financial-stats/route.ts` (~600 lines)
- [ ] `/src/components/hangarshare-v2/CommissionChart.tsx` (~70 lines)
- [ ] `/src/components/hangarshare-v2/RevenueByAirportChart.tsx` (~70 lines)
- [ ] `/src/components/hangarshare-v2/PayoutStatusChart.tsx` (~70 lines)
- [ ] `/src/app/admin/hangarshare/v2/financial/page.tsx` (~1,000+ lines)

### Build Output Expected
```
✓ Compiled successfully in ~30-35s
✓ Generating static pages using 7 workers
✓ TypeScript errors: 0
✓ ESLint warnings: 0
```

### Git Commits Expected
- Commit 1: Phase 2.1 - Financial Stats API
- Commit 2: Phase 2.2 - Financial Components
- Commit 3: Phase 2.3 - Financial Dashboard Page
- Commit 4: Phase 2.4 - Feature Flag Integration
- Commit 5: Phase 2.5 - Documentation & Verification

---

## 🎯 Success Criteria

Phase 2 is complete when:
- ✅ All 5 files created successfully
- ✅ Build passes with 0 errors (`npm run build`)
- ✅ Feature flag works (can toggle on/off)
- ✅ Dashboard displays financial metrics
- ✅ Charts render correctly
- ✅ Responsive on mobile/tablet/desktop
- ✅ All code committed and pushed
- ✅ Documentation updated

---

## 📞 Questions During Development?

Refer back to:
1. **API Pattern:** [src/app/api/admin/hangarshare/v2/overview-stats/route.ts](src/app/api/admin/hangarshare/v2/overview-stats/route.ts)
2. **Component Pattern:** [src/components/hangarshare-v2/MetricCard.tsx](src/components/hangarshare-v2/MetricCard.tsx)
3. **Dashboard Pattern:** [src/app/admin/hangarshare-v2/page.tsx](src/app/admin/hangarshare-v2/page.tsx)
4. **Master Plan:** [HANGARSHARE_V2_DEPLOYMENT_MASTER_PLAN_2026-01-20.md](HANGARSHARE_V2_DEPLOYMENT_MASTER_PLAN_2026-01-20.md)
5. **Phase 1 Report:** [PHASE_1_COMPLETION_REPORT_2026-01-20.md](PHASE_1_COMPLETION_REPORT_2026-01-20.md)

---

## 🚀 Ready to Begin Phase 2?

1. ✅ Verify you're on `feature/hangarshare-v2-dashboard` branch
2. ✅ Latest code pulled and built
3. ✅ Database connection verified
4. ✅ Ready to code!

**Estimated Timeline:** 4.5 hours (based on Phase 1 velocity)  
**Start Time:** Now  
**Target Completion:** Same day  

---

*Based on Phase 1 architecture and patterns. Follow the same approach for Phase 3-5.*
