# Career Feature - Quick Reference Guide

**Status:** ✅ Phase 1 & 2 Complete  
**Build:** ✅ Successful (0 errors, 17.8s)  
**Ready:** Production deployment

---

## Quick Start

### 1. Start Dev Server
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
npm run dev
```

Access: `http://localhost:3000`

### 2. Navigate to Career Pages
- Career Hub: `/career`
- Job Search: `/career/jobs`
- Job Detail: `/career/jobs/[id]`
- My Applications: `/career/my-applications` (requires login)
- Companies: `/career/companies`

### 3. Test Job Application Flow
1. Go to `/career/jobs`
2. Click a job → `/career/jobs/[id]`
3. Fill application form → Click "Apply"
4. Check status at `/career/my-applications`

---

## File Locations

### Pages
- `src/app/career/page.tsx` - Landing page
- `src/app/career/jobs/page.tsx` - Search page
- `src/app/career/jobs/[id]/page.tsx` - Detail page
- `src/app/career/my-applications/page.tsx` - Tracker
- `src/app/career/companies/page.tsx` - Directory

### Components
- `src/components/career/JobCard.tsx` - Job listing card
- `src/components/career/JobFilters.tsx` - Filter sidebar
- `src/components/career/CredentialMatch.tsx` - Match indicator
- `src/components/career/ApplicationStatusBadge.tsx` - Status badge
- `src/components/career/CompanyBadge.tsx` - Company card

### API Routes
- `src/app/api/career/jobs/route.ts` - Jobs CRUD
- `src/app/api/career/jobs/[id]/route.ts` - Job detail
- `src/app/api/career/applications/route.ts` - Applications
- `src/app/api/career/applications/[id]/route.ts` - App detail
- `src/app/api/career/companies/route.ts` - Companies
- `src/app/api/career/companies/[id]/route.ts` - Company detail
- `src/app/api/career/reviews/route.ts` - Reviews

### Database
- `src/migrations/014_create_companies_table.sql`
- `src/migrations/015_create_jobs_table.sql`
- `src/migrations/016_create_applications_table.sql`
- `src/migrations/017_create_reviews_table.sql`
- `src/migrations/018_extend_users_aviation_fields.sql`

### Types
- `src/types/db.d.ts` - All Career interfaces + extended User

---

## API Quick Reference

### Get Jobs List
```bash
GET /api/career/jobs?category=Airline&location=São Paulo&limit=10&offset=0
Returns: { data: Job[], pagination: { limit, offset, total, pages } }
```

### Get Single Job
```bash
GET /api/career/jobs/1
Returns: { data: Job }
```

### Submit Application (requires JWT)
```bash
POST /api/career/applications
Headers: Authorization: Bearer <TOKEN>
Body: {
  job_id: 1,
  cover_letter: "...",
  expected_start_date: "2025-02-01",
  salary_expectations_min: 180000,
  salary_expectations_max: 250000,
  relocation_willing: true
}
Returns: { data: Application }
```

### Get My Applications (requires JWT)
```bash
GET /api/career/applications?role=jobseeker
Headers: Authorization: Bearer <TOKEN>
Returns: { data: Application[] }
```

### Get Companies
```bash
GET /api/career/companies?search=Azul&industry=Airline
Returns: { data: Company[] }
```

### Get Company Detail
```bash
GET /api/career/companies/1
Returns: { data: Company & { open_jobs: number } }
```

### Submit Review (requires JWT)
```bash
POST /api/career/reviews
Headers: Authorization: Bearer <TOKEN>
Body: {
  company_id: 1,
  overall_rating: 4,
  title: "Great company",
  review_text: "...",
  is_anonymous: false
}
Returns: { data: Review }
```

---

## Component Props Quick Reference

### JobCard
```tsx
<JobCard
  id={1}
  title="Pilot - Caravan C208"
  companyName="Azul"
  logoUrl="https://..."
  baseLocation="São Paulo, SP"
  salaryMin={180000}
  salaryMax={250000}
  operationType="Full-time"
  seniority="Senior"
  applicationCount={42}
  viewCount={150}
  isNew={true}
  onClick={() => router.push(`/career/jobs/1`)}
/>
```

### JobFilters
```tsx
<JobFilters
  onFilterChange={(filters) => {
    // filters: { category?, location?, seniority?, company?, search? }
  }}
  loading={false}
/>
```

### CredentialMatch
```tsx
<CredentialMatch
  percentage={75}
  missingRequirements={["King Air type rating", "6000 hours PIC"]}
/>
```

### ApplicationStatusBadge
```tsx
<ApplicationStatusBadge
  status="screening"
  appliedAt={new Date("2025-01-05")}
  updatedAt={new Date("2025-01-07")}
/>
```

### CompanyBadge
```tsx
<CompanyBadge
  logoUrl="https://..."
  companyName="Azul"
  industry="Airline"
  averageRating={4.5}
  reviewCount={23}
  onClick={() => router.push(`/career/companies/1`)}
/>
```

---

## Database Schema Quick Reference

