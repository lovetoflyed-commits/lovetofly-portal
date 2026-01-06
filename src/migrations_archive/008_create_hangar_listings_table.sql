
CREATE TABLE IF NOT EXISTS hangar_listings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	owner_id UUID NOT NULL REFERENCES hangar_owners(id) ON DELETE CASCADE,
	icao_code VARCHAR(4) NOT NULL,
	aerodrome_name VARCHAR(255) NOT NULL,
	city VARCHAR(100) NOT NULL,
	state VARCHAR(2) NOT NULL,
	country VARCHAR(100) NOT NULL,
	hangar_number VARCHAR(20) NOT NULL,
	size_sqm INTEGER NOT NULL,
	max_wingspan NUMERIC(6,2),
	max_length NUMERIC(6,2),
	max_height NUMERIC(6,2),
	daily_rate NUMERIC(12,2),
	weekly_rate NUMERIC(12,2),
	monthly_rate NUMERIC(12,2),
	description TEXT,
	is_available BOOLEAN DEFAULT TRUE,
	status VARCHAR(20) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hangar_icao ON hangar_listings(icao_code);
CREATE INDEX IF NOT EXISTS idx_hangar_location ON hangar_listings(city, state);
CREATE INDEX IF NOT EXISTS idx_hangar_status ON hangar_listings(status, is_available);
