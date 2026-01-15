-- Migration: Create financial tables for admin financial module

CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- e.g. 'payment', 'refund', 'transfer'
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  related_contract_id INTEGER REFERENCES contracts(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_user ON financial_transactions(user_id);

-- Table for invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id),
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  status VARCHAR(50) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoices(due_date);
