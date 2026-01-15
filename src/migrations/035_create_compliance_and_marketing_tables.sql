-- Compliance records table
CREATE TABLE IF NOT EXISTS compliance_records (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_records(type);

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketing_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_start_date ON marketing_campaigns(start_date);
