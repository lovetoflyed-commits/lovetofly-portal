
CREATE TABLE IF NOT EXISTS hangar_bookings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	aircraft_registration VARCHAR(20),
	aircraft_type VARCHAR(50),
	wingspan NUMERIC(6,2),
	length NUMERIC(6,2),
	height NUMERIC(6,2),
	pilot_name VARCHAR(100),
	pilot_license VARCHAR(50),
	pilot_phone VARCHAR(20),
	checkin TIMESTAMP NOT NULL,
	checkout TIMESTAMP NOT NULL,
	subtotal NUMERIC(12,2),
	fees NUMERIC(12,2),
	total NUMERIC(12,2),
	payment_method VARCHAR(20),
	payment_status VARCHAR(20),
	booking_status VARCHAR(20) DEFAULT 'pending',
	special_requests TEXT,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_booking_listing_id ON hangar_bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON hangar_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON hangar_bookings(booking_status);
