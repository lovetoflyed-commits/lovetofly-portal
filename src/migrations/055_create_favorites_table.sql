-- Migration 055: Create favorites/wishlist table
-- Created: 2026-01-15
-- Purpose: Allow users to save favorite hangar listings

-- Create favorites table
CREATE TABLE IF NOT EXISTS hangar_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_favorites_listing
    FOREIGN KEY (listing_id) 
    REFERENCES hangar_listings(id) 
    ON DELETE CASCADE,
  
  -- Prevent duplicate favorites (user can only favorite a listing once)
  CONSTRAINT unique_user_listing_favorite
    UNIQUE (user_id, listing_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hangar_favorites_user_id 
  ON hangar_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_hangar_favorites_listing_id 
  ON hangar_favorites(listing_id);

CREATE INDEX IF NOT EXISTS idx_hangar_favorites_created_at 
  ON hangar_favorites(created_at DESC);

-- Add comment
COMMENT ON TABLE hangar_favorites IS 'Stores user favorite/wishlist hangar listings';
COMMENT ON COLUMN hangar_favorites.user_id IS 'User who favorited the listing';
COMMENT ON COLUMN hangar_favorites.listing_id IS 'Hangar listing that was favorited';
COMMENT ON COLUMN hangar_favorites.created_at IS 'When the listing was added to favorites';
