-- Migration: Add HangarShare columns to hangar_listings
-- Description: Add missing columns for complete HangarShare functionality

ALTER TABLE hangar_listings 
  ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES hangar_owners(id),
  ADD COLUMN IF NOT EXISTS airport_icao VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hangar_size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS dimensions_length DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS dimensions_width DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS dimensions_height DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS door_dimensions TEXT,
  ADD COLUMN IF NOT EXISTS floor_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lighting VARCHAR(100),
  ADD COLUMN IF NOT EXISTS climate_control BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_features TEXT,
  ADD COLUMN IF NOT EXISTS electricity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS water_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fuel_nearby BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_facilities BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS minimum_rental_period VARCHAR(50),
  ADD COLUMN IF NOT EXISTS maximum_aircraft_weight DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS insurance_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS special_instructions TEXT,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_owner ON hangar_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_icao ON hangar_listings(airport_icao);
CREATE INDEX IF NOT EXISTS idx_listings_status ON hangar_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_availability ON hangar_listings(availability_status);

-- Add foreign key to airport_icao table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'airport_icao') THEN
    ALTER TABLE hangar_listings 
      ADD CONSTRAINT fk_listings_airport 
      FOREIGN KEY (airport_icao) REFERENCES airport_icao(icao_code);
  END IF;
END $$;

COMMENT ON COLUMN hangar_listings.approval_status IS 'pending_approval, approved, rejected';
COMMENT ON COLUMN hangar_listings.availability_status IS 'available, rented, maintenance';
