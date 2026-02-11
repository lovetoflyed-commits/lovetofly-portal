-- Migration: Create business verification audit table
-- Description: Audit trail for business verification status changes
-- Date: February 10, 2026

CREATE TABLE IF NOT EXISTS business_verification_audit (
  id SERIAL PRIMARY KEY,
  business_user_id INTEGER NOT NULL REFERENCES business_users(id) ON DELETE CASCADE,
  
  -- Status change information
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  
  -- Who verified
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Notes and reasons
  notes TEXT,
  rejection_reason VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_verification_audit_business_user_id 
  ON business_verification_audit(business_user_id);
CREATE INDEX IF NOT EXISTS idx_business_verification_audit_status_to 
  ON business_verification_audit(status_to);
CREATE INDEX IF NOT EXISTS idx_business_verification_audit_created_at 
  ON business_verification_audit(created_at);

-- Add comments
COMMENT ON TABLE business_verification_audit IS 'Audit trail for tracking business user verification status changes';
