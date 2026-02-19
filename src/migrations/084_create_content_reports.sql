-- Migration: 084_create_content_reports.sql
-- Date: 2026-01-28
-- Description: Content reporting for moderation queue

CREATE TABLE IF NOT EXISTS content_reports (
  id SERIAL PRIMARY KEY,
  reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(30) NOT NULL,
  content_id INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'content_reports_status_check'
  ) THEN
    ALTER TABLE content_reports
      ADD CONSTRAINT content_reports_status_check
      CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed'));
  END IF;
END $$;
