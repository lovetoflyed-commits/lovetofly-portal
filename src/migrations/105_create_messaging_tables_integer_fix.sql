-- Migration: 105_create_messaging_tables_integer_fix
-- Date: 2026-02-13
-- Description: Create messaging system tables with INTEGER user IDs (fixing earlier UUID migration)

-- ==================== MODERATION MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS moderation_messages (
  id SERIAL PRIMARY KEY,
  sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_messages_recipient ON moderation_messages(recipient_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_sender ON moderation_messages(sender_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_unread ON moderation_messages(recipient_user_id, is_read) WHERE is_read = false;

-- ==================== BAD CONDUCT ALERTS TABLE ====================
CREATE TABLE IF NOT EXISTS bad_conduct_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_user_id ON bad_conduct_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_status ON bad_conduct_alerts(status) WHERE status IN ('pending', 'investigating');
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_severity ON bad_conduct_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_created_at ON bad_conduct_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_alert_type ON bad_conduct_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_metadata ON bad_conduct_alerts USING GIN(metadata);

-- ==================== PORTAL MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS portal_messages (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  
  -- Sender and Recipient (using INTEGER to match users table id)
  sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'staff', 'system')),
  
  -- Module context and content
  module VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Thread/Reply support
  parent_message_id INTEGER REFERENCES portal_messages(id) ON DELETE CASCADE,
  thread_id UUID,
  
  -- Related entities
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  
  -- Priority and status
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_messages_recipient_unread ON portal_messages(recipient_user_id, is_read, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender ON portal_messages(sender_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_module ON portal_messages(module, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread ON portal_messages(thread_id, sent_at ASC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_parent ON portal_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_priority ON portal_messages(priority, sent_at DESC) WHERE priority IN ('high', 'urgent');
CREATE INDEX IF NOT EXISTS idx_portal_messages_related ON portal_messages(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sent_at ON portal_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_messages_metadata ON portal_messages USING GIN(metadata);

-- Trigger for auto-update
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

-- ==================== PORTAL MESSAGE REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS portal_message_reports (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES portal_messages(id) ON DELETE CASCADE,
  reported_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'dismissed', 'actioned')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_message_reports_message_id ON portal_message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_status ON portal_message_reports(status);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_created_at ON portal_message_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_message_reports_metadata ON portal_message_reports USING GIN(metadata);
