-- Migration: Add first_name and last_name to users table
-- Description: Adds missing columns for profile and form compatibility

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Backfill first_name and last_name from name if possible
UPDATE users SET first_name = split_part(name, ' ', 1), last_name = split_part(name, ' ', 2)
  WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Make first_name and last_name editable in profile forms
-- No NOT NULL constraint for compatibility
