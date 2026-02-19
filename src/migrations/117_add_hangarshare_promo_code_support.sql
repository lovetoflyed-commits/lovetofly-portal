-- Add promo code support to hangar_bookings table
-- Migration: 117_add_hangarshare_promo_code_support
-- Date: 2026-02-18
-- Purpose: Add columns to track promo codes and discounts applied to bookings

-- Create coupons table if it doesn't exist
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END$$;

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- Add promo_code column if it doesn't exist
ALTER TABLE hangar_bookings
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Add discount_amount column if it doesn't exist  
ALTER TABLE hangar_bookings
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2);

-- Create index on promo_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_hangar_bookings_promo_code ON hangar_bookings(promo_code);

-- Create coupon_redemptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES hangar_bookings(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure booking_id exists for older schemas that used order_id
ALTER TABLE coupon_redemptions
ADD COLUMN IF NOT EXISTS booking_id INTEGER;

-- Backfill booking_id from legacy order_id when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coupon_redemptions'
      AND column_name = 'order_id'
  ) THEN
    UPDATE coupon_redemptions
    SET booking_id = order_id
    WHERE booking_id IS NULL;
  END IF;
END
$$;

-- Add FK only when table/column exist and constraint is missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coupon_redemptions'
      AND column_name = 'booking_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'coupon_redemptions_booking_id_fkey'
  ) THEN
    ALTER TABLE coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES hangar_bookings(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create index on coupon_redemptions
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_booking_id ON coupon_redemptions(booking_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_redeemed_at ON coupon_redemptions(redeemed_at);

-- Add comment to document the feature
COMMENT ON COLUMN hangar_bookings.promo_code IS 'Promo code applied to the booking for discount';
COMMENT ON COLUMN hangar_bookings.discount_amount IS 'Amount discounted from subtotal using promo code';
COMMENT ON TABLE coupon_redemptions IS 'Track coupon redemptions for audit and usage tracking';
