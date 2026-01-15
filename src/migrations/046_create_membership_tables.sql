-- Migration: Create membership plans and user memberships

CREATE TABLE IF NOT EXISTS membership_plans (
  id SERIAL PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL, -- free, standard, premium, pro
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL, -- 0 free, 1 standard, 2 premium, 3 pro
  price NUMERIC(12,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'BRL',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membership_level ON membership_plans(level);

CREATE TABLE IF NOT EXISTS user_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES membership_plans(id),
  status VARCHAR(30) DEFAULT 'active', -- active, past_due, expired, cancelled
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_payment_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_membership_unique ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_membership_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_membership_expiry ON user_memberships(expires_at);
