-- Migration: 082_create_classifieds_transactions.sql
-- Date: 2026-01-28
-- Description: Add escrow/payment tracking for classifieds

CREATE TABLE IF NOT EXISTS classifieds_transactions (
  id SERIAL PRIMARY KEY,
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('aircraft', 'parts', 'avionics')),
  listing_id INTEGER NOT NULL,
  buyer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  platform_fee_cents INTEGER DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'requires_payment',
  escrow_status VARCHAR(30) NOT NULL DEFAULT 'holding',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classifieds_tx_listing ON classifieds_transactions(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_tx_buyer ON classifieds_transactions(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_tx_seller ON classifieds_transactions(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_tx_status ON classifieds_transactions(status);
CREATE INDEX IF NOT EXISTS idx_classifieds_tx_payment_intent ON classifieds_transactions(stripe_payment_intent_id);
