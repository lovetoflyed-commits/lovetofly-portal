-- Migration: Add KYC fields to hangar_owner_verification
-- Description: Adds identity, selfie, and ownership proof fields for comprehensive verification

-- Add new columns for KYC verification
ALTER TABLE hangar_owner_verification 
  ADD COLUMN IF NOT EXISTS id_document_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS id_document_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS id_document_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_back_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS ownership_proof_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ownership_document_url TEXT,
  ADD COLUMN IF NOT EXISTS company_registration_url TEXT,
  ADD COLUMN IF NOT EXISTS tax_document_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Make document_type and document_url nullable since we're using new columns
ALTER TABLE hangar_owner_verification 
  ALTER COLUMN document_type DROP NOT NULL,
  ALTER COLUMN document_url DROP NOT NULL;

-- Drop the unique constraint on owner_id + document_type since we're changing the model
DROP INDEX IF EXISTS idx_verification_unique_doc;

-- Create index for KYC verification lookups
CREATE INDEX IF NOT EXISTS idx_verification_kyc_status 
  ON hangar_owner_verification(owner_id, verification_status);

COMMENT ON COLUMN hangar_owner_verification.id_document_type IS 'Type of ID document (CNH, RG, etc.)';
COMMENT ON COLUMN hangar_owner_verification.ownership_proof_type IS 'Type of ownership proof (escritura, contrato, procuracao)';
