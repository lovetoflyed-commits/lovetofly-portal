-- Migration: Create user_activity_log table
-- Description: Comprehensive activity tracking for all user actions (login, logout, CRUD operations, etc.)

CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_category VARCHAR(50) NOT NULL,
  description TEXT,
  details JSONB,
  target_type VARCHAR(100),
  target_id VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure newer columns exist when a previous migration created the table
ALTER TABLE user_activity_log
  ADD COLUMN IF NOT EXISTS activity_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS target_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS old_value TEXT,
  ADD COLUMN IF NOT EXISTS new_value TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_category ON user_activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_user_activity_target ON user_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity_log(user_id, created_at DESC);

-- Comments
COMMENT ON TABLE user_activity_log IS 'Comprehensive activity audit trail for all user actions in the portal';
COMMENT ON COLUMN user_activity_log.activity_type IS 'Specific action: login, logout, data_add, data_edit, data_delete, comment_add, etc.';
COMMENT ON COLUMN user_activity_log.activity_category IS 'Category: authentication, data_management, comments, course, flight_plan, etc.';
COMMENT ON COLUMN user_activity_log.description IS 'Human-readable description of the activity';
COMMENT ON COLUMN user_activity_log.details IS 'JSON object with additional context (e.g., field changed, values, etc.)';
COMMENT ON COLUMN user_activity_log.target_type IS 'Type of resource affected: user, course, flight_plan, comment, hangar, etc.';
COMMENT ON COLUMN user_activity_log.target_id IS 'ID of the affected resource';
COMMENT ON COLUMN user_activity_log.old_value IS 'Previous value for data modifications';
COMMENT ON COLUMN user_activity_log.new_value IS 'New value for data modifications';
COMMENT ON COLUMN user_activity_log.status IS 'success, failed, warning';
