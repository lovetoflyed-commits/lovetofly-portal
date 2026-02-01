-- Migration: Add details column to admin_activity_log
-- Description: Store structured metadata for admin actions

ALTER TABLE IF EXISTS admin_activity_log
  ADD COLUMN IF NOT EXISTS details JSONB;

COMMENT ON COLUMN admin_activity_log.details IS 'Structured metadata for admin actions';
