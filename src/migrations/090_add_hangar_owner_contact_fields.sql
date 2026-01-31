-- Add structured contact/address fields for hangar owners
-- Date: 2026-01-29

ALTER TABLE hangar_owners
  ADD COLUMN IF NOT EXISTS address_country VARCHAR(2) DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
  ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address_complement VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(8) DEFAULT '+55',
  ADD COLUMN IF NOT EXISTS phone_mobile VARCHAR(30),
  ADD COLUMN IF NOT EXISTS phone_landline VARCHAR(30),
  ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255),
  ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255),
  ADD COLUMN IF NOT EXISTS social_linkedin VARCHAR(255),
  ADD COLUMN IF NOT EXISTS social_youtube VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_hangar_owners_address_city ON hangar_owners(address_city);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_address_state ON hangar_owners(address_state);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_address_zip ON hangar_owners(address_zip);
