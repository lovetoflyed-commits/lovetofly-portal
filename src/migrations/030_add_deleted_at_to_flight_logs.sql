-- Migration: Add deleted_at column to flight_logs for soft delete
-- This allows logs to be marked as deleted without losing audit trail

ALTER TABLE flight_logs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Create index for better query performance when filtering deleted logs
CREATE INDEX IF NOT EXISTS idx_flight_logs_deleted_at ON flight_logs(deleted_at);

-- Create index for common query pattern (user_id + deleted_at)
CREATE INDEX IF NOT EXISTS idx_flight_logs_user_deleted ON flight_logs(user_id, deleted_at);
