-- Seed Users Table with Realistic Test Data
-- Password for all users: "Test123!" (bcrypt hash below)

-- Clear existing seed data (optional - remove if you want to preserve existing users)
-- DELETE FROM users WHERE email LIKE '%@test.local';

INSERT INTO users (
  first_name, last_name, birth_date, cpf, email, password_hash, 
  mobile_phone, address_street, address_number, address_complement, 
  address_neighborhood, address_city, address_state, address_zip, address_country,
  aviation_role, aviation_role_other, social_media, newsletter_opt_in, 
  terms_agreed, plan, avatar_url, badges, created_at, updated_at
) VALUES
-- Admin User (for testing admin features)
('Admin', 'Sistema', '1985-03-15', '123.456.789-00', 'admin@test.local', 
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 99999-0001', 'Avenida Paulista', '1000', 'Sala 1', 
 'Bela Vista', 'São Paulo', 'SP', '01310-100', 'Brasil',
 'admin', NULL, '@admin_test', true, 
 true, 'pro', '/seed-assets/avatars/admin.svg', 
 ARRAY['admin', 'moderator'], NOW(), NOW()),

-- Pilot Users (various experience levels)
('Carlos', 'Silva', '1990-05-20', '234.567.890-11', 'carlos.silva@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 98765-4321', 'Rua dos Aviadores', '250', 'Apt 42',
 'Jardins', 'São Paulo', 'SP', '01234-567', 'Brasil',
 'pilot', 'Commercial Pilot', '@carlossilva', true,
 true, 'premium', 'https://ui-avatars.com/api/?name=Carlos+Silva&background=4CAF50&color=fff',
 ARRAY['pilot', 'verified'], NOW(), NOW()),

('Maria', 'Santos', '1988-08-12', '345.678.901-22', 'maria.santos@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 21 97654-3210', 'Avenida Atlântica', '1500', NULL,
 'Copacabana', 'Rio de Janeiro', 'RJ', '22021-000', 'Brasil',
 'pilot', 'Airline Captain', '@mariasantos', true,
 true, 'pro', 'https://ui-avatars.com/api/?name=Maria+Santos&background=FF5722&color=fff',
 ARRAY['pilot', 'captain', 'instructor'], NOW(), NOW()),

('João', 'Oliveira', '1995-11-30', '456.789.012-33', 'joao.oliveira@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 96543-2109', 'Rua Augusta', '800', 'Cobertura',
 'Consolação', 'São Paulo', 'SP', '01305-000', 'Brasil',
 'pilot', 'Private Pilot', '@joaooliveira', false,
 true, 'free', 'https://ui-avatars.com/api/?name=Joao+Oliveira&background=2196F3&color=fff',
 ARRAY['pilot'], NOW(), NOW()),

-- Aircraft Owners / Hangar Owners
('Roberto', 'Costa', '1978-02-18', '567.890.123-44', 'roberto.costa@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 95432-1098', 'Avenida Brigadeiro Faria Lima', '3000', 'Torre A',
 'Itaim Bibi', 'São Paulo', 'SP', '01452-000', 'Brasil',
 'aircraft_owner', 'Business Owner', '@robertocosta', true,
 true, 'premium', 'https://ui-avatars.com/api/?name=Roberto+Costa&background=9C27B0&color=fff',
 ARRAY['owner', 'verified'], NOW(), NOW()),

('Ana', 'Ferreira', '1982-07-25', '678.901.234-55', 'ana.ferreira@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 94321-0987', 'Rua Estados Unidos', '1500', 'Casa',
 'Jardim América', 'São Paulo', 'SP', '01427-000', 'Brasil',
 'aircraft_owner', 'Hangar Owner', '@anaferreira', true,
 true, 'pro', 'https://ui-avatars.com/api/?name=Ana+Ferreira&background=FF9800&color=fff',
 ARRAY['owner', 'hangar_provider'], NOW(), NOW()),

-- Mechanics / Maintenance
('Paulo', 'Martins', '1975-04-10', '789.012.345-66', 'paulo.martins@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 93210-9876', 'Rua do Hangar', '100', 'Galpão 5',
 'Aeroporto', 'Guarulhos', 'SP', '07190-100', 'Brasil',
 'mechanic', 'Aircraft Mechanic', '@paulomartins', true,
 true, 'premium', 'https://ui-avatars.com/api/?name=Paulo+Martins&background=795548&color=fff',
 ARRAY['mechanic', 'certified'], NOW(), NOW()),

