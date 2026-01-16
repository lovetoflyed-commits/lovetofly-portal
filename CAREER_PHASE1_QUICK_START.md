# Career & Jobs Phase 1 - Quick Start & Testing Guide

**Build Status:** ✅ SUCCESS (Yarn build completed in 36s)

**All new API routes compiled:**
- ✅ `/api/career/companies`
- ✅ `/api/career/companies/[id]`
- ✅ `/api/career/jobs`
- ✅ `/api/career/jobs/[id]`
- ✅ `/api/career/applications`
- ✅ `/api/career/applications/[id]`
- ✅ `/api/career/reviews`

---

## Getting Started

### 1. Apply Migrations
```bash
npm run migrate:up
```

This will create tables in order:
- 014: companies
- 015: jobs
- 016: applications
- 017: reviews
- 018: extend users table with aviation fields

### 2. Start Dev Server
```bash
yarn dev
```

Server will run at `http://localhost:3000`

### 3. Test API Endpoints

#### Create a Company
```bash
curl -X POST http://localhost:3000/api/career/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "legal_name": "Delta Air Lines Inc",
    "company_name": "Delta Air Lines",
    "logo_url": "https://...",
    "website": "https://careers.delta.com",
    "headquarters_city": "Atlanta",
    "headquarters_country": "United States",
    "company_size": "Large",
    "industry": "Airline",
    "description": "Major US carrier",
    "culture_statement": "Safety first, family values",
    "annual_hiring_volume": 300,
    "faa_certificate_number": "G-123456"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "user_id": 123,
    "legal_name": "Delta Air Lines Inc",
    "company_name": "Delta Air Lines",
    ...
    "created_at": "2025-01-10T12:00:00.000Z"
  },
  "message": "Company profile created successfully"
}
```

#### Post a Job
```bash
curl -X POST http://localhost:3000/api/career/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "company_id": 1,
    "title": "Captain - Boeing 737",
    "category": "Pilot",
    "seniority_level": "Senior",
    "base_location": "Atlanta (ATL)",
    "operating_countries": "United States, Canada, Caribbean",
    "relocation_assistance": true,
    "relocation_amount_usd": 15000,
    "required_certifications": "ATPL, Multi-engine, Instrument",
    "minimum_flight_hours": 2000,
    "minimum_pic_hours": 1000,
    "medical_class_required": "First-class",
    "visa_sponsorship_available": false,
    "type_ratings_required": "B737",
    "aircraft_types": "B737",
    "operation_type": "Airline",
    "salary_min_usd": 180000,
    "salary_max_usd": 250000,
    "benefits_description": "401k, Health, Pension",
    "signing_bonus_usd": 25000,
    "trip_length_avg_days": 4,
    "reserve_percentage": 5,
    "schedule_type": "Bid System",
    "contact_email": "careers@delta.com",
    "contact_recruiter_name": "John Smith"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "company_id": 1,
    "title": "Captain - Boeing 737",
    ...
    "status": "open",
    "created_at": "2025-01-10T12:00:00.000Z"
  },
  "message": "Job listing created successfully"
}
```

#### Browse Jobs (No Auth Required)
```bash
curl "http://localhost:3000/api/career/jobs?category=Pilot&location=Atlanta&limit=10&offset=0"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Captain - Boeing 737",
      "company_name": "Delta Air Lines",
      "logo_url": "...",
      "salary_min_usd": 180000,
      "salary_max_usd": 250000,
      "view_count": 0,
      "application_count": 0,
      ...
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1,
    "pages": 1
  }
}
```

#### Submit Application
```bash
curl -X POST http://localhost:3000/api/career/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CANDIDATE_JWT_TOKEN" \
  -d '{
    "job_id": 1,
    "cover_letter": "I have 2500 PIC hours and extensive B737 experience...",
    "expected_start_date": "2025-03-01",
    "salary_expectations_min": 200000,
    "salary_expectations_max": 240000,
    "relocation_willing": true
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "job_id": 1,
    "candidate_id": 456,
    "status": "applied",
    "credential_match_percentage": 85,
    ...
    "created_at": "2025-01-10T12:00:00.000Z"
  },
  "message": "Application submitted successfully"
}
```

#### Employer Views Applications
```bash
curl "http://localhost:3000/api/career/applications?role=employer" \
  -H "Authorization: Bearer EMPLOYER_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "job_id": 1,
      "candidate_name": "Captain John Doe",
      "candidate_email": "john@example.com",
      "status": "applied",
      "credential_match_percentage": 85,
      "created_at": "2025-01-10T12:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

#### Update Application Status
```bash
curl -X PATCH http://localhost:3000/api/career/applications/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYER_JWT_TOKEN" \
  -d '{
    "status": "screening",
    "notes": "Excellent credentials. Scheduling phone screen."
  }'
