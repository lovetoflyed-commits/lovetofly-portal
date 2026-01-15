-- Migration 056: Add indexes for advanced search filters
-- Created: 2026-01-15
-- Purpose: Optimize search performance for advanced filters

-- Indexes for price filtering
CREATE INDEX IF NOT EXISTS idx_hangar_listings_monthly_rate 
  ON hangar_listings(monthly_rate) 
  WHERE status = 'active' AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_hangar_listings_daily_rate 
  ON hangar_listings(daily_rate) 
  WHERE status = 'active' AND is_available = true;

-- Indexes for size filtering
CREATE INDEX IF NOT EXISTS idx_hangar_listings_size_sqm 
  ON hangar_listings(size_sqm) 
  WHERE status = 'active' AND is_available = true;

-- Indexes for dimension filtering
CREATE INDEX IF NOT EXISTS idx_hangar_listings_wingspan 
  ON hangar_listings(max_wingspan) 
  WHERE status = 'active' AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_hangar_listings_length 
  ON hangar_listings(max_length) 
  WHERE status = 'active' AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_hangar_listings_height 
  ON hangar_listings(max_height) 
  WHERE status = 'active' AND is_available = true;

-- Note: Amenity columns (has_electricity, has_water, has_bathroom) don't exist in schema
-- Will need to be added in future migration or use services array for filtering

CREATE INDEX IF NOT EXISTS idx_hangar_listings_online_payment 
  ON hangar_listings(accepts_online_payment) 
  WHERE status = 'active' AND is_available = true AND accepts_online_payment = true;

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_hangar_listings_location_price 
  ON hangar_listings(icao_code, city, monthly_rate) 
  WHERE status = 'active' AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_hangar_listings_location_size 
  ON hangar_listings(icao_code, city, size_sqm) 
  WHERE status = 'active' AND is_available = true;

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_hangar_listings_created_at 
  ON hangar_listings(created_at DESC) 
  WHERE status = 'active' AND is_available = true;

-- Comments
COMMENT ON INDEX idx_hangar_listings_monthly_rate IS 'Optimizes price range queries';
COMMENT ON INDEX idx_hangar_listings_size_sqm IS 'Optimizes size range queries';
COMMENT ON INDEX idx_hangar_listings_location_price IS 'Optimizes combined location + price queries';
COMMENT ON INDEX idx_hangar_listings_location_size IS 'Optimizes combined location + size queries';
