-- 075_create_traslados_pilots.sql

CREATE TABLE IF NOT EXISTS traslados_pilots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  license_type TEXT NOT NULL,
  license_number TEXT NOT NULL,
  medical_expiry DATE,
  total_hours INTEGER,
  ratings TEXT,
  categories TEXT,
  base_city TEXT,
  availability TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traslados_pilot_documents (
  id SERIAL PRIMARY KEY,
  pilot_id INTEGER NOT NULL REFERENCES traslados_pilots(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_pilots_status ON traslados_pilots(status);
CREATE INDEX IF NOT EXISTS idx_traslados_pilots_created_at ON traslados_pilots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traslados_pilots_user_id ON traslados_pilots(user_id);
CREATE INDEX IF NOT EXISTS idx_traslados_pilot_documents_pilot_id ON traslados_pilot_documents(pilot_id);