```

#### Submit Company Review
```bash
curl -X POST http://localhost:3000/api/career/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE_JWT_TOKEN" \
  -d '{
    "company_id": 1,
    "overall_rating": 4,
    "work_life_balance_rating": 3,
    "training_quality_rating": 5,
    "safety_culture_rating": 5,
    "pay_competitiveness_rating": 4,
    "management_rating": 4,
    "growth_opportunity_rating": 4,
    "title": "Great company, good pay, demanding schedule",
    "review_text": "Worked here as B737 FO for 2 years. Strong training program, excellent safety culture, competitive pay. Schedule is aggressive but predictable.",
    "job_title": "First Officer",
    "tenure_months": 24,
    "year_hired": 2023,
    "is_current_employee": false,
    "is_anonymous": false
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "company_id": 1,
    "author_id": 456,
    "overall_rating": 4,
    ...
    "moderation_status": "pending"
  },
  "message": "Review submitted successfully. It will be published after moderation."
}
```

#### Get Company Reviews
```bash
curl "http://localhost:3000/api/career/reviews?company_id=1&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "overall_rating": 4,
      "work_life_balance_rating": 3,
      "author_name": "John Doe",
      "review_text": "Great company...",
      ...
    }
  ],
  "aggregate": {
    "avg_overall": "4.2",
    "avg_work_life_balance": "3.1",
    "avg_training_quality": "4.5",
    "avg_safety_culture": "4.8",
    "avg_pay_competitiveness": "4.0",
    "avg_management": "4.1",
    "avg_growth_opportunity": "4.3",
    "total_reviews": "5"
  }
}
```

---

## Database Schema Verification

After migrations run, verify tables:

```bash
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "\d companies"  # Describe companies table
psql $DATABASE_URL -c "\d jobs"  # Describe jobs table
```

Expected tables:
- ✅ companies
- ✅ jobs
- ✅ applications
- ✅ reviews
- ✅ users (extended with new columns)

---

## Key Features Implemented

### For Jobseekers
- ✅ Browse job listings (no auth required)
- ✅ Filter by category, location, seniority, company, text search
- ✅ Apply for jobs with cover letter & video intro
- ✅ Track application status (applied → screening → interview → offer → hired)
- ✅ Profile completeness scoring (ready for Phase 2 UI)
- ✅ Credential match percentage auto-calculated on apply

### For Employers
- ✅ Create company profile
- ✅ Post unlimited job listings
- ✅ Receive and view applications
- ✅ Filter applications by status, credential match
- ✅ Update application status (move through pipeline)
- ✅ Add screening notes and rejection reasons
- ✅ View basic analytics (job view count, application count)

### For Both
- ✅ Leave/view company reviews
- ✅ Aggregate rating (average overall + breakdown by category)
- ✅ Moderation queue for reviews (pending → approved/rejected)
- ✅ Anonymous review option
- ✅ Helpful/unhelpful voting on reviews

---

## Next Phase Tasks

After Phase 1 verification:

### Phase 2: Jobseeker UI (Weeks 3–4)
- [ ] Create `/career` main landing page
- [ ] Build `/career/jobs` search interface with filters
- [ ] Build `/career/jobs/[id]` detail page
- [ ] Create `/career/my-applications` status dashboard
- [ ] Build `/career/profile` to edit aviation profile
- [ ] Add "Save job" / "Saved jobs" feature
- [ ] Setup email alerts for new matching jobs

### Phase 3: Employer Dashboard (Weeks 5–6)
- [ ] Create `/career/recruiter/company` setup wizard
- [ ] Build `/career/recruiter/jobs` (create, edit, close)
- [ ] Create `/career/recruiter/applications` kanban pipeline
- [ ] Add bulk actions (email candidates, move status)
- [ ] Setup `/career/recruiter/analytics` (time-to-hire, sources)

### Phase 4: Verification & Trust (Weeks 7–8)
- [ ] Integrate FAA Airmen Registry API
- [ ] Add background check trigger (HireRight)
- [ ] Build review moderation admin dashboard
- [ ] Display trust badges (verified credentials, mentor endorsements)
- [ ] Add "Recommended by mentor" flow

### Phase 5: Advanced Features (Weeks 9–12)
- [ ] Mentorship integration (mentor recommendations on jobs)
- [ ] Salary benchmarking & reports
- [ ] Interview scheduling (Calendly embed)
- [ ] ATS integrations (Workable, Lever)
- [ ] Email notifications & digests
- [ ] Video interview upload support

---

## Troubleshooting

### Build Fails
```bash
# Clean cache and rebuild
rm -rf .next
yarn build
```

### Database Connection Error
```bash
# Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Migration Won't Run
```bash
# Check migration status
npm run migrate

# If stuck, manually check pgmigrations table:
psql $DATABASE_URL -c "SELECT * FROM pgmigrations"
```

### JWT Auth Failures
- Ensure `Authorization: Bearer <token>` format in header
- Verify token was generated by login endpoint
- Check `JWT_SECRET` env var matches between login & API routes

---

## Files Summary

| Path | Type | Purpose |
|------|------|---------|
| `src/migrations/014*.sql` | Migration | Create companies table |
| `src/migrations/015*.sql` | Migration | Create jobs table |
| `src/migrations/016*.sql` | Migration | Create applications table |
| `src/migrations/017*.sql` | Migration | Create reviews table |
| `src/migrations/018*.sql` | Migration | Extend users table |
| `src/app/api/career/jobs/route.ts` | API | Jobs CRUD |
| `src/app/api/career/jobs/[id]/route.ts` | API | Job detail |
| `src/app/api/career/applications/route.ts` | API | Applications CRUD |
| `src/app/api/career/applications/[id]/route.ts` | API | Application update |
| `src/app/api/career/companies/route.ts` | API | Companies CRUD |
| `src/app/api/career/companies/[id]/route.ts` | API | Company detail |
| `src/app/api/career/reviews/route.ts` | API | Reviews CRUD |
| `src/types/db.d.ts` | TypeScript | Type definitions (updated) |

---

**Ready to proceed?**
1. Run migrations: `npm run migrate:up`
2. Start dev server: `yarn dev`
3. Test API with curl commands above
4. Move to Phase 2: UI development

**Created:** January 10, 2026
