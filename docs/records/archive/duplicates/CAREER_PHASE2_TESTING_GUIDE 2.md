# Career Phase 2 - Testing & Demo Guide

**Last Updated:** 2025-01-07  
**Status:** Ready for user testing

---

## Quick Start

### 1. Start Dev Server
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
npm run dev
```

**Access at:** `http://localhost:3000`

### 2. Navigate to Career Hub
```
Click "Carreira" in Sidebar → Career Hub
OR directly visit: http://localhost:3000/career
```

---

## Feature Demo Flow

### Demo 1: Browse Jobs (5 mins)
1. **Go to:** `/career/jobs`
2. **Test search:**
   - Type "pilot" in search box → see filtered results
   - Select "Airline" from category dropdown → filter updates
   - Enter "São Paulo" in location → filter updates
3. **Test pagination:**
   - Click "Next" button → loads more jobs
   - Click job card → navigates to detail page
4. **Expected:** Real data loaded from `GET /api/career/jobs`

---

### Demo 2: View Job Detail (5 mins)
1. **Go to:** `/career/jobs/1` (or any job from list)
2. **Observe:**
   - Company badge with logo + rating
   - 4 key detail cards (location, salary, type, operations)
   - Full job description sections
   - Credential match indicator (shows ~65% for demo)
3. **Test application:**
   - Scroll down, click "Apply Now" button
   - Fill form:
     - Cover letter: "I'm interested in this role..."
     - Expected start date: Pick a date
     - Salary expectations: 180000 - 250000
     - Check "Willing to relocate"
   - Click "Submit Application"
4. **Expected:** 
   - Form validates input
   - API call to `POST /api/career/applications`
   - Success message shows
   - Button changes to "Already Applied" (grayed out)

---

### Demo 3: Track Applications (5 mins)
1. **Login first** (if not already)
   - Go to `/login`
   - Use test account credentials
2. **Go to:** `/career/my-applications`
3. **Observe:**
   - 6 status tabs at top (All, Applied, Screening, Interview, Offer, Hired)
   - Shows count in each tab
   - Applications list with:
     - Job title + company
     - Status badge (blue/yellow/purple/green)
     - Your match % with progress bar
     - Your salary expectations
     - Expected start date
4. **Test filtering:**
   - Click "Screening" tab → see only screening-stage apps
   - Click "All" tab → back to full list
5. **Test navigation:**
   - Click any application card → navigates to job detail

---

### Demo 4: Discover Companies (3 mins)
1. **Go to:** `/career/companies`
2. **Test search:**
   - Type "Azul" in search box → filters companies
   - Select "Airline" from industry dropdown → filters
3. **Observe:**
   - Company cards with logo, name, rating
   - Review count
   - Verified badge (if applicable)
4. **Test navigation:**
   - Click company card → would navigate to company detail page

---

### Demo 5: Career Hub Landing (2 mins)
1. **Go to:** `/career`
2. **Observe:**
   - Hero section with "Start Browsing Jobs" button
   - 6 feature cards with icons
   - Stats section (500+ jobs, 200+ companies, etc.)
   - Bottom CTA section
3. **Test navigation:**
   - Click "Start Browsing Jobs" → `/career/jobs`
   - Click "Browse Jobs" card → `/career/jobs`
   - (If logged in) Click "My Applications" → `/career/my-applications`

---

## Manual Testing Checklist

### Landing Page (`/career`)
- [ ] Page loads without errors
- [ ] All 6 feature cards visible
- [ ] Responsive layout (test mobile view)
- [ ] Navigation buttons work
- [ ] Stats display correctly

### Job Search (`/career/jobs`)
- [ ] Page loads jobs from API
- [ ] Search box filters in real-time
- [ ] Category dropdown filters work
- [ ] Location filter works
- [ ] Pagination buttons visible
- [ ] Click job card → detail page
- [ ] Loading skeletons show during fetch
- [ ] Error message appears if API fails

### Job Detail (`/career/jobs/[id]`)
- [ ] Job info displays correctly
- [ ] Company badge shows logo + rating
- [ ] All detail cards visible
- [ ] Credential match shows percentage
- [ ] "Apply Now" button visible
- [ ] Form fields accept input
- [ ] Submit button works (if authenticated)
- [ ] Success state after submission
- [ ] Back button works

