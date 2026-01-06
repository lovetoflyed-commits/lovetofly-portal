-- Migration: Add missing HangarShare listing fields
-- Date: 2026-01-06
-- SAFETY: Only ADDS columns with defaults - NO breaking changes
-- Impact: Zero downtime, existing data unchanged, all queries continue working

-- ============================================================================
-- STEP 1: Add missing pricing field
-- ============================================================================
ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12,2) DEFAULT NULL;

COMMENT ON COLUMN hangar_listings.hourly_rate IS 'Hourly rental rate (optional pricing tier)';

-- ============================================================================
-- STEP 2: Add availability date fields
-- ============================================================================
ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS available_from DATE DEFAULT NULL;

ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS available_until DATE DEFAULT NULL;

COMMENT ON COLUMN hangar_listings.available_from IS 'Start date of availability (NULL = available now)';
COMMENT ON COLUMN hangar_listings.available_until IS 'End date of availability (NULL = indefinite)';

-- ============================================================================
-- STEP 3: Add payment method flags
-- ============================================================================
ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS accepts_online_payment BOOLEAN DEFAULT TRUE;

ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS accepts_payment_on_arrival BOOLEAN DEFAULT TRUE;

ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS accepts_payment_on_departure BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN hangar_listings.accepts_online_payment IS 'Accepts online payment (card/Pix)';
COMMENT ON COLUMN hangar_listings.accepts_payment_on_arrival IS 'Accepts payment on arrival';
COMMENT ON COLUMN hangar_listings.accepts_payment_on_departure IS 'Accepts payment on departure';

-- ============================================================================
-- STEP 4: Add policy and description fields
-- ============================================================================
ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50) DEFAULT 'flexible';

ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS hangar_location_description TEXT DEFAULT NULL;

ALTER TABLE hangar_listings 
ADD COLUMN IF NOT EXISTS special_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN hangar_listings.cancellation_policy IS 'Options: flexible, moderate, strict';
COMMENT ON COLUMN hangar_listings.hangar_location_description IS 'Detailed location within aerodrome';
COMMENT ON COLUMN hangar_listings.special_notes IS 'Additional notes or special instructions';

-- ============================================================================
-- STEP 5: Create hangar_photos table for multiple images
-- ============================================================================
CREATE TABLE IF NOT EXISTS hangar_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hangar_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  caption TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hangar_photos_hangar_id ON hangar_photos(hangar_id);
CREATE INDEX IF NOT EXISTS idx_hangar_photos_primary ON hangar_photos(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_hangar_photos_order ON hangar_photos(hangar_id, display_order);

COMMENT ON TABLE hangar_photos IS 'Multiple photos per hangar listing (replaces single image_url)';
COMMENT ON COLUMN hangar_photos.is_primary IS 'Primary/cover photo for listing card display';
COMMENT ON COLUMN hangar_photos.display_order IS 'Order for photo gallery display (0-indexed)';

-- ============================================================================
-- STEP 6: Migrate existing single image_url to hangar_photos table
-- ============================================================================
-- Copy existing image_url values to new photos table as primary photo
INSERT INTO hangar_photos (hangar_id, photo_url, is_primary, display_order)
SELECT 
  id as hangar_id,
  image_url as photo_url,
  TRUE as is_primary,
  0 as display_order
FROM hangar_listings
WHERE image_url IS NOT NULL AND image_url != ''
ON CONFLICT DO NOTHING;

-- NOTE: We keep image_url column for backward compatibility during transition
-- It can be dropped in a future migration after full transition

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to verify success)
-- ============================================================================
-- Uncomment to check:
-- SELECT COUNT(*) as new_columns FROM information_schema.columns 
-- WHERE table_name = 'hangar_listings' 
-- AND column_name IN ('hourly_rate', 'available_from', 'cancellation_policy');
-- Expected: 3 rows minimum

-- SELECT COUNT(*) as migrated_photos FROM hangar_photos;
-- Expected: Same as COUNT(*) FROM hangar_listings WHERE image_url IS NOT NULL

-- ============================================================================
-- ROLLBACK PLAN (if needed - NOT RECOMMENDED as no breaking changes)
-- ============================================================================
-- DROP TABLE IF EXISTS hangar_photos;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS hourly_rate;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS available_from;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS available_until;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS accepts_online_payment;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS accepts_payment_on_arrival;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS accepts_payment_on_departure;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS cancellation_policy;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS hangar_location_description;
-- ALTER TABLE hangar_listings DROP COLUMN IF EXISTS special_notes;
