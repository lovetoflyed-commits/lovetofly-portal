-- Migration: Add restore action type to moderation
-- Purpose: Allow admins to restore user access
-- Date: 2026-01-13

-- Drop the old constraint and recreate with restore action
ALTER TABLE user_moderation DROP CONSTRAINT user_moderation_action_type_check;

-- Add new constraint that includes 'restore'
ALTER TABLE user_moderation ADD CONSTRAINT user_moderation_action_type_check 
  CHECK (action_type IN ('warning', 'strike', 'suspend', 'ban', 'restore'));
