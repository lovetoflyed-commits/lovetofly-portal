-- Migration: 083_create_hangar_reviews.sql
-- Date: 2026-01-28
-- Description: Add verified reviews + rating aggregation for HangarShare

CREATE TABLE IF NOT EXISTS hangar_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  reviewer_user_id INTEGER,
  owner_user_id INTEGER,
  booking_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hangar_reviews
  ADD COLUMN IF NOT EXISTS reviewer_user_id INTEGER,
  ADD COLUMN IF NOT EXISTS owner_user_id INTEGER,
  ADD COLUMN IF NOT EXISTS booking_id INTEGER,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;

-- Backfill reviewer_user_id when legacy user_id column exists
UPDATE hangar_reviews
SET reviewer_user_id = COALESCE(reviewer_user_id, user_id)
WHERE reviewer_user_id IS NULL;

UPDATE hangar_reviews hr
SET owner_user_id = COALESCE(hr.owner_user_id, hl.owner_id)
FROM hangar_listings hl
WHERE hr.listing_id = hl.id AND hr.owner_user_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hangar_reviews_listing_id_fkey') THEN
    ALTER TABLE hangar_reviews
      ADD CONSTRAINT hangar_reviews_listing_id_fkey
      FOREIGN KEY (listing_id) REFERENCES hangar_listings(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hangar_reviews_reviewer_user_id_fkey') THEN
    ALTER TABLE hangar_reviews
      ADD CONSTRAINT hangar_reviews_reviewer_user_id_fkey
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hangar_reviews_owner_user_id_fkey') THEN
    ALTER TABLE hangar_reviews
      ADD CONSTRAINT hangar_reviews_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hangar_reviews_booking_id_fkey') THEN
    ALTER TABLE hangar_reviews
      ADD CONSTRAINT hangar_reviews_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES hangar_bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hangar_reviews_listing_reviewer_unique'
  ) THEN
    ALTER TABLE hangar_reviews
      ADD CONSTRAINT hangar_reviews_listing_reviewer_unique
      UNIQUE (listing_id, reviewer_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hangar_reviews_listing_id ON hangar_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_owner_id ON hangar_reviews(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_reviews_rating ON hangar_reviews(rating);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hangar_owner_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hangar_owner_reviews_count INTEGER DEFAULT 0;
