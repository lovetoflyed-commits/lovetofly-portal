-- Adiciona coluna default_booking_type à tabela hangar_listings
ALTER TABLE hangar_listings
  ADD COLUMN IF NOT EXISTS default_booking_type VARCHAR(20) DEFAULT 'refundable';

-- Opcional: cria índice para facilitar buscas por tipo
CREATE INDEX IF NOT EXISTS idx_hangar_listings_default_booking_type ON hangar_listings(default_booking_type);