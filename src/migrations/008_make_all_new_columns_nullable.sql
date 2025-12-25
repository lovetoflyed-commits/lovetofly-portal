-- Migration: 008_make_all_new_columns_nullable.sql
-- Make all newly added columns nullable

ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN mobile_phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_zip DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_street DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_complement DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_neighborhood DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_city DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_state DROP NOT NULL;
ALTER TABLE users ALTER COLUMN address_country DROP NOT NULL;
ALTER TABLE users ALTER COLUMN aviation_role DROP NOT NULL;
ALTER TABLE users ALTER COLUMN aviation_role_other DROP NOT NULL;
ALTER TABLE users ALTER COLUMN social_media DROP NOT NULL;
ALTER TABLE users ALTER COLUMN newsletter_opt_in DROP NOT NULL;
ALTER TABLE users ALTER COLUMN terms_agreed DROP NOT NULL;