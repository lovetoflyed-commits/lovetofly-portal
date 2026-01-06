-- [REMOVIDO] CREATE TABLE bookings substituída por hangar_bookings
-- CREATE TABLE IF NOT EXISTS bookings (
-- 	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- 	listing_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
-- 	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- 	checkin TIMESTAMP NOT NULL,
-- 	checkout TIMESTAMP NOT NULL,
-- 	subtotal NUMERIC(12,2),
-- 	fees NUMERIC(12,2),
-- 	total NUMERIC(12,2),
-- 	payment_method VARCHAR(20),
-- 	payment_status VARCHAR(20),
-- 	booking_status VARCHAR(20) DEFAULT 'pending',
-- 	special_requests TEXT,
-- 	created_at TIMESTAMP DEFAULT NOW(),
-- 	updated_at TIMESTAMP DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
-- CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
-- CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

CREATE TABLE IF NOT EXISTS bookings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	listing_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
