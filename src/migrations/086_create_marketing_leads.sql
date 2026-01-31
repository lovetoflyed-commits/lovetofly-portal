-- Migration: 086_create_marketing_leads.sql
-- Date: 2026-01-28
-- Description: Marketing leads capture and tracking

CREATE TABLE IF NOT EXISTS marketing_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  source VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON marketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_campaign ON marketing_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(email);
