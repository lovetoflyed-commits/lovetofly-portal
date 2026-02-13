-- Migration: 102_create_portal_messages
-- Date: 2026-02-12
-- Description: Create universal messaging system for all portal modules
-- Supports: HangarShare, Careers, Moderation, Portal communications, and all future modules

-- ==================== MAIN MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS portal_messages (
  -- Primary identification
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  
  -- Sender and Recipient (using UUID to match users table)
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'staff', 'system')),
  
  -- Module context and content
  module VARCHAR(50) NOT NULL, -- 'hangarshare', 'career', 'moderation', 'portal', 'support', 'marketplace', etc.
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Thread/Reply support (single reply, not unlimited thread)
  parent_message_id INTEGER REFERENCES portal_messages(id) ON DELETE CASCADE,
  thread_id UUID, -- All messages in conversation share same thread_id
  
  -- Related entities (optional context)
  related_entity_type VARCHAR(50), -- 'listing', 'job', 'booking', 'user_moderation', etc.
  related_entity_id VARCHAR(100), -- Generic ID (can be UUID or integer as string)
  
  -- Priority and status
  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data (flexible JSON for module-specific data)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================
-- Most common query: Get user's inbox (unread messages)
CREATE INDEX idx_portal_messages_recipient_unread ON portal_messages(recipient_user_id, is_read, sent_at DESC);

-- Get messages by sender
CREATE INDEX idx_portal_messages_sender ON portal_messages(sender_user_id, sent_at DESC);

-- Filter by module
CREATE INDEX idx_portal_messages_module ON portal_messages(module, sent_at DESC);

-- Thread conversations
CREATE INDEX idx_portal_messages_thread ON portal_messages(thread_id, sent_at ASC);

-- Parent-child relationship
CREATE INDEX idx_portal_messages_parent ON portal_messages(parent_message_id);

-- High priority messages (alerts)
CREATE INDEX idx_portal_messages_priority ON portal_messages(priority, sent_at DESC) WHERE priority IN ('high', 'urgent');

-- Related entities (for module-specific queries)
CREATE INDEX idx_portal_messages_related ON portal_messages(related_entity_type, related_entity_id);

-- Sent date ordering (for pagination)
CREATE INDEX idx_portal_messages_sent_at ON portal_messages(sent_at DESC);

-- GIN index for metadata JSONB searches
CREATE INDEX idx_portal_messages_metadata ON portal_messages USING GIN(metadata);

-- ==================== TRIGGER FOR AUTO-UPDATE ====================
CREATE OR REPLACE FUNCTION update_portal_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portal_messages_updated_at
  BEFORE UPDATE ON portal_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_messages_updated_at();

-- ==================== COMMENTS FOR DOCUMENTATION ====================
COMMENT ON TABLE portal_messages IS 'Universal messaging system for all portal modules (HangarShare, Careers, Moderation, etc.)';
COMMENT ON COLUMN portal_messages.module IS 'Source module: hangarshare, career, moderation, portal, support, marketplace, etc.';
COMMENT ON COLUMN portal_messages.sender_type IS 'Type of sender: user (normal user), admin (admin/staff), system (automated message)';
COMMENT ON COLUMN portal_messages.priority IS 'Message priority: low (promos), normal (standard), high (action needed), urgent (critical)';
COMMENT ON COLUMN portal_messages.thread_id IS 'Groups messages in same conversation (for single reply support)';
COMMENT ON COLUMN portal_messages.related_entity_type IS 'Type of related object (listing, job, booking, etc.) for context';
COMMENT ON COLUMN portal_messages.related_entity_id IS 'ID of related object (stored as string for flexibility)';
COMMENT ON COLUMN portal_messages.metadata IS 'Module-specific additional data in JSON format';

-- ==================== INITIAL DATA ====================
-- No initial data needed, table starts empty
