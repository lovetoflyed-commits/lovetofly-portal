-- Migration: Ensure jobs table exists for career listings
-- Date: 2026-01-28

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  seniority_level VARCHAR(50),
  base_location VARCHAR(255),
  operating_countries TEXT,
  relocation_assistance BOOLEAN DEFAULT false,
  relocation_amount_usd INTEGER,
  required_certifications TEXT,
  minimum_flight_hours INTEGER,
  minimum_pic_hours INTEGER,
  minimum_experience_description TEXT,
  medical_class_required VARCHAR(50),
  visa_sponsorship_available BOOLEAN DEFAULT false,
  type_ratings_required TEXT,
  languages_required TEXT,
  type_rating_training_provided BOOLEAN DEFAULT false,
  training_duration_weeks INTEGER,
  training_cost_usd INTEGER,
  aircraft_types TEXT,
  operation_type VARCHAR(100),
  domestic_international VARCHAR(50),
  etops_required BOOLEAN DEFAULT false,
  rvsm_required BOOLEAN DEFAULT false,
  salary_min_usd INTEGER,
  salary_max_usd INTEGER,
  benefits_description TEXT,
  signing_bonus_usd INTEGER,
  seniority_pay_scale TEXT,
  trip_length_avg_days INTEGER,
  reserve_percentage INTEGER,
  schedule_type VARCHAR(100),
  culture_description TEXT,
  application_method VARCHAR(50),
  expected_review_timeline VARCHAR(100),
  contact_email VARCHAR(255),
  contact_recruiter_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closes_at TIMESTAMP,
  filled_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs(seniority_level);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(base_location);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));

COMMENT ON TABLE jobs IS 'Job listings for career marketplace';
COMMENT ON COLUMN jobs.status IS 'open, closed, filled, on-hold, archived';
COMMENT ON COLUMN jobs.operation_type IS 'airline, corporate, charter, freight, training, military, maintenance, other';
