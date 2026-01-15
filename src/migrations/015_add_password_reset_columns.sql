-- Migration: Add password reset functionality columns
-- This migration adds columns needed for the forgot-password flow
-- Date: 2026-01-14

-- Add reset code and expiration columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ;

-- Add index for faster lookups when resetting
CREATE INDEX IF NOT EXISTS idx_users_reset_code 
ON users(reset_code) 
WHERE reset_code IS NOT NULL;

-- Add index for finding expired reset codes
CREATE INDEX IF NOT EXISTS idx_users_reset_code_expires 
ON users(reset_code_expires) 
WHERE reset_code_expires IS NOT NULL;
