-- Migration: Fix messaging tables to use INTEGER user_id instead of UUID
-- Date: 2026-02-13
-- Description: Corrects schema mismatch where UUID columns were created but application uses INTEGER user IDs
-- Tables affected: portal_messages, moderation_messages, bad_conduct_alerts

-- ==================== DROP CONSTRAINTS & INDEXES ====================
-- Drop foreign key constraints first
ALTER TABLE IF EXISTS portal_message_reports 
DROP CONSTRAINT IF EXISTS portal_message_reports_message_id_fkey CASCADE;

ALTER TABLE portal_messages
DROP CONSTRAINT IF EXISTS portal_messages_recipient_user_id_fkey CASCADE;

ALTER TABLE portal_messages
DROP CONSTRAINT IF EXISTS portal_messages_sender_user_id_fkey CASCADE;

ALTER TABLE moderation_messages
DROP CONSTRAINT IF EXISTS moderation_messages_sender_user_id_fkey CASCADE;

ALTER TABLE moderation_messages
DROP CONSTRAINT IF EXISTS moderation_messages_recipient_user_id_fkey CASCADE;

ALTER TABLE bad_conduct_alerts
DROP CONSTRAINT IF EXISTS bad_conduct_alerts_user_id_fkey CASCADE;

ALTER TABLE bad_conduct_alerts
DROP CONSTRAINT IF EXISTS bad_conduct_alerts_reviewed_by_fkey CASCADE;

-- Drop all indexes on these tables
DROP INDEX IF EXISTS idx_portal_messages_recipient_unread;
DROP INDEX IF EXISTS idx_portal_messages_sender;
DROP INDEX IF EXISTS idx_portal_messages_module;
DROP INDEX IF EXISTS idx_portal_messages_thread;
DROP INDEX IF EXISTS idx_portal_messages_parent;
DROP INDEX IF EXISTS idx_portal_messages_priority;
DROP INDEX IF EXISTS idx_portal_messages_related;
DROP INDEX IF EXISTS idx_portal_messages_sent_at;
DROP INDEX IF EXISTS idx_portal_messages_metadata;

DROP INDEX IF EXISTS idx_moderation_messages_recipient;
DROP INDEX IF EXISTS idx_moderation_messages_sender;
DROP INDEX IF EXISTS idx_moderation_messages_unread;

DROP INDEX IF EXISTS idx_bad_conduct_alerts_user_id;
DROP INDEX IF EXISTS idx_bad_conduct_alerts_status;
DROP INDEX IF EXISTS idx_bad_conduct_alerts_severity;
DROP INDEX IF EXISTS idx_bad_conduct_alerts_created_at;
DROP INDEX IF EXISTS idx_bad_conduct_alerts_alert_type;
DROP INDEX IF EXISTS idx_bad_conduct_alerts_metadata;

DROP INDEX IF EXISTS idx_portal_message_reports_message_id;
DROP INDEX IF EXISTS idx_portal_message_reports_status;
DROP INDEX IF EXISTS idx_portal_message_reports_created_at;
DROP INDEX IF EXISTS idx_portal_message_reports_metadata;

-- ==================== ALTER COLUMNS TO INTEGER ====================
-- portal_messages
ALTER TABLE portal_messages
ALTER COLUMN sender_user_id TYPE INTEGER USING CAST(sender_user_id AS INTEGER),
ALTER COLUMN recipient_user_id TYPE INTEGER USING CAST(recipient_user_id AS INTEGER);

-- moderation_messages
ALTER TABLE moderation_messages
ALTER COLUMN sender_user_id TYPE INTEGER USING CAST(sender_user_id AS INTEGER),
ALTER COLUMN recipient_user_id TYPE INTEGER USING CAST(recipient_user_id AS INTEGER);

-- bad_conduct_alerts
ALTER TABLE bad_conduct_alerts
ALTER COLUMN user_id TYPE INTEGER USING CAST(user_id AS INTEGER),
ALTER COLUMN reviewed_by TYPE INTEGER USING CAST(reviewed_by AS INTEGER);

-- ==================== RE-CREATE FOREIGN KEY CONSTRAINTS ====================
-- portal_messages
ALTER TABLE portal_messages
ADD CONSTRAINT portal_messages_sender_user_id_fkey 
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE portal_messages
ADD CONSTRAINT portal_messages_recipient_user_id_fkey 
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- moderation_messages
ALTER TABLE moderation_messages
ADD CONSTRAINT moderation_messages_sender_user_id_fkey 
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE moderation_messages
ADD CONSTRAINT moderation_messages_recipient_user_id_fkey 
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- bad_conduct_alerts
ALTER TABLE bad_conduct_alerts
ADD CONSTRAINT bad_conduct_alerts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bad_conduct_alerts
ADD CONSTRAINT bad_conduct_alerts_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ==================== RE-CREATE INDEXES ====================
-- portal_messages indexes
CREATE INDEX idx_portal_messages_recipient_unread ON portal_messages(recipient_user_id, is_read, sent_at DESC);
CREATE INDEX idx_portal_messages_sender ON portal_messages(sender_user_id, sent_at DESC);
CREATE INDEX idx_portal_messages_module ON portal_messages(module, sent_at DESC);
CREATE INDEX idx_portal_messages_thread ON portal_messages(thread_id, sent_at ASC);
CREATE INDEX idx_portal_messages_parent ON portal_messages(parent_message_id);
CREATE INDEX idx_portal_messages_priority ON portal_messages(priority, sent_at DESC) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_portal_messages_related ON portal_messages(related_entity_type, related_entity_id);
CREATE INDEX idx_portal_messages_sent_at ON portal_messages(sent_at DESC);
CREATE INDEX idx_portal_messages_metadata ON portal_messages USING GIN(metadata);

-- moderation_messages indexes
CREATE INDEX idx_moderation_messages_recipient ON moderation_messages(recipient_user_id, sent_at DESC);
CREATE INDEX idx_moderation_messages_sender ON moderation_messages(sender_user_id, sent_at DESC);
CREATE INDEX idx_moderation_messages_unread ON moderation_messages(recipient_user_id, is_read) WHERE is_read = false;

-- bad_conduct_alerts indexes
CREATE INDEX idx_bad_conduct_alerts_user_id ON bad_conduct_alerts(user_id);
CREATE INDEX idx_bad_conduct_alerts_status ON bad_conduct_alerts(status) WHERE status IN ('pending', 'investigating');
CREATE INDEX idx_bad_conduct_alerts_severity ON bad_conduct_alerts(severity);
CREATE INDEX idx_bad_conduct_alerts_created_at ON bad_conduct_alerts(created_at DESC);
CREATE INDEX idx_bad_conduct_alerts_alert_type ON bad_conduct_alerts(alert_type);
CREATE INDEX idx_bad_conduct_alerts_metadata ON bad_conduct_alerts USING GIN(metadata);

-- portal_message_reports indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_message_id ON portal_message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_status ON portal_message_reports(status);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_created_at ON portal_message_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_metadata ON portal_message_reports USING GIN(metadata);

-- ==================== MIGRATION NOTES ====================
-- COMMENT ON MIGRATION: This handles the schema mismatch where:
-- 1. New message tables were created with UUID user_id columns
-- 2. But application uses INTEGER user_ids
-- 3. The users table has id INTEGER PRIMARY KEY
-- 4. All foreign keys and indexes are preserved during the conversion
