-- Add parent reply support for threaded replies
ALTER TABLE forum_replies
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
