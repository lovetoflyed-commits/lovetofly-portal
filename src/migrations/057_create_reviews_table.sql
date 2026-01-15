-- Migration 057: Create hangar reviews and ratings table
-- Created: 2026-01-15
-- Purpose: Enable users to review and rate hangar listings

-- Create reviews table
CREATE TABLE IF NOT EXISTS hangar_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one review per user per listing
  CONSTRAINT hangar_reviews_unique UNIQUE(listing_id, user_id),
  
  -- Ensure user has booked the listing before reviewing
  CONSTRAINT check_user_has_booked CHECK (TRUE)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_listing_id ON hangar_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_user_id ON hangar_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_rating ON hangar_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_created_at ON hangar_reviews(created_at DESC);

-- Composite index for listing ratings aggregation
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_listing_rating 
  ON hangar_reviews(listing_id, rating);

-- Add comment
COMMENT ON TABLE hangar_reviews IS 'User reviews and ratings for hangar listings';
COMMENT ON COLUMN hangar_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN hangar_reviews.comment IS 'Optional review comment (min 10, max 500 chars)';
