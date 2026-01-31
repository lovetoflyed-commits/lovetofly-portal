-- Migration: 087_create_portal_analytics.sql
-- Date: 2026-01-28
-- Description: Portal analytics tracking table

CREATE TABLE IF NOT EXISTS portal_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page VARCHAR(500),
  visit_count INTEGER DEFAULT 1,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_analytics_date_page
  ON portal_analytics(date, page);

CREATE INDEX IF NOT EXISTS idx_portal_analytics_date
  ON portal_analytics(date);