### companies table
```sql
- id (pk)
- user_id (fk → users.id)
- legal_name, company_name
- logo_url, website
- hq_city, hq_state, hq_country
- company_size, industry
- description, culture_statement
- annual_hiring_volume
- faa_certificate_number, insurance_verified
- average_rating, review_count
- is_verified, verification_status
- created_at, updated_at
```

### jobs table
```sql
- id (pk)
- company_id (fk → companies.id)
- title, category, seniority, location
- salary_min, salary_max
- job_type, relocation_available
- aircraft_types (array), operations_type
- requirements (jsonb)
- benefits (jsonb)
- view_count, application_count
- created_at, updated_at
```

### applications table
```sql
- id (pk)
- job_id (fk), candidate_id (fk)
- status ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')
- cover_letter
- credential_match_percentage (0-100)
- expected_start_date
- salary_expectations_min, _max
- created_at, updated_at
```

### reviews table
```sql
- id (pk)
- company_id (fk), author_id (fk)
- overall_rating (1-5)
- work_life_balance, training_quality, safety_culture, pay, management, growth
- title, review_text
- is_published, is_anonymous
- helpful_count, unhelpful_count
- created_at
```

### users extensions (018)
```sql
- pilot_ratings (text)
- total_flight_hours, pic_hours, multi_engine_hours, etc.
- medical_certificate_class, medical_certificate_expiry
- aviation_languages, icao_language_level
- employment_history (jsonb)
- current_employer, current_position
- career_goal, seniority_preference
- geographic_preference, willing_to_relocate
- compensation_expectations_min, _max
- profile_completeness_score
- is_available_for_hire, availability_date
```

---

## Common Patterns

### Authentication (Client-Side)
```tsx
import { useAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { user, token } = useAuth();

  const fetchData = async () => {
    const res = await fetch('/api/endpoint', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data;
  };

  if (!user) return <div>Not logged in</div>;
  return <div>Hello {user.name}</div>;
}
```

### API Route (Server-Side)
```tsx
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify JWT
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Business logic
    const result = await pool.query('INSERT INTO ...', [params]);

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
```

### Form Submission (Client)
```tsx
const [formData, setFormData] = useState({ field: '' });
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/career/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) throw new Error('Submission failed');
    
    const data = await res.json();
    // Success handling
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

---

## Troubleshooting

### Pages Not Showing
```bash
# Check routes compiled
npm run build | grep /career

# Expected output:
# ├ ○ /career
# ├ ○ /career/jobs
# ├ ○ /career/my-applications
```

### API Not Working
```bash
# Check if migrations ran
npm run migrate

# Test API manually
curl http://localhost:3000/api/career/jobs

# Check database connection
# DATABASE_URL should be set in .env.local
```

### Auth Issues
```bash
# Check JWT token
localStorage.getItem('token')
# In browser console

# Verify token is being sent
# DevTools → Network → Headers should show Authorization
```

### Build Failing
```bash
# Clear cache and rebuild
rm -rf .next
npm run build

# Check for TypeScript errors
npm run build 2>&1 | grep error
```

---

## Monitoring & Debugging

### Browser DevTools (F12)
1. **Console:** Check for JavaScript errors
2. **Network:** Check API requests/responses
3. **Application:** Check localStorage (token)
4. **Sources:** Debug client-side code

### Server Logs
```bash
# Watch dev server logs
npm run dev 2>&1 | grep -E "(error|Error|GET|POST)"

# Check database queries
# Add console.log before pool.query() in API routes
```

### API Testing
```bash
# Test endpoint directly
curl -v http://localhost:3000/api/career/jobs

# With auth
TOKEN="your_token"
curl -v http://localhost:3000/api/career/applications \
  -H "Authorization: Bearer $TOKEN"
```

---

## Performance Tips

- **Pagination:** Always use limit/offset to avoid large responses
- **Search:** Uses full-text index (TSVECTOR) for performance
- **Filtering:** Filter on database, not client-side
- **Images:** Company logos lazy-loaded via Tailwind
- **Caching:** Pages are static, API responses are dynamic

---

## Next Features (Phase 3+)

### Phase 3: Employer Dashboard
- Recruiter authentication
- Company setup wizard
- Job posting management
- Application pipeline (kanban)
- Candidate evaluation
- Analytics & reporting

### Phase 4: Verification
- FAA license validation
- Medical cert checking
- Background checks
- Flight hour verification

### Phase 5: Advanced
- Salary benchmarking
- Mentorship matching
- AI-powered matching
- Skills assessments

---

## Documentation

📄 **Main Docs:**
- `CAREER_PHASES_1_2_SUMMARY.md` - Complete feature overview
- `CAREER_PHASE1_IMPLEMENTATION.md` - Backend technical spec
- `CAREER_PHASE2_COMPLETE.md` - Frontend technical spec
- `CAREER_PHASE2_TESTING_GUIDE.md` - Testing & demo guide
- `CAREER_JOBS_RESEARCH.md` - Market research (20 sections)

---

## Support

- **Architecture questions?** See copilot-instructions.md
- **Database schema?** Check migrations in src/migrations/
- **Component usage?** See component props above
- **API errors?** Check error responses in API routes
- **Build issues?** Run `npm run build` with full output

---

**Everything is ready to ship!** 🚀

Last updated: 2025-01-07
