-- Migration 071: Enable HangarShare V2 dashboard feature flag
-- Date: 2026-01-24
-- Purpose: Turn on new HangarShare V2 management dashboard

INSERT INTO feature_flags (name, enabled, description)
VALUES (
  'hangarshare_new_dashboard',
  true,
  'Controls visibility of new HangarShare V2 management dashboard - enables gradual rollout'
)
ON CONFLICT (name)
DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;
