-- 076_create_traslados_updates.sql

CREATE TABLE IF NOT EXISTS traslados_operation_updates (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES traslados_requests(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  update_type TEXT NOT NULL,
  status_label TEXT,
  message TEXT NOT NULL,
  flight_number TEXT,
  departure_airport TEXT,
  arrival_airport TEXT,
  stopover_airport TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  interruption_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_updates_request_id ON traslados_operation_updates(request_id);
CREATE INDEX IF NOT EXISTS idx_traslados_updates_created_at ON traslados_operation_updates(created_at DESC);
