-- Migration: Create hangar_owner_verification table
-- Description: Stores verification documents for hangar owners

CREATE TABLE IF NOT EXISTS hangar_owner_verification (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES hangar_owners(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_url TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_verification_owner_id ON hangar_owner_verification(owner_id);

-- Index for document type
CREATE INDEX IF NOT EXISTS idx_verification_doc_type ON hangar_owner_verification(document_type);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_verification_status ON hangar_owner_verification(verification_status);

-- Unique constraint: one document per type per owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_unique_doc 
  ON hangar_owner_verification(owner_id, document_type);

COMMENT ON TABLE hangar_owner_verification IS 'Verification documents for hangar owners (CNPJ, insurance, etc.)';
COMMENT ON COLUMN hangar_owner_verification.document_type IS 'cnpj, business_license, insurance_certificate, etc.';
COMMENT ON COLUMN hangar_owner_verification.verification_status IS 'pending, approved, rejected';
