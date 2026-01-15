-- Migration: Create reviews table
-- Description: Employee/pilot reviews of companies

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rating breakdown
  overall_rating INTEGER NOT NULL,
  work_life_balance_rating INTEGER,
  training_quality_rating INTEGER,
  safety_culture_rating INTEGER,
  pay_competitiveness_rating INTEGER,
  management_rating INTEGER,
  growth_opportunity_rating INTEGER,
  
  -- Review content
  title VARCHAR(255),
  review_text TEXT,
  
  -- Context
  job_title VARCHAR(255),
  tenure_months INTEGER,
  year_hired INTEGER,
  is_current_employee BOOLEAN DEFAULT false,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  moderation_status VARCHAR(50) DEFAULT 'pending',
  moderation_notes TEXT,
  
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

COMMENT ON TABLE reviews IS 'Employee/pilot reviews of companies';
COMMENT ON COLUMN reviews.moderation_status IS 'pending, approved, rejected, hidden';
