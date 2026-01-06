
CREATE TABLE IF NOT EXISTS hangar_owners (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	company_name VARCHAR(255) NOT NULL,
	cnpj VARCHAR(18) NOT NULL,
	bank_code VARCHAR(10) NOT NULL,
	bank_agency VARCHAR(10) NOT NULL,
	bank_account VARCHAR(20) NOT NULL,
	account_holder_name VARCHAR(255) NOT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	verified BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_user_id ON hangar_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_is_active ON hangar_owners(is_active);
CREATE INDEX IF NOT EXISTS idx_hangar_owners_verified ON hangar_owners(verified);
