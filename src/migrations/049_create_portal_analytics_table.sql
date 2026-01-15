-- Migration: Create portal_analytics table for traffic tracking
-- Description: Tracks page visits, referrers, and user agents for admin analytics
-- Date: 2026-01-13

CREATE TABLE IF NOT EXISTS portal_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page VARCHAR(500),
  visit_count INTEGER DEFAULT 1,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, page)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_analytics_date ON portal_analytics(date);
CREATE INDEX IF NOT EXISTS idx_portal_analytics_page ON portal_analytics(page);
CREATE INDEX IF NOT EXISTS idx_portal_analytics_date_page ON portal_analytics(date, page);

-- Comments
COMMENT ON TABLE portal_analytics IS 'Portal traffic tracking for admin dashboard analytics';
COMMENT ON COLUMN portal_analytics.date IS 'Date of visits (daily aggregation)';
COMMENT ON COLUMN portal_analytics.page IS 'Page path visited';
COMMENT ON COLUMN portal_analytics.visit_count IS 'Number of visits on this date for this page';
COMMENT ON COLUMN portal_analytics.referrer IS 'Referrer URL (last recorded)';
COMMENT ON COLUMN portal_analytics.user_agent IS 'User agent string (last recorded)';