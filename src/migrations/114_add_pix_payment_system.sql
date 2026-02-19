-- Create PIX payment system tables
-- This migration sets up PIX payment support with QR code generation and payment tracking

-- Create payment methods enum type
CREATE TYPE payment_method AS ENUM ('stripe', 'pix', 'boleto');

-- Create PIX keys table for storing merchant PIX account details
CREATE TABLE pix_keys (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    pix_key VARCHAR(255) NOT NULL UNIQUE,
    pix_key_type VARCHAR(50) NOT NULL, -- cpf, cnpj, email, phone, random_key
    bank_name VARCHAR(100),
    account_holder_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    notes TEXT
);

CREATE INDEX idx_pix_keys_organization_active ON pix_keys(organization_id, is_active);

-- Create PIX payments table for tracking all PIX transactions
CREATE TABLE pix_payments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    order_id VARCHAR(100), -- Reference to membership upgrade, booking, etc.
    order_type VARCHAR(50) NOT NULL, -- membership, hangar_booking, classifieds, etc.
    amount_cents BIGINT NOT NULL, -- Store in cents to avoid floating point issues
    currency VARCHAR(3) DEFAULT 'BRL',
    pix_key_id INTEGER REFERENCES pix_keys(id),
    
    -- QR Code and transaction tracking
    qr_code_content TEXT, -- The actual BRCode content
    qr_code_url TEXT, -- URL to uploaded QR code image
    transaction_id VARCHAR(255) UNIQUE, -- PIX transaction ID from bank
    
    -- Status and timestamps
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, expired, cancelled, refunded
    payment_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    -- Metadata and verification
    payer_name VARCHAR(255),
    payer_key VARCHAR(255), -- PIX key of payer (optional)
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_pix_payments_user_status ON pix_payments(user_id, status);
CREATE INDEX idx_pix_payments_order ON pix_payments(order_type, order_id);
CREATE INDEX idx_pix_payments_transaction_id ON pix_payments(transaction_id);
CREATE INDEX idx_pix_payments_expires_at ON pix_payments(expires_at);

-- Create PIX webhook logs for debugging and audit trail
CREATE TABLE pix_webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100), -- payment.received, payment.pending, etc.
    external_id VARCHAR(255),
    transaction_id VARCHAR(255),
    payload JSONB,
    status VARCHAR(50), -- success, failed, processed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pix_webhook_logs_transaction_id ON pix_webhook_logs(transaction_id);
CREATE INDEX idx_pix_webhook_logs_created_at ON pix_webhook_logs(created_at);

-- Add pix_payment_id column to user_payments or membership tracking tables if they exist
-- This allows linking payments across the system
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS pix_payment_id INTEGER REFERENCES pix_payments(id),
ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'stripe';

-- Add payment method to hangar bookings if table exists
ALTER TABLE hangar_bookings 
ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS pix_payment_id INTEGER REFERENCES pix_payments(id) ON DELETE SET NULL;

-- Create function to update pix_payments timestamps
CREATE OR REPLACE FUNCTION update_pix_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating pix_payments.updated_at
DROP TRIGGER IF EXISTS pix_payments_update_timestamp ON pix_payments;
CREATE TRIGGER pix_payments_update_timestamp
BEFORE UPDATE ON pix_payments
FOR EACH ROW
EXECUTE FUNCTION update_pix_payments_updated_at();

-- Create function to update pix_keys timestamps
CREATE OR REPLACE FUNCTION update_pix_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating pix_keys.updated_at
DROP TRIGGER IF EXISTS pix_keys_update_timestamp ON pix_keys;
CREATE TRIGGER pix_keys_update_timestamp
BEFORE UPDATE ON pix_keys
FOR EACH ROW
EXECUTE FUNCTION update_pix_keys_updated_at();
