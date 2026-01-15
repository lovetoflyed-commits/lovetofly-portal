-- Migration: Add paid flags to hangar_listings for financial linkage

ALTER TABLE hangar_listings 
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS paid_currency VARCHAR(10) DEFAULT 'BRL';

CREATE INDEX IF NOT EXISTS idx_listings_paid ON hangar_listings(is_paid, approval_status, availability_status);
