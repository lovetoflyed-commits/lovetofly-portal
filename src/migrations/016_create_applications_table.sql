-- Migration: Create applications table
-- Description: Job applications submitted by candidates

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Application data
  status VARCHAR(50) DEFAULT 'applied',
  cover_letter TEXT,
  video_intro_url TEXT,
  expected_start_date DATE,
  salary_expectations_min INTEGER,
  salary_expectations_max INTEGER,
  relocation_willing BOOLEAN DEFAULT false,
  
  -- Screening & pipeline
  screening_notes TEXT,
  interview_scheduled_at TIMESTAMP,
  interview_completed_at TIMESTAMP,
  simulator_check_scheduled_at TIMESTAMP,
  simulator_check_completed_at TIMESTAMP,
  offer_extended_at TIMESTAMP,
  offer_accepted_at TIMESTAMP,
  
  -- Feedback & scoring
  recruiter_score DECIMAL(3,2),
  chief_pilot_score DECIMAL(3,2),
  culture_fit_score DECIMAL(3,2),
  
  -- Reason if rejected/withdrawn
  rejection_reason VARCHAR(255),
  rejection_details TEXT,
  withdrawn_reason VARCHAR(255),
  
  -- Metadata
  credential_match_percentage INTEGER,
  is_flagged BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_job_candidate ON applications(job_id, candidate_id);

-- Unique constraint: One application per candidate per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_job_candidate ON applications(job_id, candidate_id);

COMMENT ON TABLE applications IS 'Job applications submitted by candidates';
COMMENT ON COLUMN applications.status IS 'applied, screening, interview, simulator, offer, hired, rejected, withdrawn, archived';
