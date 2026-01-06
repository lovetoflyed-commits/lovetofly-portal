-- Migration: Create admin_activity_log table
-- Description: Audit trail for admin actions on listings and verifications

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INTEGER NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for admin user lookups
CREATE INDEX IF NOT EXISTS idx_admin_log_admin_id ON admin_activity_log(admin_id);

-- Index for target lookups
CREATE INDEX IF NOT EXISTS idx_admin_log_target ON admin_activity_log(target_type, target_id);

-- Index for action type filtering
CREATE INDEX IF NOT EXISTS idx_admin_log_action ON admin_activity_log(action_type);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_admin_log_created ON admin_activity_log(created_at DESC);

COMMENT ON TABLE admin_activity_log IS 'Audit trail of all administrative actions';
COMMENT ON COLUMN admin_activity_log.action_type IS 'approve, reject, edit, delete, etc.';
COMMENT ON COLUMN admin_activity_log.target_type IS 'listing, verification, booking, user';
COMMENT ON COLUMN admin_activity_log.target_id IS 'ID of the affected entity';
