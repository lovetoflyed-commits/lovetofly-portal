-- Migration: Create companies table for Career/Jobs feature
-- Description: Stores company profiles, hiring information, and reputation data

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  headquarters_city VARCHAR(100),
  headquarters_country VARCHAR(100),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  description TEXT,
  culture_statement TEXT,
  
  -- Hiring info
  annual_hiring_volume INTEGER,
  hiring_status VARCHAR(50) DEFAULT 'active',
  
  -- Safety & compliance
  faa_certificate_number VARCHAR(50),
  insurance_verified BOOLEAN DEFAULT false,
  safety_record_public BOOLEAN DEFAULT false,
  
  -- Reputation
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_legal_name ON companies(legal_name);
CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_hiring_status ON companies(hiring_status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

COMMENT ON TABLE companies IS 'Company profiles for Career/Jobs marketplace';
COMMENT ON COLUMN companies.hiring_status IS 'active, paused, closed';
COMMENT ON COLUMN companies.verification_status IS 'pending, approved, rejected';
