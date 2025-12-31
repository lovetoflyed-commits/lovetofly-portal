-- Migration: Create hangar_owners table
-- Description: Anunciantes de hangares (qualquer usuário cadastrado pode ser)

CREATE TABLE IF NOT EXISTS hangar_owners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Owner Info (from users table, but duplicated for easy access)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Company Info
  company_name VARCHAR(200),
  company_cnpj VARCHAR(20),
  company_website VARCHAR(255),
  
  -- Banking Info
  bank_code VARCHAR(10),
  bank_agency VARCHAR(10),
  bank_account VARCHAR(20),
  account_holder_name VARCHAR(200),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  
  -- Tax Info
  tax_id VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hangar_owners_user ON hangar_owners(user_id);
CREATE INDEX idx_hangar_owners_active ON hangar_owners(is_active);
CREATE INDEX idx_hangar_owners_verified ON hangar_owners(verified);
