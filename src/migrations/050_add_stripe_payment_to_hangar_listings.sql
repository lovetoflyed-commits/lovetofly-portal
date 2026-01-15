-- Migration: Add Stripe payment tracking to hangar_listings

ALTER TABLE hangar_listings 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid'; -- unpaid, pending, completed, failed

CREATE INDEX IF NOT EXISTS idx_listings_payment_status ON hangar_listings(payment_status);
CREATE INDEX IF NOT EXISTS idx_listings_stripe_intent ON hangar_listings(stripe_payment_intent_id);
