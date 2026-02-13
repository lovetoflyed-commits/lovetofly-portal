-- Migration: Create moderation messages table
-- Purpose: Support direct messaging between moderators/admins and users
-- Date: 2026-02-12

-- ==================== MODERATION MESSAGES TABLE ====================
-- Stores messages sent from moderators/admins to users
CREATE TABLE IF NOT EXISTS moderation_messages (
  id SERIAL PRIMARY KEY,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_moderation_messages_recipient ON moderation_messages(recipient_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_sender ON moderation_messages(sender_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_unread ON moderation_messages(recipient_user_id, is_read) WHERE is_read = false;

-- Comment for documentation
COMMENT ON TABLE moderation_messages IS 'Direct messages from moderators/admins to users for policy violations, warnings, and general communication';
COMMENT ON COLUMN moderation_messages.sender_user_id IS 'Admin/moderator who sent the message';
COMMENT ON COLUMN moderation_messages.recipient_user_id IS 'User who receives the message';
COMMENT ON COLUMN moderation_messages.is_read IS 'Whether the recipient has read the message';
