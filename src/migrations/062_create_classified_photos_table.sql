-- Migration: Create classified_photos table for storing photos of aircraft, parts, and avionics listings
-- Date: 2026-01-20
-- Description: Similar to hangar_photos but for classified listings

-- Create classified_photos table
CREATE TABLE IF NOT EXISTS classified_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('aircraft', 'parts', 'avionics')),
  listing_id INTEGER NOT NULL,
  photo_data BYTEA, -- Binary photo storage (max 200KB recommended)
  photo_url VARCHAR(500),
  mime_type VARCHAR(50),
  file_name VARCHAR(255),
  file_size INTEGER,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classified_photos_listing 
  ON classified_photos(listing_type, listing_id);

CREATE INDEX IF NOT EXISTS idx_classified_photos_order 
  ON classified_photos(listing_type, listing_id, display_order);

CREATE INDEX IF NOT EXISTS idx_classified_photos_primary 
  ON classified_photos(is_primary) WHERE is_primary = true;

-- Composite lookup index
CREATE INDEX IF NOT EXISTS idx_classified_photos_lookup 
  ON classified_photos(listing_type, listing_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_classified_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS classified_photos_updated_at ON classified_photos;
CREATE TRIGGER classified_photos_updated_at
  BEFORE UPDATE ON classified_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_classified_photos_updated_at();

-- Add comments for documentation
COMMENT ON TABLE classified_photos IS 'Stores photos for classified listings (aircraft, parts, avionics)';
COMMENT ON COLUMN classified_photos.listing_type IS 'Type of listing: aircraft, parts, or avionics';
COMMENT ON COLUMN classified_photos.listing_id IS 'ID of the listing in respective table';
COMMENT ON COLUMN classified_photos.photo_data IS 'Binary photo data (recommended max 200KB)';
COMMENT ON COLUMN classified_photos.is_primary IS 'Primary photo shown in listings';
