-- Migration: 107_recreate_messaging_tables_simple
-- Date: 2026-02-13
-- Description: Recreate messaging tables with flexible ID columns (no FK constraints for now)

-- Drop existing tables that depend on users
DROP TABLE IF EXISTS portal_message_reports CASCADE;
DROP TABLE IF EXISTS portal_messages CASCADE;
DROP TABLE IF EXISTS moderation_messages CASCADE;
DROP TABLE IF EXISTS bad_conduct_alerts CASCADE;

-- Create moderation_messages with TEXT user_id to accept both UUID and INTEGER
CREATE TABLE IF NOT EXISTS moderation_messages (
  id SERIAL PRIMARY KEY,
  sender_user_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moderation_messages_recipient ON moderation_messages(recipient_user_id, sent_at DESC);
CREATE INDEX idx_moderation_messages_sender ON moderation_messages(sender_user_id, sent_at DESC);
CREATE INDEX idx_moderation_messages_unread ON moderation_messages(recipient_user_id, is_read) WHERE is_read = false;

-- Create bad_conduct_alerts with TEXT user_id to accept both UUID and INTEGER
CREATE TABLE IF NOT EXISTS bad_conduct_alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  resolution_notes TEXT
);

CREATE INDEX idx_bad_conduct_alerts_user_id ON bad_conduct_alerts(user_id);
CREATE INDEX idx_bad_conduct_alerts_status ON bad_conduct_alerts(status) WHERE status IN ('pending', 'investigating');
CREATE INDEX idx_bad_conduct_alerts_severity ON bad_conduct_alerts(severity);
CREATE INDEX idx_bad_conduct_alerts_created_at ON bad_conduct_alerts(created_at DESC);
CREATE INDEX idx_bad_conduct_alerts_alert_type ON bad_conduct_alerts(alert_type);
CREATE INDEX idx_bad_conduct_alerts_metadata ON bad_conduct_alerts USING GIN(metadata);

-- Create portal_messages with TEXT user_id to accept both UUID and INTEGER
CREATE TABLE IF NOT EXISTS portal_messages (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  sender_user_id TEXT,
  recipient_user_id TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'staff', 'system')),
  module VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  parent_message_id INTEGER REFERENCES portal_messages(id) ON DELETE CASCADE,
  thread_id UUID,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_portal_messages_recipient_unread ON portal_messages(recipient_user_id, is_read, sent_at DESC);
CREATE INDEX idx_portal_messages_sender ON portal_messages(sender_user_id, sent_at DESC);
CREATE INDEX idx_portal_messages_module ON portal_messages(module, sent_at DESC);
CREATE INDEX idx_portal_messages_thread ON portal_messages(thread_id, sent_at ASC);
CREATE INDEX idx_portal_messages_parent ON portal_messages(parent_message_id);
CREATE INDEX idx_portal_messages_priority ON portal_messages(priority, sent_at DESC) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_portal_messages_related ON portal_messages(related_entity_type, related_entity_id);
CREATE INDEX idx_portal_messages_sent_at ON portal_messages(sent_at DESC);
CREATE INDEX idx_portal_messages_metadata ON portal_messages USING GIN(metadata);

-- Create portal_message_reports
CREATE TABLE IF NOT EXISTS portal_message_reports (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_portal_message_reports_message_id ON portal_message_reports(message_id);
CREATE INDEX idx_portal_message_reports_status ON portal_message_reports(status);
CREATE INDEX idx_portal_message_reports_created_at ON portal_message_reports(created_at DESC);
CREATE INDEX idx_portal_message_reports_metadata ON portal_message_reports USING GIN(metadata);

-- Create trigger for portal_messages updated_at
CREATE OR REPLACE FUNCTION update_portal_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_portal_messages_updated_at ON portal_messages;
CREATE TRIGGER trigger_update_portal_messages_updated_at
BEFORE UPDATE ON portal_messages
FOR EACH ROW
EXECUTE FUNCTION update_portal_messages_updated_at();
