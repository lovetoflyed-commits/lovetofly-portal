-- Migration: Track pending membership upgrades
-- Purpose: Log checkout sessions and track upgrade completion

CREATE TABLE IF NOT EXISTS pending_membership_upgrades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_plan_code VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    checkout_session_id VARCHAR(255),
    checkout_url TEXT NOT NULL,
    promo_code_id INTEGER REFERENCES codes(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_membership_upgrades_user_id ON pending_membership_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_membership_upgrades_status ON pending_membership_upgrades(status);
CREATE INDEX IF NOT EXISTS idx_pending_membership_upgrades_checkout_session ON pending_membership_upgrades(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_membership_upgrades_started_at ON pending_membership_upgrades(started_at);
