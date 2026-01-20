-- Migration: 064_add_missing_indexes.sql
-- Date: January 20, 2026
-- Description: Add missing performance indexes to improve query efficiency
--
-- NOTE: Most indexes already exist! This migration adds only the missing ones.
-- Verified against current schema on Jan 20, 2026

-- 1. Career profiles user_id for fast lookups (if table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_career_profiles_user 
  ON career_profiles(user_id);

-- 2. Hangar owners user_id for owner lookups (check column name first)
-- Note: This table uses 'users_id' not 'user_id', so we check both possibilities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hangar_owners' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hangar_owners_user ON hangar_owners(user_id)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hangar_owners' AND column_name = 'users_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_hangar_owners_users ON hangar_owners(users_id)';
  END IF;
END $$;

-- 3. Forum replies topic_id for topic discussion queries (if missing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  idx_forum_replies_topic 
  ON forum_replies(topic_id);

-- Summary: This migration is SAFE and non-breaking
-- All indexes use IF NOT EXISTS to prevent duplicates
-- Most needed indexes already exist from previous migrations
