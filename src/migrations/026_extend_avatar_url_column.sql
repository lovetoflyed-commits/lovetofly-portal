-- Migration: Extend avatar_url column to support data URLs
-- Data URLs can be very long (base64 encoded images)

ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;

COMMENT ON COLUMN users.avatar_url IS 'User avatar - supports URLs or data URLs (base64)';