### My Applications (`/career/my-applications`)
- [ ] Requires login (redirects if not authenticated)
- [ ] Status tabs show counts
- [ ] Applications list displays
- [ ] Click status tab → filters
- [ ] Click application → detail page
- [ ] Credential match shows
- [ ] Loading skeletons appear

### Companies (`/career/companies`)
- [ ] Page loads companies
- [ ] Search filters companies
- [ ] Industry filter works
- [ ] Company cards visible
- [ ] Click card → navigates

---

## API Testing (curl examples)

### Test: Get Jobs List
```bash
curl -X GET "http://localhost:3000/api/career/jobs?limit=10&offset=0" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "title": "Pilot - Caravan C208",
      "category": "Airline",
      "location": "São Paulo",
      ...
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 45,
    "pages": 5
  }
}
```

### Test: Get Single Job
```bash
curl -X GET "http://localhost:3000/api/career/jobs/1" \
  -H "Content-Type: application/json"
```

### Test: Get Companies List
```bash
curl -X GET "http://localhost:3000/api/career/companies?limit=10" \
  -H "Content-Type: application/json"
```

### Test: Submit Application (requires auth)
```bash
TOKEN="your_jwt_token_here"

curl -X POST "http://localhost:3000/api/career/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": 1,
    "cover_letter": "I am interested in this position...",
    "expected_start_date": "2025-02-01",
    "salary_expectations_min": 180000,
    "salary_expectations_max": 250000,
    "relocation_willing": true
  }'
```

**Expected Response:**
```json
{
  "data": {
    "id": 123,
    "job_id": 1,
    "candidate_id": 5,
    "status": "applied",
    "credential_match_percentage": 75,
    "created_at": "2025-01-07T10:30:00Z"
  }
}
```

### Test: Get My Applications (requires auth)
```bash
TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:3000/api/career/applications?role=jobseeker" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Browser DevTools Testing

### Console Check
Open DevTools (F12) → Console tab
- Should see **no red errors**
- Only warnings about Next.js optimization are OK

### Network Tab
- All API requests return `200` or `201` status
- Response times < 500ms (normal for localhost)
- No failed requests (404, 500)

### Performance
- Page load < 2 seconds
- No layout shift (CLS)
- Images load smoothly

---

## Common Issues & Fixes

### Issue: "Unauthorized" error when applying
**Cause:** Not logged in  
**Fix:** Login first at `/login`

### Issue: "Duplicate application" error
**Cause:** Already applied to this job  
**Fix:** Expected behavior. Go to `/career/my-applications` to view application

### Issue: Search not filtering
**Cause:** API may need restart  
**Fix:** 
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

### Issue: "Cannot find module" errors
**Cause:** Missing components  
**Fix:**
```bash
# Verify files exist:
ls -la src/components/career/
# Should list: JobCard.tsx, JobFilters.tsx, CredentialMatch.tsx, etc.
```

### Issue: Empty job/company list
**Cause:** No data in database or API returns empty  
**Fix:** Check migration status
```bash
npm run migrate
# Should show: 018 (most recent)
```

---

## Performance Tips

- **Slow page load?** Clear browser cache: Ctrl+Shift+Del
- **Stuck on loading?** Refresh page: Ctrl+R
- **Need fresh data?** Restart dev server: Ctrl+C, then `npm run dev`

---

## Screenshots for Documentation

### Recommended Screenshots
1. `/career` - Career Hub landing
2. `/career/jobs` - Job search with filters
3. `/career/jobs/1` - Job detail with apply form
4. `/career/my-applications` - Application tracker
5. `/career/companies` - Companies directory

---

## User Feedback Questions

1. Is the job search intuitive? Does filtering work as expected?
2. Is the application form clear? Are all fields necessary?
3. Does the credential match percentage seem accurate?
4. Is the status tracker easy to understand?
5. Would you use the companies directory to research employers?
6. Any missing features or confusing UX?

---

## Next Testing Phase

After approval, proceed to:
- [ ] Phase 2B: Jobseeker profile editor
- [ ] Phase 2C: Company detail pages
- [ ] Phase 3A: Employer recruiter dashboard
- [ ] Phase 3B: Application pipeline management

---

**Ready to test!** 🚀

For issues or questions, check `/career` page navigation or API response logs in browser DevTools.
