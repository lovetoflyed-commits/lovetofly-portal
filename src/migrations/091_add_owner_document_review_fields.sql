-- Add review and reupload tracking fields for owner documents
-- Date: 2026-01-29

ALTER TABLE owner_documents
  ADD COLUMN IF NOT EXISTS ai_check_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ai_check_notes TEXT,
  ADD COLUMN IF NOT EXISTS reupload_requested_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reupload_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reupload_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_owner_documents_reupload_deadline ON owner_documents(reupload_deadline);
