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
SELECT to_regclass('public.jobs') IS NOT NULL AS jobs_table_exists \gset
\if :jobs_table_exists
\ir 004_seed_jobs.sql
\ir 009_seed_jobs_bulk.sql
\else
\echo '⚠️ Jobs table missing; skipping jobs seed.'
\endif
\echo ''

-- 006: Hangar Listings
\echo '🏠 Seeding hangar listings (14 properties)...'
\ir 006_seed_hangar_listings.sql
\ir 010_seed_hangar_listings_bulk.sql
\echo ''

-- 007: Classifieds
\echo '🛩️ Seeding classifieds (aircraft, parts, avionics)...'
SELECT to_regclass('public.aircraft_listings') IS NOT NULL AS aircraft_table_exists \gset
\if :aircraft_table_exists
\ir 007_seed_classifieds.sql
\ir 011_seed_aircraft_listings_bulk.sql
\else
\echo '⚠️ Classifieds tables missing; skipping classifieds seed.'
\endif
\echo ''

-- 008: Forum
\echo '💬 Seeding forum topics and replies...'
SELECT to_regclass('public.forum_topics') IS NOT NULL AS forum_table_exists \gset
\if :forum_table_exists
\ir 008_seed_forum.sql
\else
\echo '⚠️ Forum tables missing; skipping forum seed.'
\endif
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
  CASE WHEN :jobs_table_exists THEN (SELECT COUNT(*) FROM jobs) ELSE 0 END as jobs,
  (SELECT COUNT(*) FROM hangar_listings) as hangars;

\echo ''
\echo '📦 Classifieds:'
\if :aircraft_table_exists
SELECT
  (SELECT COUNT(*) FROM aircraft_listings) as aircraft_listings,
  (SELECT COUNT(*) FROM parts_listings) as parts_listings,
  (SELECT COUNT(*) FROM avionics_listings) as avionics_listings,
  (SELECT COUNT(*) FROM classified_photos) as classified_photos;
\else
\echo '⚠️ Classifieds tables missing; counts unavailable.'
\endif

\echo ''
\echo '💬 Forum:'
\if :forum_table_exists
SELECT
  (SELECT COUNT(*) FROM forum_topics) as forum_topics,
  (SELECT COUNT(*) FROM forum_replies) as forum_replies;
\else
\echo '⚠️ Forum tables missing; counts unavailable.'
\endif

\echo ''
\echo '🎯 Next Steps:'
\echo '   1. Login at http://localhost:3000/login'
\echo '   2. Use admin@test.local to access admin panel'
\echo '   3. Test CRUD operations with realistic data'
\echo '   4. Check filtering, searching, and moderation features'
\echo ''
