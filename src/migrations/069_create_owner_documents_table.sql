-- Create owner documents table for storing registration documentation
CREATE TABLE IF NOT EXISTS owner_documents (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES hangar_owners(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'cnpj_certificate', 'registration', 'insurance', 'tax_clearance', etc.
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Path where file is stored
  file_size BIGINT, -- Size in bytes
  mime_type VARCHAR(100), -- application/pdf, image/jpeg, etc.
  upload_status VARCHAR(20) DEFAULT 'pending', -- pending, uploaded, verified, rejected
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_owner_documents_owner_id ON owner_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_documents_status ON owner_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_owner_documents_type ON owner_documents(document_type);

-- Add comment
COMMENT ON TABLE owner_documents IS 'Stores registration and compliance documents uploaded by hangar owners';
