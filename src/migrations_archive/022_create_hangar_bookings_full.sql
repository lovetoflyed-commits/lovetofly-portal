CREATE TABLE IF NOT EXISTS hangar_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hangar_id UUID NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    nights INTEGER NOT NULL,
    subtotal NUMERIC(12,2),
    fees NUMERIC(12,2),
    total_price NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20),
    stripe_payment_intent_id VARCHAR(100),
    booking_type VARCHAR(20) DEFAULT 'overnight',
    refund_policy_applied VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hangar_bookings_hangar_id ON hangar_bookings(hangar_id);
CREATE INDEX IF NOT EXISTS idx_hangar_bookings_user_id ON hangar_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_bookings_status ON hangar_bookings(status);
