-- Create Aircraft Listings Table
CREATE TABLE IF NOT EXISTS aircraft_listings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  registration VARCHAR(20),
  serial_number VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  total_time INTEGER,
  engine_time INTEGER,
  price DECIMAL(12,2) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_state VARCHAR(2) NOT NULL,
  location_country VARCHAR(2) NOT NULL DEFAULT 'BR',
  description TEXT,
  avionics TEXT,
  interior_condition VARCHAR(20),
  exterior_condition VARCHAR(20),
  logs_status VARCHAR(50),
  damage_history BOOLEAN DEFAULT FALSE,
  financing_available BOOLEAN DEFAULT FALSE,
  partnership_available BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  views INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Parts Listings Table
CREATE TABLE IF NOT EXISTS parts_listings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  part_number VARCHAR(50),
  manufacturer VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  time_since_overhaul INTEGER,
  price DECIMAL(12,2) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_state VARCHAR(2) NOT NULL,
  location_country VARCHAR(2) NOT NULL DEFAULT 'BR',
  description TEXT,
  compatible_aircraft VARCHAR(255),
  has_certification BOOLEAN DEFAULT FALSE,
  has_logbook BOOLEAN DEFAULT FALSE,
  shipping_available BOOLEAN DEFAULT TRUE,
  return_policy VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  views INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Avionics Listings Table
CREATE TABLE IF NOT EXISTS avionics_listings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  avionics_type VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL,
  certified BOOLEAN DEFAULT FALSE,
  price DECIMAL(12,2) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_state VARCHAR(2) NOT NULL,
  location_country VARCHAR(2) NOT NULL DEFAULT 'BR',
  description TEXT,
  compatible_aircraft VARCHAR(255),
  installation_included BOOLEAN DEFAULT FALSE,
  warranty_info VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  views INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aircraft_listings_user_id ON aircraft_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_listings_status ON aircraft_listings(status);
CREATE INDEX IF NOT EXISTS idx_aircraft_listings_category ON aircraft_listings(category);
CREATE INDEX IF NOT EXISTS idx_aircraft_listings_price ON aircraft_listings(price);
CREATE INDEX IF NOT EXISTS idx_aircraft_listings_location ON aircraft_listings(location_state, location_city);

CREATE INDEX IF NOT EXISTS idx_parts_listings_user_id ON parts_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_parts_listings_status ON parts_listings(status);
CREATE INDEX IF NOT EXISTS idx_parts_listings_category ON parts_listings(category);
CREATE INDEX IF NOT EXISTS idx_parts_listings_price ON parts_listings(price);
CREATE INDEX IF NOT EXISTS idx_parts_listings_location ON parts_listings(location_state, location_city);

CREATE INDEX IF NOT EXISTS idx_avionics_listings_user_id ON avionics_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_avionics_listings_status ON avionics_listings(status);
CREATE INDEX IF NOT EXISTS idx_avionics_listings_type ON avionics_listings(avionics_type);
CREATE INDEX IF NOT EXISTS idx_avionics_listings_price ON avionics_listings(price);
CREATE INDEX IF NOT EXISTS idx_avionics_listings_location ON avionics_listings(location_state, location_city);
