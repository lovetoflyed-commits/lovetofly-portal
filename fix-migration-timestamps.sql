-- Fix migration timestamps to match sequential order
-- The ID is fixed, but run_on timestamps are out of order

BEGIN;

-- Update run_on for migrations 14-26, 28-30 to be sequential
-- Base timestamp: 2026-01-10 10:05:10 (when most were run)
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.19' WHERE name = '014_create_companies_table';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.20' WHERE name = '015_create_jobs_table';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.21' WHERE name = '016_create_applications_table';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.22' WHERE name = '017_create_reviews_table';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.23' WHERE name = '018_extend_users_aviation_fields';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.24' WHERE name = '019_create_career_profiles_table';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.25' WHERE name = '020_add_company_currency';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.26' WHERE name = '021_add_job_salary_currency';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.27' WHERE name = '022_set_company_currency_default_brl';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.28' WHERE name = '023_create_companies_jobs_uuid';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.29' WHERE name = '024_classifieds_marketplace_schema';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.30' WHERE name = '025_password_reset_fields';
UPDATE pgmigrations SET run_on = '2026-01-10 10:05:10.31' WHERE name = '026_extend_avatar_url_column';

-- Verify final order
SELECT id, name, run_on FROM pgmigrations WHERE id >= 13 ORDER BY id;

COMMIT;
