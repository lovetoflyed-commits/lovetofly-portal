-- Migration: 108_add_missing_user_activity_log_columns
-- Date: 2026-02-13
-- Description: Add missing columns to user_activity_log table to match local database

-- Add activity_category column if it doesn't exist
ALTER TABLE user_activity_log 
ADD COLUMN IF NOT EXISTS activity_category character varying;

-- Add status column for logging operation results
ALTER TABLE user_activity_log 
ADD COLUMN IF NOT EXISTS status character varying;

-- Add details column for additional metadata
ALTER TABLE user_activity_log 
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}';

-- Add target tracking columns for auditing actions on specific resources
ALTER TABLE user_activity_log 
ADD COLUMN IF NOT EXISTS target_type character varying;

ALTER TABLE user_activity_log 
ADD COLUMN IF NOT EXISTS target_id character varying;

-- Create index on (user_id, created_at) for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created 
ON user_activity_log(user_id, created_at DESC);

-- Create index on activity_type for filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type 
ON user_activity_log(activity_type);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at 
ON user_activity_log(created_at DESC);
