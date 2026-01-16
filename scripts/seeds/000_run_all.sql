-- Master Seed Script - Run All Seeds in Order
-- Populates database with comprehensive test data for admin panel testing

\echo '================================================'
\echo 'Love to Fly Portal - Database Seeding'
\echo '================================================'
\echo ''

-- Disable triggers during seeding for performance
SET session_replication_role = replica;

\echo '📊 Starting database seeding...'
\echo ''

-- 001: Users
\echo '👤 Seeding users (15 diverse test users)...'
\ir 001_seed_users.sql
\echo ''

-- 002: Career Profiles
\echo '💼 Seeding career profiles (6 pilot profiles)...'
\ir 002_seed_career_profiles.sql
\echo ''

-- 003: Companies
\echo '🏢 Seeding companies (12 aviation companies)...'
\ir 003_seed_companies.sql
\echo ''

-- 004: Jobs
\echo '📋 Seeding job postings (20+ aviation jobs)...'
\ir 004_seed_jobs.sql
\echo ''

-- 006: Hangar Listings
\echo '🏠 Seeding hangar listings (14 properties)...'
\ir 006_seed_hangar_listings.sql
\echo ''

-- Re-enable triggers
SET session_replication_role = DEFAULT;

\echo '================================================'
\echo '✅ Database seeding completed successfully!'
\echo '================================================'
\echo ''
\echo '📝 Test Credentials:'
\echo '   Admin: admin@test.local / Test123!'
\echo '   Pilot: carlos.silva@test.local / Test123!'
\echo '   Owner: roberto.costa@test.local / Test123!'
\echo '   All passwords: Test123!'
\echo ''
\echo '🔍 Quick Stats:'
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM career_profiles) as profiles,
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM jobs) as jobs,
  (SELECT COUNT(*) FROM hangar_listings) as hangars;

\echo ''
\echo '🎯 Next Steps:'
\echo '   1. Login at http://localhost:3000/login'
\echo '   2. Use admin@test.local to access admin panel'
\echo '   3. Test CRUD operations with realistic data'
\echo '   4. Check filtering, searching, and moderation features'
\echo ''
