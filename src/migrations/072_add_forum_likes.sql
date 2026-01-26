-- Create forum topic likes table
CREATE TABLE IF NOT EXISTS forum_topic_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (topic_id, user_id)
);

-- Create forum reply likes table
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (reply_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_topic_id ON forum_topic_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_topic_likes_user_id ON forum_topic_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply_id ON forum_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user_id ON forum_reply_likes(user_id);