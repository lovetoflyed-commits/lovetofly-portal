-- Migration: Create user moderation and activity tracking tables
-- Purpose: Support user moderation (strikes, warnings, suspensions, bans) and activity monitoring
-- Date: 2026-01-13

-- ==================== USER MODERATION TABLE ====================
-- Stores moderation actions (warnings, strikes, suspensions, bans)
CREATE TABLE IF NOT EXISTS user_moderation (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('warning', 'strike', 'suspend', 'ban')),
  reason TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  suspension_end_date TIMESTAMP WITH TIME ZONE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_moderation_user_id ON user_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_active ON user_moderation(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_moderation_action_type ON user_moderation(action_type);
CREATE INDEX IF NOT EXISTS idx_user_moderation_issued_at ON user_moderation(issued_at DESC);

-- ==================== USER ACTIVITY LOG TABLE ====================
-- Tracks user activities (login, logout, actions)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON user_activity_log(user_id, created_at DESC);

-- ==================== USER LAST ACTIVITY VIEW ====================
-- Quick view to see last activity of each user
-- NOTE: Excludes admin-initiated activities (activity_category = 'admin') 
-- so that staff edits don't count as user activity
CREATE OR REPLACE VIEW user_last_activity AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  MAX(al.created_at) as last_activity_at,
  EXTRACT(DAY FROM NOW() - MAX(al.created_at)) as days_inactive
FROM users u
LEFT JOIN user_activity_log al ON u.id = al.user_id 
  AND al.activity_category != 'admin' -- Exclude admin-initiated activities
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- ==================== ACTIVE MODERATION VIEW ====================
-- View to see current moderation status of users
CREATE OR REPLACE VIEW user_moderation_status AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(CASE WHEN um.action_type = 'warning' AND um.is_active THEN 1 END) as active_warnings,
  COUNT(CASE WHEN um.action_type = 'strike' AND um.is_active THEN 1 END) as active_strikes,
  MAX(CASE WHEN um.action_type = 'suspend' AND um.is_active THEN um.suspension_end_date END) as suspended_until,
  CASE WHEN EXISTS(SELECT 1 FROM user_moderation WHERE user_id = u.id AND action_type = 'ban' AND is_active = true) 
    THEN true ELSE false END as is_banned,
  MAX(um.issued_at) as last_moderation_date
FROM users u
LEFT JOIN user_moderation um ON u.id = um.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- ==================== USER ACCESS STATUS TABLE ====================
-- Tracks user access status (independent from role, for temporary restrictions)
CREATE TABLE IF NOT EXISTS user_access_status (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_level VARCHAR(20) DEFAULT 'active' CHECK (access_level IN ('active', 'warning', 'restricted', 'suspended', 'banned')),
  access_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  restore_date TIMESTAMP WITH TIME ZONE,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for access status queries
CREATE INDEX IF NOT EXISTS idx_user_access_status_level ON user_access_status(access_level);
CREATE INDEX IF NOT EXISTS idx_user_access_status_user_id ON user_access_status(user_id);

-- Comment for documentation
COMMENT ON TABLE user_moderation IS 'Stores moderation actions taken against users (warnings, strikes, suspensions, bans) with audit trail';
COMMENT ON TABLE user_activity_log IS 'Tracks user activities for monitoring and analytics purposes';
COMMENT ON TABLE user_access_status IS 'Current access status of each user (active, restricted, suspended, banned)';
COMMENT ON VIEW user_last_activity IS 'View showing last activity timestamp and days inactive for each user';
COMMENT ON VIEW user_moderation_status IS 'View showing current moderation status (warnings, strikes, suspensions, bans) for each user';
