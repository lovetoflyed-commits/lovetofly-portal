-- Migration: Create hangar_owners table
-- Description: Stores business information for hangar listing owners

CREATE TABLE IF NOT EXISTS hangar_owners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_hangar_owners_user_id ON hangar_owners(user_id);

-- Index for CNPJ lookups
CREATE INDEX IF NOT EXISTS idx_hangar_owners_cnpj ON hangar_owners(cnpj);

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_hangar_owners_verification ON hangar_owners(verification_status);

COMMENT ON TABLE hangar_owners IS 'Business information for hangar listing owners';
COMMENT ON COLUMN hangar_owners.verification_status IS 'pending, approved, rejected';
