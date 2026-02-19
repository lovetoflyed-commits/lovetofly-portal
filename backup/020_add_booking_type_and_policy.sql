-- [REMOVIDO] ALTER TABLE bookings substituído por hangar_bookings
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'overnight';
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(20);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'overnight';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(20);
