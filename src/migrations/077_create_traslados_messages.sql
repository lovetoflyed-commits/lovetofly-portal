-- 077_create_traslados_messages.sql

CREATE TABLE IF NOT EXISTS traslados_messages (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES traslados_requests(id) ON DELETE CASCADE,
  sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  has_redactions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_messages_request_id ON traslados_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_traslados_messages_created_at ON traslados_messages(created_at DESC);
