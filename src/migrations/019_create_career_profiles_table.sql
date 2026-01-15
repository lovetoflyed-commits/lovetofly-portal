-- Migration: Create career_profiles table
-- Description: Professional resume/CV data for career marketplace

CREATE TABLE IF NOT EXISTS career_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Resume file
  resume_file_url TEXT,
  resume_file_name VARCHAR(255),
  resume_uploaded_at TIMESTAMP,
  
  -- Professional summary
  professional_summary TEXT,
  career_category VARCHAR(50), -- pilot, mechanic, engineer, dispatcher, management, etc.
  
  -- Certifications & Licenses (RBAC61)
  certifications TEXT, -- JSON array - general certifications for all roles
  pilot_licenses TEXT, -- JSON array - Classes: PCA, PCH, PLA, INVA (not PP - cannot be remunerated)
  habilitacoes TEXT, -- JSON array - RBAC61 ratings: IFR, MNTE, MLTE, AGRA, REB, CAT, AND, HID, ACA, ALA, etc.
  medical_class VARCHAR(50),
  medical_expiry DATE,
  
  -- Flight hours (RBAC61 based)
  total_flight_hours INTEGER,
  pic_hours INTEGER, -- Piloto em Comando
  sic_hours INTEGER, -- Segundo em Comando
  instruction_hours INTEGER,
  ifr_hours INTEGER,
  night_hours INTEGER,
  
  -- Work experience (JSON array of positions)
  work_experience TEXT,
  
  -- Education (JSON array)
  education TEXT,
  
  -- Skills & languages
  skills TEXT, -- JSON array
  languages TEXT, -- JSON array with proficiency levels
  
  -- Availability
  available_for_work BOOLEAN DEFAULT true,
  willing_to_relocate BOOLEAN DEFAULT false,
  preferred_locations TEXT, -- JSON array
  preferred_aircraft_types TEXT, -- JSON array
  preferred_operation_types TEXT, -- JSON array
  
  -- Contact preferences
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  linkedin_url TEXT,
  
  -- Visibility
  profile_visibility VARCHAR(50) DEFAULT 'private', -- private, public, employers-only
  
  -- Metadata
  profile_completed_percentage INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_profiles_user_id ON career_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_career_profiles_available ON career_profiles(available_for_work);
CREATE INDEX IF NOT EXISTS idx_career_profiles_visibility ON career_profiles(profile_visibility);

COMMENT ON TABLE career_profiles IS 'Professional profiles/resumes for career marketplace';
COMMENT ON COLUMN career_profiles.profile_visibility IS 'private, public, employers-only';

