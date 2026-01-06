-- Migration: Create hangar_owner_verification table
-- Description: Store hangar owner verification documents and identity proof

CREATE TABLE IF NOT EXISTS hangar_owner_verification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identity Verification
  id_document_type VARCHAR(50) NOT NULL,
  id_document_number VARCHAR(100) NOT NULL,
  id_document_country VARCHAR(100) NOT NULL,
  id_document_expiry DATE,
  id_document_front_url TEXT,
  id_document_back_url TEXT,
  selfie_url TEXT,
  
  -- Hangar Ownership/Authorization
  ownership_proof_type VARCHAR(50) NOT NULL,
  ownership_document_url TEXT,
  lease_agreement_url TEXT,
  authorization_letter_url TEXT,
  
  -- Biometric Data (if collected)
  biometric_data JSONB,
  biometric_verified BOOLEAN DEFAULT false,
  biometric_verified_at TIMESTAMP,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Terms Agreement
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  terms_version VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_user ON hangar_owner_verification(user_id);
CREATE INDEX idx_verification_status ON hangar_owner_verification(verification_status);
