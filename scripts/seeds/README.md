# Database Seeds

Comprehensive test data for Love to Fly Portal admin panel testing.

## 🎯 Overview

This directory contains SQL seed files that populate the database with realistic mock data across all major tables. The data is designed to provide a robust testing environment for admin panel features including CRUD operations, filtering, searching, moderation, and reporting.

## 📁 Seed Files

Seeds execute in numerical order:

- **000_run_all.sql** - Master script that runs all seeds
- **001_seed_users.sql** - 15 diverse test users (admin, pilots, owners, mechanics, students, international)
- **002_seed_career_profiles.sql** - 6 detailed pilot career profiles (150-8500 flight hours)
- **003_seed_companies.sql** - 12 aviation companies (airlines, flight schools, MROs, charter operators)
- **004_seed_jobs.sql** - 20+ job postings (active, filled, closed statuses)
- **009_seed_jobs_bulk.sql** - 500+ additional job postings across companies
- **006_seed_hangar_listings.sql** - 14 hangar properties (various types, locations, price ranges)
- **010_seed_hangar_listings_bulk.sql** - 100+ additional hangar listings across airports
- **007_seed_classifieds.sql** - Aircraft, parts, and avionics listings with photos
- **011_seed_aircraft_listings_bulk.sql** - 200+ additional aircraft listings
- **008_seed_forum.sql** - Forum topics and replies across categories

## 🚀 Quick Start

### Run All Seeds

```bash
npm run seed:dev
```

### Run Individual Seed

```bash
psql postgresql://edsonassumpcao@localhost:5432/lovetofly-portal -f scripts/seeds/001_seed_users.sql
```

### Reset Database & Reseed

```bash
npm run db:reset
npm run seed:dev
```

## 🔑 Test Credentials

All users have the same password: **Test123!**

### Key Test Accounts

| Email | Role | Description |
|-------|------|-------------|
| `admin@test.local` | Admin | Full admin access, moderator badge |
| `carlos.silva@test.local` | Pilot | CPL, 1500hrs, First Officer at TAM |
| `maria.santos@test.local` | Pilot | ATPL, 8500hrs, Captain at LATAM |
| `roberto.costa@test.local` | Owner | Aircraft owner with premium hangars |
| `ana.ferreira@test.local` | Owner | Multiple hangar listings |
| `paulo.martins@test.local` | Mechanic | Aviation mechanic with hangar/workshop |
| `michael.johnson@test.local` | Pilot | Corporate pilot, international (US) |

### All Users List

1. **admin@test.local** - Admin Sistema
2. **carlos.silva@test.local** - Carlos Silva (Commercial Pilot)
3. **maria.santos@test.local** - Maria Santos (Captain)
4. **joao.oliveira@test.local** - João Oliveira (Private Pilot)
5. **roberto.costa@test.local** - Roberto Costa (Aircraft Owner)
6. **ana.ferreira@test.local** - Ana Ferreira (Aircraft Owner)
7. **paulo.martins@test.local** - Paulo Martins (Aviation Mechanic)
8. **lucas.almeida@test.local** - Lucas Almeida (Flight Student)
9. **fernanda.lima@test.local** - Fernanda Lima (Aviation Enthusiast)
10. **juliana.rocha@test.local** - Juliana Rocha (Flight Attendant)
11. **ricardo.mendes@test.local** - Ricardo Mendes (Air Traffic Controller)
12. **patricia.gomes@test.local** - Patricia Gomes (Aviation Manager)
13. **gustavo.barbosa@test.local** - Gustavo Barbosa (Safety Inspector)
14. **michael.johnson@test.local** - Michael Johnson (Corporate Pilot - US)
15. **sofia.rodriguez@test.local** - Sofia Rodriguez (Flight Instructor - Spain)

## 📊 Data Summary

After seeding, you'll have:

- **15 users** - Diverse roles, plans (free/pro/premium), Brazilian and international
- **6 career profiles** - Detailed aviation careers with licenses, experience, skills
- **12 companies** - LATAM, Azul, GOL, Embraer, flight schools, MROs, etc.
- **500+ jobs** - Pilot positions, mechanics, instructors, various statuses
- **100+ hangar listings** - SBSP, SBGR, SBRJ, SBKP, various types and prices
- **200+ aircraft classifieds** - Aircraft listings with sample photos
- **8 forum topics** - General, technical, regulations, events, classifieds, questions
- **9 forum replies** - Conversation starters across topics

