-- Migration: 081_create_forum_tables_int.sql
-- Date: 2026-01-28
-- Description: Create forum tables with INTEGER user_id for compatibility with current users schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Topics
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_topic_category CHECK (category IN ('general', 'technical', 'regulations', 'events', 'classifieds', 'questions'))
);

-- Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Likes
CREATE TABLE IF NOT EXISTS forum_topic_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (topic_id, user_id)
);

CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (reply_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_user_id ON forum_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_is_deleted ON forum_topics(is_deleted);

CREATE INDEX IF NOT EXISTS idx_forum_replies_topic_id ON forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_is_deleted ON forum_replies(is_deleted);

CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_topic_id ON forum_topic_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_user_id ON forum_topic_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply_id ON forum_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user_id ON forum_reply_likes(user_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_forum_topics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_topics_update_timestamp ON forum_topics;
CREATE TRIGGER forum_topics_update_timestamp
BEFORE UPDATE ON forum_topics
FOR EACH ROW
EXECUTE FUNCTION update_forum_topics_timestamp();

CREATE OR REPLACE FUNCTION update_forum_replies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_replies_update_timestamp ON forum_replies;
CREATE TRIGGER forum_replies_update_timestamp
BEFORE UPDATE ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_forum_replies_timestamp();
