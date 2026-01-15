-- Migration 053: Add binary photo storage to hangar_photos table
-- Stores photos directly in database with 200KB limit for MVP phase
-- Includes storage monitoring support

-- Add columns for binary storage
ALTER TABLE hangar_photos ADD COLUMN IF NOT EXISTS photo_data BYTEA;
ALTER TABLE hangar_photos ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50);
ALTER TABLE hangar_photos ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE hangar_photos ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN hangar_photos.photo_data IS 'Binary photo data (max 200KB per photo)';
COMMENT ON COLUMN hangar_photos.mime_type IS 'MIME type (image/jpeg, image/webp, image/png)';
COMMENT ON COLUMN hangar_photos.file_name IS 'Original file name';
COMMENT ON COLUMN hangar_photos.file_size IS 'File size in bytes';

-- Create index on listing_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_hangar_photos_listing ON hangar_photos(listing_id);

-- Create storage monitoring table
CREATE TABLE IF NOT EXISTS storage_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL, -- 'warning', 'critical', 'info'
  alert_level INTEGER NOT NULL, -- 70, 85, 95 (percentage)
  total_size_bytes BIGINT NOT NULL,
  photo_count INTEGER NOT NULL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by INTEGER,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for unacknowledged alerts
CREATE INDEX IF NOT EXISTS idx_storage_alerts_unack ON storage_alerts(acknowledged) WHERE acknowledged = FALSE;

COMMENT ON TABLE storage_alerts IS 'Tracks storage capacity alerts for admin notification';
