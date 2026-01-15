-- Migration 052: Add CPF, PIX key, owner type to hangar_owners and spaces to hangar_listings
-- Date: 2026-01-13
-- Purpose: Support individual owners (CPF) and companies (CNPJ), PIX payments, and multiple aircraft spaces

-- =============================================
-- HANGAR_OWNERS TABLE MODIFICATIONS
-- =============================================

-- Add owner_type to distinguish individual vs company
ALTER TABLE hangar_owners ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) DEFAULT 'company';
COMMENT ON COLUMN hangar_owners.owner_type IS 'Type of owner: company (uses CNPJ) or individual (uses CPF)';

-- Add CPF field for individual owners
ALTER TABLE hangar_owners ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
COMMENT ON COLUMN hangar_owners.cpf IS 'CPF number for individual owners (11 digits)';

-- Add PIX key fields for payment
ALTER TABLE hangar_owners ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100);
COMMENT ON COLUMN hangar_owners.pix_key IS 'PIX key for receiving payments';

ALTER TABLE hangar_owners ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20);
COMMENT ON COLUMN hangar_owners.pix_key_type IS 'Type of PIX key: cpf, cnpj, email, phone, random';

-- Make CNPJ nullable (since individuals use CPF instead)
ALTER TABLE hangar_owners ALTER COLUMN cnpj DROP NOT NULL;

-- Add constraint to ensure either CPF or CNPJ is provided based on owner_type
-- (Note: This is enforced at application level for flexibility)

-- =============================================
-- HANGAR_LISTINGS TABLE MODIFICATIONS
-- =============================================

-- Add capacity fields for multiple aircraft spaces
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS total_spaces INTEGER DEFAULT 1;
COMMENT ON COLUMN hangar_listings.total_spaces IS 'Total number of aircraft spaces available in this hangar';

ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS available_spaces INTEGER DEFAULT 1;
COMMENT ON COLUMN hangar_listings.available_spaces IS 'Currently available spaces (decreases with bookings)';

ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS space_description TEXT;
COMMENT ON COLUMN hangar_listings.space_description IS 'Description of spaces (e.g., Space A - large, Space B - medium)';

-- Add check constraint to ensure available_spaces <= total_spaces
ALTER TABLE hangar_listings ADD CONSTRAINT check_available_spaces 
  CHECK (available_spaces >= 0 AND available_spaces <= total_spaces);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_hangar_owners_owner_type ON hangar_owners(owner_type);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_cpf ON hangar_owners(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hangar_listings_available_spaces ON hangar_listings(available_spaces) WHERE available_spaces > 0;

-- =============================================
-- UPDATE EXISTING DATA
-- =============================================

-- Set default owner_type for existing records
UPDATE hangar_owners SET owner_type = 'company' WHERE owner_type IS NULL;

-- Set default spaces for existing listings
UPDATE hangar_listings SET total_spaces = 1, available_spaces = 1 
WHERE total_spaces IS NULL OR available_spaces IS NULL;
