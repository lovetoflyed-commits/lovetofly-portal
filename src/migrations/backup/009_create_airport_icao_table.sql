-- Migration: Add ICAO search table with airport data
-- Description: Cache de aeródromos para busca rápida

CREATE TABLE IF NOT EXISTS airport_icao (
  id SERIAL PRIMARY KEY,
  icao_code VARCHAR(4) UNIQUE NOT NULL,
  iata_code VARCHAR(3),
  airport_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  elevation_feet INTEGER,
  is_public BOOLEAN DEFAULT false,
  has_facilities BOOLEAN DEFAULT false,
  
  -- Last updated from external API
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airport_icao_code ON airport_icao(icao_code);
CREATE INDEX idx_airport_city ON airport_icao(city, state);

-- Insert some major Brazilian airports
INSERT INTO airport_icao (icao_code, iata_code, airport_name, city, state, country, is_public, has_facilities) VALUES
('SBSP', 'GRU', 'São Paulo/Congonhas', 'São Paulo', 'SP', 'Brasil', true, true),
('SBGR', 'GRU', 'São Paulo/Guarulhos', 'Guarulhos', 'SP', 'Brasil', true, true),
('SBRJ', 'SDU', 'Rio de Janeiro/Santos Dumont', 'Rio de Janeiro', 'RJ', 'Brasil', true, true),
('SBRF', 'REC', 'Recife/Guararapes', 'Recife', 'PE', 'Brasil', true, true),
('SBAM', 'MAO', 'Manaus/Eduardo Gomes', 'Manaus', 'AM', 'Brasil', true, true),
('SBCF', 'CNF', 'Belo Horizonte/Confins - Tancredo Neves', 'Belo Horizonte', 'MG', 'Brasil', true, true),
('SBKT', 'BSB', 'Brasília/Presidente Juscelino Kubitschek', 'Brasília', 'DF', 'Brasil', true, true),
('SBPA', 'POA', 'Porto Alegre/Salgado Filho', 'Porto Alegre', 'RS', 'Brasil', true, true),
('SBCT', 'CWB', 'Curitiba/Afonso Pena', 'Curitiba', 'PR', 'Brasil', true, true),
('SBVT', 'VIX', 'Vitória/Goitacazes', 'Vitória', 'ES', 'Brasil', true, true),
('SBUL', 'UDI', 'Uberlândia/Ten. Coronel Av. Cesar Bombonato', 'Uberlândia', 'MG', 'Brasil', false, true),
('SBJD', 'JAI', 'Jaú/Mário Pereira Lins', 'Jaú', 'SP', 'Brasil', false, false),
('SBFI', 'FLN', 'Florianópolis/Hercílio Luz', 'Florianópolis', 'SC', 'Brasil', true, true),
('SBMQ', 'MAO', 'Marília/Gastão Liberal Pinheiro', 'Marília', 'SP', 'Brasil', false, false);
ON CONFLICT DO NOTHING;
