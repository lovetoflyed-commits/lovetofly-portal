-- Migration: Add salary currency to jobs
-- Description: Tracks currency for salary ranges to align with employer/pay country

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD';

-- Backfill using company payroll currency when available
UPDATE jobs j
SET salary_currency = COALESCE(j.salary_currency, c.pay_currency, 'USD')
FROM companies c
WHERE j.company_id = c.id;

COMMENT ON COLUMN jobs.salary_currency IS 'ISO 4217 currency for salary range';
