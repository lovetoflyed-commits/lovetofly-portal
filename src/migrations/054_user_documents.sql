-- Migration 054: User Documents Storage
-- Stores uploaded identity documents and selfies for verification
-- Date: January 14, 2026

-- Create user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES hangar_owners(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_front', 'id_back', 'selfie', 'business_license', 'insurance')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  validation_score INTEGER CHECK (validation_score BETWEEN 0 AND 100),
  validation_status VARCHAR(50) DEFAULT 'pending_review' CHECK (validation_status IN ('pending_review', 'approved', 'rejected', 'expired')),
  validation_issues TEXT[],
  validation_suggestions TEXT[],
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_owner_id ON user_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_validation_status ON user_documents(validation_status);
CREATE INDEX IF NOT EXISTS idx_user_documents_document_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON user_documents(created_at DESC);

-- Create composite index for pending documents by type
CREATE INDEX IF NOT EXISTS idx_user_documents_pending_by_type 
  ON user_documents(validation_status, document_type) 
  WHERE validation_status = 'pending_review';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_documents_updated_at_trigger
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_documents_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_documents IS 'Stores identity documents and verification files for users and hangar owners';
COMMENT ON COLUMN user_documents.document_type IS 'Type of document: id_front, id_back, selfie, business_license, insurance';
COMMENT ON COLUMN user_documents.validation_status IS 'Current validation status: pending_review, approved, rejected, expired';
COMMENT ON COLUMN user_documents.validation_score IS 'Automated validation score (0-100) from AI checks';
COMMENT ON COLUMN user_documents.file_url IS 'Vercel Blob storage URL for the document';
