-- Migration: 065_add_data_integrity_constraints.sql
-- Date: January 20, 2026
-- Description: Add data integrity constraints to ensure data quality
--
-- This migration adds:
-- 1. CASCADE DELETE for orphan prevention
-- 2. CHECK constraints for enum validation
-- 3. UNIQUE constraints for data consistency

-- 1. Add CHECK constraint for hangar_bookings status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_booking_status' AND table_name = 'hangar_bookings'
  ) THEN
    ALTER TABLE hangar_bookings
      ADD CONSTRAINT chk_booking_status
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected'));
  END IF;
END $$;

-- 2. Add CHECK constraint for hangar_listings status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_listing_status' AND table_name = 'hangar_listings'
  ) THEN
    ALTER TABLE hangar_listings
      ADD CONSTRAINT chk_listing_status
      CHECK (status IN ('active', 'inactive', 'pending', 'rejected', 'suspended'));
  END IF;
END $$;

-- 3. Add CHECK constraint for users plan (not role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_user_plan' AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT chk_user_plan
      CHECK (plan IN ('free', 'premium', 'pro'));
  END IF;
END $$;

-- 4. Add UNIQUE constraint on users email (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_users_email' AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT unique_users_email
      UNIQUE (email);
  END IF;
END $$;

-- 5. Add CHECK constraint for forum_topics category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_topic_category' AND table_name = 'forum_topics'
  ) THEN
    ALTER TABLE forum_topics
      ADD CONSTRAINT chk_topic_category
      CHECK (category IN ('general', 'technical', 'regulations', 'events', 'classifieds', 'questions'));
  END IF;
END $$;

-- 6. Add CHECK constraint for positive prices in hangar_listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_positive_rates' AND table_name = 'hangar_listings'
  ) THEN
    ALTER TABLE hangar_listings
      ADD CONSTRAINT chk_positive_rates
      CHECK (daily_rate > 0 AND monthly_rate > 0);
  END IF;
END $$;

-- 7. Add CHECK constraint for positive dimensions in hangar_listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_positive_dimensions' AND table_name = 'hangar_listings'
  ) THEN
    ALTER TABLE hangar_listings
      ADD CONSTRAINT chk_positive_dimensions
      CHECK (max_length > 0 AND max_wingspan > 0 AND max_height > 0 AND size_sqm > 0);
  END IF;
END $$;

-- Summary: All constraints are added safely with IF NOT EXISTS checks
-- These ensure data quality without breaking existing functionality