## 🎨 Data Characteristics

### Realistic Brazilian Context

- **CPF numbers** - Formatted Brazilian tax IDs
- **Addresses** - Real cities (São Paulo, Rio, Guarulhos, Campinas, Porto Alegre, etc.)
- **Phone numbers** - +55 Brazilian format
- **ICAO codes** - Real Brazilian airports (SBSP, SBGR, SBMT, SBRJ, etc.)
- **Currency** - BRL (Brazilian Real)

### International Diversity

- US-based corporate pilot (Michael Johnson)
- Spanish flight instructor (Sofia Rodriguez)
- Various nationalities and languages

### Aviation-Specific Data

- **Licenses**: PPL, CPL, ATPL, CFI, helicopter (PCH)
- **Aircraft types**: Cessna, Piper, A320, B737, B777, B787, Citation, Phenom, Gulfstream
- **Flight hours**: 150 to 8500 hours across different categories
- **Certifications**: Type ratings, medical classes, ICAO English levels
- **Job types**: Pilots, mechanics, dispatchers, instructors, test pilots, managers

### Varied Scenarios

- **User plans**: Free, Pro, Premium
- **Job statuses**: Active, filled, closed
- **Hangar availability**: Available, rented
- **Experience levels**: Entry-level, mid-level, senior, executive
- **Dates**: Staggered creation/update times for realism

## 🔧 Maintenance

### Adding New Seeds

1. Create numbered file (e.g., `007_seed_new_feature.sql`)
2. Use same pattern:
   ```sql
   INSERT INTO table (...) VALUES (...) ON CONFLICT DO NOTHING;
   SELECT 'Message' as message, COUNT(*) as count FROM table;
   ```
3. Add to `000_run_all.sql` in correct order
4. Update this README

### Idempotency

All seeds use `ON CONFLICT DO NOTHING` or `ON CONFLICT (unique_column) DO NOTHING` to allow safe re-runs without duplicates.

### Test Data Identifier

All test accounts use `@test.local` domain for easy identification and filtering in production environments.

## 🧪 Testing Admin Features

With seeded data, you can test:

### CRUD Operations
- ✅ Create/Read/Update/Delete users
- ✅ Manage companies
- ✅ Moderate job postings
- ✅ Approve/reject hangar listings
- ✅ Review career profiles

### Filtering & Search
- ✅ Filter users by plan (free/pro/premium)
- ✅ Search jobs by location, salary, experience
- ✅ Find hangars by airport, price, type
- ✅ Filter companies by industry, size

### Moderation
- ✅ Review pending listings
- ✅ Verify users and companies
- ✅ Flag inappropriate content
- ✅ Manage featured listings

### Reporting
- ✅ User statistics by role
- ✅ Revenue by plan type
- ✅ Booking analytics
- ✅ Job application funnel
- ✅ Geographic distribution

## 🛠️ Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql postgresql://edsonassumpcao@localhost:5432/lovetofly-portal -c "SELECT 1"
```

### Permission Errors

```bash
# Ensure DATABASE_URL is set
echo $DATABASE_URL

# Or use full connection string
psql "postgresql://edsonassumpcao@localhost:5432/lovetofly-portal" -f scripts/seeds/000_run_all.sql
```

### Duplicate Key Errors

Seeds are idempotent, but if you get duplicate errors:

```bash
# Clear specific table
psql $DATABASE_URL -c "TRUNCATE users CASCADE;"

# Or reset entire database
npm run db:reset
```

### Foreign Key Violations

Seeds must run in order due to foreign key dependencies:
1. Users (no dependencies)
2. Career Profiles (depends on users)
3. Companies (no dependencies)
4. Jobs (depends on companies)
5. Hangar Listings (depends on users)

## 📚 Related Documentation

- `../../migrations/` - Database schema migrations
- `../../src/types/db.d.ts` - TypeScript database types
- `../../NEON_SETUP.md` - Database setup guide
- `../../HANGARSHARE_COMPLETE_GUIDE.md` - HangarShare feature guide

## 🎯 Next Steps After Seeding

1. **Login** to http://localhost:3000/login
2. **Admin Panel** - Use admin@test.local
3. **Test CRUD** - Create, edit, delete records
4. **Explore Data** - Browse listings, profiles, jobs
5. **Test Filters** - Try search and filter features
6. **Check Reports** - View analytics and statistics

---

**Note**: This is test data only. Never use in production. All emails use `@test.local` domain.
