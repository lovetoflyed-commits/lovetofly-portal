-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- Create hangar_favorites table
CREATE TABLE IF NOT EXISTS hangar_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_hangar_favorites_user_id ON hangar_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_favorites_listing_id ON hangar_favorites(listing_id);

-- Create hangar_reviews table
CREATE TABLE IF NOT EXISTS hangar_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  accuracy INTEGER CHECK (accuracy >= 1 AND accuracy <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  location INTEGER CHECK (location >= 1 AND location <= 5),
  value INTEGER CHECK (value >= 1 AND value <= 5),
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hangar_reviews_listing_id ON hangar_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_user_id ON hangar_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_created_at ON hangar_reviews(created_at DESC);
