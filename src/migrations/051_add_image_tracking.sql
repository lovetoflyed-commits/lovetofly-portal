-- Migration 051: Add image tracking to hangar listings
-- Enables mandatory image uploads during registration

BEGIN;

-- Add image tracking columns to hangar_listings if they don't exist
ALTER TABLE hangar_listings
ADD COLUMN IF NOT EXISTS image_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS images_count INTEGER DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hangar_listings_image_url_not_null_check'
  ) THEN
    ALTER TABLE hangar_listings
      ADD CONSTRAINT hangar_listings_image_url_not_null_check
      CHECK (image_url IS NOT NULL OR is_paid = false);
  END IF;
END $$;

-- Create hangar_image_uploads table for tracking all uploads
CREATE TABLE IF NOT EXISTS hangar_image_uploads (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_key VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(50),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_primary BOOLEAN DEFAULT false,
  storage_provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_hangar_image_uploads_listing_id 
  ON hangar_image_uploads(listing_id);
CREATE INDEX IF NOT EXISTS idx_hangar_image_uploads_uploaded_by 
  ON hangar_image_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_hangar_image_uploads_created_at 
  ON hangar_image_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hangar_image_uploads_is_primary 
  ON hangar_image_uploads(listing_id, is_primary);

-- Create image validation rules table
CREATE TABLE IF NOT EXISTS image_validation_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  max_file_size INTEGER DEFAULT 5242880, -- 5MB in bytes
  allowed_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp'],
  min_width INTEGER DEFAULT 800,
  min_height INTEGER DEFAULT 600,
  required_for_listing BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default validation rules
INSERT INTO image_validation_rules (rule_name, required_for_listing)
VALUES ('hangar_primary_image', true)
ON CONFLICT (rule_name) DO NOTHING;

-- Create trigger to update hangar_listings updated_at on image upload
CREATE OR REPLACE FUNCTION update_hangar_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hangar_listings 
  SET updated_at = CURRENT_TIMESTAMP,
      images_count = (SELECT COUNT(*) FROM hangar_image_uploads WHERE listing_id = NEW.listing_id)
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hangar_image_uploads_update_listing ON hangar_image_uploads;
CREATE TRIGGER hangar_image_uploads_update_listing
AFTER INSERT ON hangar_image_uploads
FOR EACH ROW
EXECUTE FUNCTION update_hangar_listings_updated_at();

COMMIT;
