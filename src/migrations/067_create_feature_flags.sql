-- Migration 067: Create feature_flags table for A/B testing and feature rollout
-- Date: 2026-01-20
-- Purpose: Enable zero-downtime feature flag support for HangarShare V2 dashboard

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial feature flag for HangarShare V2
INSERT INTO feature_flags (name, enabled, description) 
VALUES (
  'hangarshare_new_dashboard', 
  false, 
  'Controls visibility of new HangarShare V2 management dashboard - enables gradual rollout'
)
ON CONFLICT (name) DO NOTHING;

-- Create index for fast lookups by flag name
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);

-- Create index for finding enabled flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
