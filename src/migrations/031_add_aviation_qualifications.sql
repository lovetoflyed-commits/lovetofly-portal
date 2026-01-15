-- Migration: Add aviation qualification fields
-- Description: Add licenses, ratings, and current course fields for aviation professionals

ALTER TABLE users
ADD COLUMN IF NOT EXISTS licencas TEXT,
ADD COLUMN IF NOT EXISTS habilitacoes TEXT,
ADD COLUMN IF NOT EXISTS curso_atual TEXT;

COMMENT ON COLUMN users.licencas IS 'Licenças do piloto/profissional (ex: PP, PC, ATP) - texto livre';
COMMENT ON COLUMN users.habilitacoes IS 'Habilitações/ratings (ex: MLTE, IFR, B737) - texto livre';
COMMENT ON COLUMN users.curso_atual IS 'Curso atual em andamento (ex: Hab. Tipo A320) - opcional';
