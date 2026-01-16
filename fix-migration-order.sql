-- Fix migration order in pgmigrations table
-- Problem: Migration 014 was run after 018, breaking sequential order

BEGIN;

-- Show current problematic state
SELECT id, name FROM pgmigrations WHERE id >= 14 ORDER BY id;

-- Shift all migrations >= 37 to high numbers temporarily
UPDATE pgmigrations SET id = id + 100 WHERE id >= 37;

-- Renumber to correct sequence
UPDATE pgmigrations SET id = 14 WHERE name = '014_create_companies_table';
UPDATE pgmigrations SET id = 15 WHERE name = '015_create_jobs_table';
UPDATE pgmigrations SET id = 16 WHERE name = '016_create_applications_table';
UPDATE pgmigrations SET id = 17 WHERE name = '017_create_reviews_table';
UPDATE pgmigrations SET id = 18 WHERE name = '018_extend_users_aviation_fields';
UPDATE pgmigrations SET id = 19 WHERE name = '019_create_career_profiles_table';
UPDATE pgmigrations SET id = 20 WHERE name = '020_add_company_currency';
UPDATE pgmigrations SET id = 21 WHERE name = '021_add_job_salary_currency';
UPDATE pgmigrations SET id = 22 WHERE name = '022_set_company_currency_default_brl';
UPDATE pgmigrations SET id = 23 WHERE name = '023_create_companies_jobs_uuid';
UPDATE pgmigrations SET id = 24 WHERE name = '024_classifieds_marketplace_schema';
UPDATE pgmigrations SET id = 25 WHERE name = '025_password_reset_fields';
UPDATE pgmigrations SET id = 26 WHERE name = '026_extend_avatar_url_column';
UPDATE pgmigrations SET id = 28 WHERE name = '028_create_flight_logs_table';
UPDATE pgmigrations SET id = 29 WHERE name = '029_anac_civ_digital_compliance';
UPDATE pgmigrations SET id = 30 WHERE name = '030_add_deleted_at_to_flight_logs';

-- Reset sequence
SELECT setval('pgmigrations_id_seq', 30);

-- Verify fix
SELECT id, name FROM pgmigrations WHERE id >= 13 ORDER BY id;

COMMIT;
