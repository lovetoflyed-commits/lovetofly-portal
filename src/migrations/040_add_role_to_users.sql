-- Migration: Add role column to users table for admin/staff management
-- Description: Enables role-based access control (master/admin/staff/user)
-- Date: January 15, 2026

-- Add role column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Set master role for the main admin user
UPDATE users SET role = 'master' WHERE email = 'lovetofly.ed@gmail.com' AND role = 'user';

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role for access control: user (default), admin, staff, or master';
