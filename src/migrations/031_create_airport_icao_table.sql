
CREATE TABLE IF NOT EXISTS airport_icao (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	icao_code VARCHAR(4) NOT NULL UNIQUE,
	airport_name VARCHAR(255) NOT NULL,
	city VARCHAR(100) NOT NULL,
	state VARCHAR(2) NOT NULL,
	country VARCHAR(100) NOT NULL,
	has_facilities BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_airport_icao_code ON airport_icao(icao_code);
CREATE INDEX IF NOT EXISTS idx_airport_city_state ON airport_icao(city, state);
