-- Migration: Extend users table with aviation career fields
-- Description: Add pilot ratings, hours, medical cert, and employment history fields

ALTER TABLE users
ADD COLUMN IF NOT EXISTS pilot_ratings VARCHAR(500),
ADD COLUMN IF NOT EXISTS total_flight_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pic_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multi_engine_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instrument_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS helicopter_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medical_certificate_class VARCHAR(50),
ADD COLUMN IF NOT EXISTS medical_certificate_expiry DATE,
ADD COLUMN IF NOT EXISTS incident_accident_history TEXT,
ADD COLUMN IF NOT EXISTS aviation_languages VARCHAR(255),
ADD COLUMN IF NOT EXISTS icao_language_level VARCHAR(10),
ADD COLUMN IF NOT EXISTS specialized_experience VARCHAR(500),
ADD COLUMN IF NOT EXISTS employment_history JSONB,
ADD COLUMN IF NOT EXISTS current_employer VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_position VARCHAR(255),
ADD COLUMN IF NOT EXISTS career_goal VARCHAR(255),
ADD COLUMN IF NOT EXISTS seniority_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_aircraft_types VARCHAR(255),
ADD COLUMN IF NOT EXISTS geographic_preference VARCHAR(255),
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visa_status VARCHAR(100),
ADD COLUMN IF NOT EXISTS visa_sponsorship_needed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compensation_expectations_min INTEGER,
ADD COLUMN IF NOT EXISTS compensation_expectations_max INTEGER,
ADD COLUMN IF NOT EXISTS profile_completeness_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_available_for_hire BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS availability_date DATE,
ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for aviation profile searches
CREATE INDEX IF NOT EXISTS idx_users_pilot_ratings ON users(pilot_ratings);
CREATE INDEX IF NOT EXISTS idx_users_flight_hours ON users(total_flight_hours);
CREATE INDEX IF NOT EXISTS idx_users_medical_expiry ON users(medical_certificate_expiry);
CREATE INDEX IF NOT EXISTS idx_users_current_employer ON users(current_employer);
CREATE INDEX IF NOT EXISTS idx_users_available_for_hire ON users(is_available_for_hire);
CREATE INDEX IF NOT EXISTS idx_users_profile_completeness ON users(profile_completeness_score);

COMMENT ON COLUMN users.pilot_ratings IS 'Comma-separated: CPL, ATPL, MEL, IR, etc.';
COMMENT ON COLUMN users.employment_history IS 'JSON array of {employer, position, start_date, end_date, type}';
COMMENT ON COLUMN users.visa_status IS 'authorized, visa-required, sponsorship-needed';