-- Enthusiasts / Students
('Lucas', 'Almeida', '1998-09-08', '890.123.456-77', 'lucas.almeida@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 92109-8765', 'Rua dos Estudantes', '450', 'Apt 12',
 'Vila Mariana', 'São Paulo', 'SP', '04101-000', 'Brasil',
 'student', 'Flight Student', '@lucasalmeida', true,
 true, 'free', 'https://ui-avatars.com/api/?name=Lucas+Almeida&background=3F51B5&color=fff',
 ARRAY['student'], NOW(), NOW()),

('Fernanda', 'Lima', '1992-12-03', '901.234.567-88', 'fernanda.lima@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 21 91098-7654', 'Avenida Rio Branco', '120', 'Sala 500',
 'Centro', 'Rio de Janeiro', 'RJ', '20040-001', 'Brasil',
 'enthusiast', 'Aviation Enthusiast', '@fernandalima', false,
 true, 'free', 'https://ui-avatars.com/api/?name=Fernanda+Lima&background=E91E63&color=fff',
 ARRAY['enthusiast'], NOW(), NOW()),

-- International Users
('Michael', 'Johnson', '1987-06-15', NULL, 'michael.johnson@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+1 555 123-4567', '123 Airport Rd', 'Suite 100', NULL,
 'Downtown', 'Miami', 'FL', '33101', 'United States',
 'pilot', 'Corporate Pilot', '@michaeljohnson', true,
 true, 'premium', 'https://ui-avatars.com/api/?name=Michael+Johnson&background=00BCD4&color=fff',
 ARRAY['pilot', 'international'], NOW(), NOW()),

('Sofia', 'Rodriguez', '1991-03-22', NULL, 'sofia.rodriguez@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+34 612 345 678', 'Calle Mayor', '50', 'Piso 3',
 'Centro', 'Madrid', 'MD', '28013', 'España',
 'pilot', 'Flight Instructor', '@sofiarodriguez', true,
 true, 'pro', 'https://ui-avatars.com/api/?name=Sofia+Rodriguez&background=673AB7&color=fff',
 ARRAY['pilot', 'instructor', 'international'], NOW(), NOW()),

-- More varied roles
('Ricardo', 'Souza', '1980-10-05', '012.345.678-99', 'ricardo.souza@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 90987-6543', 'Alameda Santos', '2000', 'Conj 1001',
 'Cerqueira César', 'São Paulo', 'SP', '01418-200', 'Brasil',
 'instructor', 'Flight Instructor', '@ricardosouza', true,
 true, 'premium', 'https://ui-avatars.com/api/?name=Ricardo+Souza&background=009688&color=fff',
 ARRAY['instructor', 'examiner'], NOW(), NOW()),

('Juliana', 'Rocha', '1993-01-28', '123.456.789-10', 'juliana.rocha@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 89876-5432', 'Rua Oscar Freire', '1200', NULL,
 'Pinheiros', 'São Paulo', 'SP', '05409-011', 'Brasil',
 'flight_attendant', 'Flight Attendant', '@julianarocha', true,
 true, 'free', 'https://ui-avatars.com/api/?name=Juliana+Rocha&background=FFC107&color=fff',
 ARRAY['crew'], NOW(), NOW()),

('Diego', 'Fernandes', '1986-05-17', '234.567.890-21', 'diego.fernandes@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 88765-4321', 'Avenida Nove de Julho', '5000', 'Bloco B',
 'Jardim Europa', 'São Paulo', 'SP', '01406-000', 'Brasil',
 'aviation_manager', 'Airport Manager', '@diegofernandes', false,
 true, 'premium', 'https://ui-avatars.com/api/?name=Diego+Fernandes&background=8BC34A&color=fff',
 ARRAY['manager'], NOW(), NOW()),

('Beatriz', 'Carvalho', '1989-11-12', '345.678.901-32', 'beatriz.carvalho@test.local',
 '$2a$10$rC4VJLqN5B0WmXYLHr4eJ.K5YnGJxGqJQwK1XC3aXb0HZJRnD5Dxu',
 '+55 11 87654-3210', 'Rua Haddock Lobo', '595', 'Apt 80',
 'Cerqueira César', 'São Paulo', 'SP', '01414-001', 'Brasil',
 'atc', 'Air Traffic Controller', '@beatrizcarvalho', true,
 true, 'pro', 'https://ui-avatars.com/api/?name=Beatriz+Carvalho&background=F44336&color=fff',
 ARRAY['atc', 'certified'], NOW(), NOW())

ON CONFLICT (email) DO NOTHING;

-- Output summary
SELECT 'Users seeded successfully!' as message, COUNT(*) as total_users FROM users WHERE email LIKE '%@test.local';
