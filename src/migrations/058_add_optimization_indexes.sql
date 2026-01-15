-- Migration 058: Add optimization indexes for search performance
-- Adds indexes for sorting and price range queries

-- Index for sorting listings by creation date (most common sort)
CREATE INDEX IF NOT EXISTS idx_hangar_listings_created_at_desc 
  ON hangar_listings(created_at DESC) 
  WHERE status = 'active' AND is_available = true;

-- Index for price range filtering (both daily and monthly rates)
CREATE INDEX IF NOT EXISTS idx_hangar_listings_monthly_rate 
  ON hangar_listings(monthly_rate) 
  WHERE status = 'active' AND is_available = true;

CREATE INDEX IF NOT EXISTS idx_hangar_listings_daily_rate 
  ON hangar_listings(daily_rate) 
  WHERE status = 'active' AND is_available = true;

-- Composite index for common filter combinations (price + size)
CREATE INDEX IF NOT EXISTS idx_hangar_listings_price_size 
  ON hangar_listings(monthly_rate, hangar_size_sqm) 
  WHERE status = 'active' AND is_available = true;

-- Index for dimension-based filtering (wingspan, length, height)
CREATE INDEX IF NOT EXISTS idx_hangar_listings_dimensions 
  ON hangar_listings(max_wingspan_meters, max_length_meters, max_height_meters) 
  WHERE status = 'active' AND is_available = true;

-- Drop redundant indexes (keep only one of each pair)
DROP INDEX IF EXISTS idx_listings_icao; -- Keep idx_hangar_icao
DROP INDEX IF EXISTS idx_listings_owner; -- Keep idx_hangar_owner
