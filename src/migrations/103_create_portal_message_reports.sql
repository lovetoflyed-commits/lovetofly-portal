-- Migration: 103_create_portal_message_reports
-- Date: 2026-02-12
-- Description: Create reporting system for spam/abuse in portal messages
-- Allows users to report inappropriate messages for moderation review

-- ==================== MESSAGE REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS portal_message_reports (
  id SERIAL PRIMARY KEY,
  
  -- Reported message
  message_id INTEGER NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  
  -- Reporter information
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Report details
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'scam', 'inappropriate', 'phishing', 'other')),
  details TEXT, -- Optional additional context from reporter
  
  -- Review status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who reviewed
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT, -- Admin notes about the review
  action_taken VARCHAR(100), -- What action was taken (e.g., 'user_warned', 'message_deleted', 'no_action')
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================== INDEXES ====================
-- Get all reports for a message
CREATE INDEX idx_portal_message_reports_message ON portal_message_reports(message_id);

-- Get pending reports for moderation
CREATE INDEX idx_portal_message_reports_status ON portal_message_reports(status, created_at DESC) WHERE status IN ('pending', 'reviewing');

-- Get reports by user (to detect report abusers)
CREATE INDEX idx_portal_message_reports_reporter ON portal_message_reports(reporter_user_id);

-- Reviews by admin
CREATE INDEX idx_portal_message_reports_reviewer ON portal_message_reports(reviewed_by);

-- ==================== CONSTRAINTS ====================
-- Prevent duplicate reports (same user reporting same message)
CREATE UNIQUE INDEX idx_portal_message_reports_unique_report ON portal_message_reports(message_id, reporter_user_id);

-- ==================== COMMENTS ====================
COMMENT ON TABLE portal_message_reports IS 'User reports of spam, abuse, or inappropriate messages for moderation review';
COMMENT ON COLUMN portal_message_reports.reason IS 'Type of violation: spam, harassment, scam, inappropriate, phishing, or other';
COMMENT ON COLUMN portal_message_reports.status IS 'Review status: pending (new), reviewing (being checked), resolved (action taken), dismissed (no action)';
COMMENT ON COLUMN portal_message_reports.action_taken IS 'What action moderator took after review';

-- ==================== INITIAL DATA ====================
-- No initial data needed, table starts empty
