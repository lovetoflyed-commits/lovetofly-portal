-- Migration: Create user notifications table for membership and system alerts

CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- membership_past_due, membership_expired, payment_received, system_alert
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  action_url VARCHAR(255),
  action_label VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  expires_at TIMESTAMP, -- Notification auto-expires after this date
  metadata JSONB, -- Store additional data like days_until_downgrade, plan_name, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON user_notifications(user_id, is_read);

-- Table for email delivery logs
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- membership_past_due, membership_expired, payment_receipt, etc
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, bounced
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
