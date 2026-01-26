-- 079_add_traslados_fee_breakdown.sql

ALTER TABLE traslados_service_fees
  ADD COLUMN IF NOT EXISTS base_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS discount_reason TEXT;

UPDATE traslados_service_fees
SET base_amount_cents = COALESCE(base_amount_cents, amount_cents),
    discount_cents = COALESCE(discount_cents, 0)
WHERE base_amount_cents IS NULL OR discount_cents IS NULL;
