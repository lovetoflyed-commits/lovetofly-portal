-- Migration: Add hangar-related columns to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hangar_owner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hangar_owner_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hangar_owner_plan VARCHAR(20) DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_hangars INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings_as_owner INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings_as_renter INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hangar_owner_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS renter_rating DECIMAL(3,2) DEFAULT 0;
