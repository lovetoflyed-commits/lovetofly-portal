-- Migration: Create hangar_photos table
-- Description: Stores photos for hangar listings with display order and primary flag

CREATE TABLE IF NOT EXISTS hangar_photos (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by listing
CREATE INDEX IF NOT EXISTS idx_hangar_photos_listing_id ON hangar_photos(listing_id);

-- Index for finding primary photos
CREATE INDEX IF NOT EXISTS idx_hangar_photos_primary ON hangar_photos(listing_id, is_primary);

COMMENT ON TABLE hangar_photos IS 'Photos for hangar listings with ordering and primary designation';
COMMENT ON COLUMN hangar_photos.listing_id IS 'Foreign key to hangar_listings table';
COMMENT ON COLUMN hangar_photos.is_primary IS 'Designates the main photo shown in listings';
COMMENT ON COLUMN hangar_photos.display_order IS 'Order photos appear in gallery (0 = first)';
