-- Migration: Add resume photo to career profiles
-- Description: Add profile photo field for career resume display

ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS resume_photo TEXT;
ALTER TABLE career_profiles ADD COLUMN IF NOT EXISTS photo_source VARCHAR(50) DEFAULT 'portal';

COMMENT ON COLUMN career_profiles.resume_photo IS 'Base64 encoded profile photo or URL for the resume';
COMMENT ON COLUMN career_profiles.photo_source IS 'portal or upload - indicates whether to use portal photo or uploaded photo';
