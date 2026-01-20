-- Create career_profiles table compatible with integer users.id
-- Safe/idempotent for prod and local

CREATE TABLE IF NOT EXISTS career_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  resume_file_url TEXT,
  resume_file_name VARCHAR(255),
  resume_uploaded_at TIMESTAMP,
  professional_summary TEXT,
  career_category VARCHAR(50),
  certifications TEXT,
  pilot_licenses TEXT,
  habilitacoes TEXT,
  medical_class VARCHAR(50),
  medical_expiry DATE,
  total_flight_hours INTEGER,
  pic_hours INTEGER,
  sic_hours INTEGER,
  instruction_hours INTEGER,
  ifr_hours INTEGER,
  night_hours INTEGER,
  work_experience TEXT,
  education TEXT,
  skills TEXT,
  languages TEXT,
  available_for_work BOOLEAN DEFAULT true,
  willing_to_relocate BOOLEAN DEFAULT false,
  preferred_locations TEXT,
  preferred_aircraft_types TEXT,
  preferred_operation_types TEXT,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  linkedin_url TEXT,
  profile_visibility VARCHAR(50) DEFAULT 'private',
  profile_completed_percentage INTEGER DEFAULT 0,
  resume_photo TEXT,
  photo_source VARCHAR(50) DEFAULT 'portal',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_profiles_user_id ON career_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_career_profiles_available ON career_profiles(available_for_work);
CREATE INDEX IF NOT EXISTS idx_career_profiles_visibility ON career_profiles(profile_visibility);
