-- Migration: Add user_type and cnpj to users table
-- Description: Support for distinguishing between individual and business users
-- Date: February 10, 2026

ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS user_type_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

-- Create unique index for CNPJ (only for non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cnpj ON users(cnpj) WHERE cnpj IS NOT NULL;

-- Create index for user_type filtering
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_users_user_type_verified ON users(user_type_verified);

-- Add comments for documentation
COMMENT ON COLUMN users.user_type IS 'User type: individual (Pessoa Física) or business (Pessoa Jurídica)';
COMMENT ON COLUMN users.user_type_verified IS 'Flag indicating if user type verification is complete';
COMMENT ON COLUMN users.cnpj IS 'Business ID (CNPJ) for Pessoa Jurídica users only. NULL for individual users.';
