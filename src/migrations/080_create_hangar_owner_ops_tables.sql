-- Create tables for HangarShare owner ops suite (waitlists, leases, utilization)

-- Extend owner_documents for listing-scoped docs and expiry tracking
ALTER TABLE owner_documents
  ADD COLUMN IF NOT EXISTS listing_id INTEGER REFERENCES hangar_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_owner_documents_listing_id ON owner_documents(listing_id);
CREATE INDEX IF NOT EXISTS idx_owner_documents_expires_at ON owner_documents(expires_at);

-- Waitlist entries per hangar listing
CREATE TABLE IF NOT EXISTS hangar_waitlist (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, notified, accepted, cancelled
  desired_start_date DATE,
  desired_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hangar_waitlist_listing_status ON hangar_waitlist(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_hangar_waitlist_user_id ON hangar_waitlist(user_id);

-- Lease templates
CREATE TABLE IF NOT EXISTS hangar_lease_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  content_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hangar_lease_templates_name_version
  ON hangar_lease_templates(name, version);

-- Leases per listing
CREATE TABLE IF NOT EXISTS hangar_leases (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES hangar_owners(id) ON DELETE CASCADE,
  lease_template_id INTEGER REFERENCES hangar_lease_templates(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, expired, cancelled
  start_date DATE,
  end_date DATE,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hangar_leases_listing_status ON hangar_leases(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_hangar_leases_owner_id ON hangar_leases(owner_id);

-- Daily utilization metrics per listing
CREATE TABLE IF NOT EXISTS hangar_utilization_daily (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES hangar_listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  occupancy_rate NUMERIC(5,2) DEFAULT 0, -- 0-100
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hangar_utilization_daily_listing_date
  ON hangar_utilization_daily(listing_id, date);
CREATE INDEX IF NOT EXISTS idx_hangar_utilization_daily_date
  ON hangar_utilization_daily(date);
