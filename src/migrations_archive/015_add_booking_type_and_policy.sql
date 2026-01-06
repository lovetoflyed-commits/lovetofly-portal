-- Migration: Add booking type and refund policy columns
-- Purpose: support refundable vs non-refundable bookings and store applied policy at booking time

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'refundable',
  ADD COLUMN IF NOT EXISTS refund_policy_applied VARCHAR(100) DEFAULT 'moderate_v1';

-- Index to filter by booking type
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
