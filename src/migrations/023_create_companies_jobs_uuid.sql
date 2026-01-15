-- Migration: Create companies/jobs/applications/reviews with UUID-compatible FKs
-- Description: Uses serial PKs for companies/jobs but UUID user_id links to users (uuid PK)

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  headquarters_city VARCHAR(100),
  headquarters_country VARCHAR(100),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  description TEXT,
  culture_statement TEXT,
  annual_hiring_volume INTEGER,
  hiring_status VARCHAR(50) DEFAULT 'active',
  faa_certificate_number VARCHAR(50),
  insurance_verified BOOLEAN DEFAULT false,
  safety_record_public BOOLEAN DEFAULT false,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  pay_currency VARCHAR(3) DEFAULT 'BRL',
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_hiring_status ON companies(hiring_status);
CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);

COMMENT ON COLUMN companies.pay_currency IS 'ISO 4217 currency for payroll / default BRL for Brazil';

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
  salary_currency VARCHAR(3) DEFAULT 'BRL',
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
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closes_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs(seniority_level);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(base_location);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied',
  cover_letter TEXT,
  video_intro_url TEXT,
  expected_start_date DATE,
  salary_expectations_min INTEGER,
  salary_expectations_max INTEGER,
  relocation_willing BOOLEAN DEFAULT false,
  screening_notes TEXT,
  interview_scheduled_at TIMESTAMP,
  interview_completed_at TIMESTAMP,
  simulator_check_scheduled_at TIMESTAMP,
  simulator_check_completed_at TIMESTAMP,
  offer_extended_at TIMESTAMP,
  offer_accepted_at TIMESTAMP,
  recruiter_score INTEGER,
  chief_pilot_score INTEGER,
  culture_fit_score INTEGER,
  rejection_reason TEXT,
  rejection_details TEXT,
  withdrawn_reason TEXT,
  credential_match_percentage INTEGER,
  is_flagged BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL,
  work_life_balance_rating INTEGER,
  training_quality_rating INTEGER,
  safety_culture_rating INTEGER,
  pay_competitiveness_rating INTEGER,
  management_rating INTEGER,
  growth_opportunity_rating INTEGER,
  title VARCHAR(255),
  review_text TEXT,
  job_title VARCHAR(255),
  tenure_months INTEGER,
  year_hired INTEGER,
  is_current_employee BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  moderation_status VARCHAR(50) DEFAULT 'pending',
  moderation_notes TEXT,
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(is_published);
