-- Migration: Create bad conduct alerts table
-- Purpose: Track automated alerts for suspicious user behavior and policy violations
-- Date: 2026-02-12

-- ==================== BAD CONDUCT ALERTS TABLE ====================
-- Stores automated alerts triggered by suspicious behavior patterns
CREATE TABLE IF NOT EXISTS bad_conduct_alerts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_user_id ON bad_conduct_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_status ON bad_conduct_alerts(status) WHERE status IN ('pending', 'investigating');
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_severity ON bad_conduct_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_created_at ON bad_conduct_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_alert_type ON bad_conduct_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_bad_conduct_alerts_metadata ON bad_conduct_alerts USING GIN(metadata);

-- Comment for documentation
COMMENT ON TABLE bad_conduct_alerts IS 'Automated alerts for suspicious behavior patterns and policy violations';
COMMENT ON COLUMN bad_conduct_alerts.alert_type IS 'Type of detected behavior (e.g., multiple_failed_logins, spam_detected, suspicious_activity_pattern)';
COMMENT ON COLUMN bad_conduct_alerts.severity IS 'Alert severity level: low, medium, high, or critical';
COMMENT ON COLUMN bad_conduct_alerts.metadata IS 'Additional data about the alert (JSON format) such as IP addresses, timestamps, counts, etc.';
COMMENT ON COLUMN bad_conduct_alerts.status IS 'Current status of the alert: pending, investigating, resolved, or dismissed';
