ALTER TABLE users
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id
ON users (asaas_customer_id);
