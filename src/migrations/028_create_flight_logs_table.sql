-- Migration: Create base flight_logs table for logbook
-- Description: Stores pilot flight records with basic fields

CREATE TABLE IF NOT EXISTS flight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Flight identification
  flight_date DATE NOT NULL,
  departure_aerodrome VARCHAR(10),
  arrival_aerodrome VARCHAR(10),
  
  -- Aircraft info
  aircraft_registration VARCHAR(20),
  aircraft_model VARCHAR(100),
  aircraft_type VARCHAR(30) DEFAULT 'Avião',
  
  -- Time tracking
  departure_time TIME,
  arrival_time TIME,
  
  -- Durations (in INTERVAL format HH:MM)
  time_diurno INTERVAL DEFAULT '00:00:00',
  time_noturno INTERVAL DEFAULT '00:00:00',
  time_ifr_real INTERVAL DEFAULT '00:00:00',
  time_under_hood INTERVAL DEFAULT '00:00:00',
  time_simulator INTERVAL DEFAULT '00:00:00',
  
  -- Function and ratings
  function VARCHAR(50) DEFAULT 'PIC',
  rating VARCHAR(10),
  
  -- Landings
  day_landings INTEGER DEFAULT 0,
  night_landings INTEGER DEFAULT 0,
  
  -- Navigation and remarks
  nav_miles INTEGER DEFAULT 0,
  remarks TEXT,
  
  -- ANAC compliance
  pilot_canac_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'CADASTRADO',
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_flight_logs_user_id ON flight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_logs_date ON flight_logs(flight_date);
CREATE INDEX IF NOT EXISTS idx_flight_logs_status ON flight_logs(status);
CREATE INDEX IF NOT EXISTS idx_flight_logs_function ON flight_logs(function);
CREATE INDEX IF NOT EXISTS idx_flight_logs_rating ON flight_logs(rating);

COMMENT ON TABLE flight_logs IS 'Pilot flight logbook entries (Caderneta Individual de Voo) - ANAC CIV Digital compliant';
COMMENT ON COLUMN flight_logs.status IS 'CADASTRADO (draft) or ENVIADO (submitted to ANAC)';
COMMENT ON COLUMN flight_logs.function IS 'Pilot function: PIC, SIC, STUDENT, INSTRUCTOR, DUAL';
