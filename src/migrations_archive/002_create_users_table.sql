CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  anac_code VARCHAR(20) UNIQUE,
  phone_number VARCHAR(20),
  address TEXT,
  course_type VARCHAR(100),
  current_license VARCHAR(100),
  current_ratings VARCHAR(100),
  total_flight_hours INTEGER DEFAULT 0,
  transferred_from_ciac BOOLEAN DEFAULT FALSE,
  previous_ciac_name VARCHAR(255),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

