-- Migration: Set default company currency to BRL and align Brazilian records
-- Description: Ensures companies based in Brazil default to BRL

-- Set column default to BRL
ALTER TABLE companies
ALTER COLUMN pay_currency SET DEFAULT 'BRL';

-- Align existing Brazilian companies to BRL
UPDATE companies
SET pay_currency = 'BRL'
WHERE (headquarters_country ILIKE '%brazil%' OR headquarters_country ILIKE '%brasil%' OR headquarters_country ILIKE '%braz%')
  AND (pay_currency IS NULL OR pay_currency = '' OR pay_currency ILIKE 'USD');

COMMENT ON COLUMN companies.pay_currency IS 'ISO 4217 currency for payroll / country of payment (default BRL for Brazil)';
