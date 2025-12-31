-- Migration: Add refund fields to bookings table
-- Description: Add refund_amount, refund_id, and refund_status columns for cancellation & refund system

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT 'none'; -- none, pending, completed, failed

-- Create index for refund queries
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON bookings(refund_status);
