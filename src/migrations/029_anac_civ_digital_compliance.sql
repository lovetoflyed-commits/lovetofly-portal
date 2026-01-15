-- ANAC CIV Digital Compliance Migration
-- Adds all required fields for ANAC-compliant Caderneta Individual de Voo

ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS time_diurno INTERVAL DEFAULT '00:00:00';
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS time_noturno INTERVAL DEFAULT '00:00:00';
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS time_ifr_real INTERVAL DEFAULT '00:00:00';
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS time_under_hood INTERVAL DEFAULT '00:00:00';
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS time_simulator INTERVAL DEFAULT '00:00:00';

-- Flight function/role (PIC, SIC, Student, etc.)
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS function VARCHAR(50) DEFAULT 'PIC';

-- Aircraft model
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS aircraft_model VARCHAR(100);

-- Navigation miles
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS nav_miles INTEGER DEFAULT 0;

-- Flight rating (IFRA, MLTE, MNTE)
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS rating VARCHAR(10);

-- Pilot CANAC number
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS pilot_canac_number VARCHAR(20);

-- Remarks/Observations
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Status (CADASTRADO, ENVIADO, CANCELADO)
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'CADASTRADO';

-- Departure and arrival times in HH:MM format
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS departure_time TIME;
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS arrival_time TIME;

-- Landings breakdown
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS day_landings INTEGER DEFAULT 0;
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS night_landings INTEGER DEFAULT 0;

-- Aircraft type (Avião, Helicóptero, etc.)
ALTER TABLE flight_logs ADD COLUMN IF NOT EXISTS aircraft_type VARCHAR(30) DEFAULT 'Avião';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_flight_logs_status ON flight_logs(status);
CREATE INDEX IF NOT EXISTS idx_flight_logs_function ON flight_logs(function);
CREATE INDEX IF NOT EXISTS idx_flight_logs_rating ON flight_logs(rating);
