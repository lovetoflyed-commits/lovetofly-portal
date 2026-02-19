-- Migration: Add PIX support to pending membership upgrades
-- Purpose: Support PIX payment tracking for membership upgrades

ALTER TABLE pending_membership_upgrades 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'pix')),
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
