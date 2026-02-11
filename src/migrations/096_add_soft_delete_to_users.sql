-- Migration: Add soft delete support to users table
-- Date: 2026-02-10
-- Description: Adds deleted_at column for soft delete functionality and deleted_by for audit trail

-- Add deleted_at timestamp column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_by column to track who deleted the user
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) DEFAULT NULL;

-- Add index for efficient querying of active (non-deleted) users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Add index for deleted users lookup
CREATE INDEX IF NOT EXISTS idx_users_deleted_at_not_null ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft-deleted. NULL means user is active.';
COMMENT ON COLUMN users.deleted_by IS 'ID of admin user who deleted this user. NULL for active users.';
