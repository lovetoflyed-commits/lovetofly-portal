-- 074_create_traslados_requests.sql

CREATE TABLE IF NOT EXISTS traslados_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  aircraft_model TEXT NOT NULL,
  aircraft_prefix TEXT NOT NULL,
  aircraft_category TEXT NOT NULL,
  maintenance_status TEXT,
  origin_city TEXT NOT NULL,
  origin_airport TEXT,
  destination_city TEXT NOT NULL,
  destination_airport TEXT,
  date_window_start DATE NOT NULL,
  date_window_end DATE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  operator_name TEXT,
  notes TEXT,
  owner_authorization BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_requests_status ON traslados_requests(status);
CREATE INDEX IF NOT EXISTS idx_traslados_requests_created_at ON traslados_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traslados_requests_user_id ON traslados_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_traslados_requests_assigned_to ON traslados_requests(assigned_to);
