-- Migration: Add payroll currency to companies
-- Description: Stores ISO 4217 currency code for payroll or headquarters country

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS pay_currency VARCHAR(3);

-- Attempt to derive sensible defaults from headquarters country
UPDATE companies
SET pay_currency = CASE
  WHEN headquarters_country ILIKE '%brazil%' OR headquarters_country ILIKE '%brasil%' OR headquarters_country ILIKE '%braz%' THEN 'BRL'
  WHEN headquarters_country ILIKE '%united states%' OR headquarters_country ILIKE '%usa%' OR headquarters_country ILIKE '%u.s.%' THEN 'USD'
  WHEN headquarters_country ILIKE '%united kingdom%' OR headquarters_country ILIKE '%uk%' OR headquarters_country ILIKE '%britain%' THEN 'GBP'
  WHEN headquarters_country ILIKE '%canada%' THEN 'CAD'
  WHEN headquarters_country ILIKE '%euro%' OR headquarters_country ILIKE '%europa%' THEN 'EUR'
  ELSE COALESCE(pay_currency, 'USD')
END
WHERE pay_currency IS NULL;

ALTER TABLE companies
ALTER COLUMN pay_currency SET DEFAULT 'USD';

COMMENT ON COLUMN companies.pay_currency IS 'ISO 4217 currency for payroll / country of payment';
