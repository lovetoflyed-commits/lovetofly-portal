-- Migration: Create hangar_bookings table
-- Description: Store hangar rental bookings/reservations

CREATE TABLE IF NOT EXISTS hangar_bookings (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Aircraft Information
  aircraft_registration VARCHAR(20) NOT NULL,
  aircraft_type VARCHAR(100) NOT NULL,
  aircraft_category VARCHAR(50),
  aircraft_wingspan_meters DECIMAL(6,2),
  aircraft_length_meters DECIMAL(6,2),
  pilot_in_command_name VARCHAR(200) NOT NULL,
  pilot_license_number VARCHAR(50),
  pilot_phone VARCHAR(20),
  
  -- Booking Details
  check_in_date DATE NOT NULL,
  check_in_time TIME,
  check_out_date DATE NOT NULL,
  check_out_time TIME,
  total_days INTEGER NOT NULL,
  
  -- Pricing
  rate_per_period DECIMAL(10,2) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  payment_processing_fee DECIMAL(10,2) DEFAULT 0,
  owner_payout DECIMAL(10,2) NOT NULL,
  
  -- Payment Information
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_intent_id VARCHAR(100),
  paid_at TIMESTAMP,
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_date DATE,
  
  -- Booking Status
  booking_status VARCHAR(20) DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  cancelled_by INTEGER REFERENCES users(id),
  
  -- Special Requests
  special_requests TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_listing ON hangar_bookings(listing_id);
CREATE INDEX idx_booking_renter ON hangar_bookings(renter_id);
CREATE INDEX idx_booking_status ON hangar_bookings(booking_status);
CREATE INDEX idx_booking_dates ON hangar_bookings(check_in_date, check_out_date);
CREATE INDEX idx_booking_payment ON hangar_bookings(payment_status);
