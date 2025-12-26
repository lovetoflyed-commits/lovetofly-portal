-- Migration: Create hangar_listings table
-- Description: Store hangar rental listings with all required details

CREATE TABLE IF NOT EXISTS hangar_listings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Aerodrome Information
  icao_code VARCHAR(4) NOT NULL,
  aerodrome_name VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Brasil',
  
  -- Hangar Details
  hangar_number VARCHAR(50),
  hangar_location_description TEXT,
  hangar_size_sqm DECIMAL(10,2),
  max_wingspan_meters DECIMAL(6,2),
  max_length_meters DECIMAL(6,2),
  max_height_meters DECIMAL(6,2),
  
  -- Aircraft Categories (JSON array)
  accepted_aircraft_categories JSONB DEFAULT '[]',
  
  -- Pricing
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  
  -- Availability
  available_from DATE,
  available_until DATE,
  is_available BOOLEAN DEFAULT true,
  
  -- Operating Hours (JSON: {monday: {open: "08:00", close: "18:00"}, ...})
  operating_hours JSONB,
  
  -- Services & Amenities (JSON array)
  services JSONB DEFAULT '[]',
  
  -- Additional Information
  description TEXT,
  special_notes TEXT,
  
  -- Payment Options
  accepts_online_payment BOOLEAN DEFAULT false,
  accepts_payment_on_arrival BOOLEAN DEFAULT true,
  accepts_payment_on_departure BOOLEAN DEFAULT false,
  cancellation_policy VARCHAR(50) DEFAULT 'flexible',
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  
  -- Media
  photos JSONB DEFAULT '[]',
  
  -- Metadata
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hangar_icao ON hangar_listings(icao_code);
CREATE INDEX idx_hangar_owner ON hangar_listings(owner_id);
CREATE INDEX idx_hangar_status ON hangar_listings(status, is_available);
CREATE INDEX idx_hangar_location ON hangar_listings(city, state, country);
