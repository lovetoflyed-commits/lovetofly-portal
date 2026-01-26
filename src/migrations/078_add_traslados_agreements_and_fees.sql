-- 078_add_traslados_agreements_and_fees.sql

ALTER TABLE traslados_requests
  ADD COLUMN IF NOT EXISTS agreement_owner_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS agreement_pilot_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS agreement_confirmed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS traslados_service_fees (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES traslados_requests(id) ON DELETE CASCADE,
  payer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  payer_role TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_fees_request_id ON traslados_service_fees(request_id);
CREATE INDEX IF NOT EXISTS idx_traslados_fees_payer_user_id ON traslados_service_fees(payer_user_id);
