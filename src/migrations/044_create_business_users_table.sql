-- Migration: Create business_users table
-- Description: Stores business-specific information for Pessoa Jurídica users
-- Date: February 10, 2026

CREATE TABLE IF NOT EXISTS business_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Legal Information
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),  -- airline, flight_school, maintenance, etc.
  
  -- Contact Information
  business_phone VARCHAR(20),
  business_email VARCHAR(255),
  website VARCHAR(255),
  representative_name VARCHAR(255),
  representative_title VARCHAR(100),
  
  -- Headquarters Address
  headquarters_street VARCHAR(255),
  headquarters_number VARCHAR(20),
  headquarters_complement VARCHAR(255),
  headquarters_neighborhood VARCHAR(100),
  headquarters_city VARCHAR(100),
  headquarters_state VARCHAR(2),
  headquarters_zip VARCHAR(20),
  headquarters_country VARCHAR(100) DEFAULT 'Brasil',
  
  -- Business Details
  company_size VARCHAR(50),  -- micro, small, medium, large
  industry VARCHAR(100),
  description TEXT,
  established_year INTEGER,
  annual_hiring_volume INTEGER,
  
  -- Primary Operations (stored as JSON array or pipe-separated)
  primary_operations TEXT,  -- JSON array or pipe-separated values
  
  -- Verification & Compliance
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  verification_notes TEXT,
  verification_date TIMESTAMP,
  
  -- Safety & Certification
  faa_certificate_number VARCHAR(50),
  insurance_verified BOOLEAN DEFAULT false,
  safety_record_public BOOLEAN DEFAULT false,
  
  -- Hiring & Operations Status
  hiring_status VARCHAR(50) DEFAULT 'active',  -- active, paused, closed
  operation_status VARCHAR(50) DEFAULT 'active',  -- active, inactive, suspended
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_cnpj ON business_users(cnpj);
CREATE INDEX IF NOT EXISTS idx_business_users_verification_status ON business_users(verification_status);
CREATE INDEX IF NOT EXISTS idx_business_users_hiring_status ON business_users(hiring_status);
CREATE INDEX IF NOT EXISTS idx_business_users_operation_status ON business_users(operation_status);
CREATE INDEX IF NOT EXISTS idx_business_users_business_type ON business_users(business_type);

-- Add comments for documentation
COMMENT ON TABLE business_users IS 'Business profiles for Pessoa Jurídica users (companies/enterprises)';
COMMENT ON COLUMN business_users.verification_status IS 'pending: awaiting admin review, approved: verified and active, rejected: application declined';
COMMENT ON COLUMN business_users.hiring_status IS 'active: actively hiring, paused: temporarily paused, closed: not hiring';
COMMENT ON COLUMN business_users.operation_status IS 'active: normal operations, inactive: no longer active, suspended: temporarily disabled';
