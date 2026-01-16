-- Seed Career Profiles for Pilot Users
-- Links to users seeded in 001_seed_users.sql

INSERT INTO career_profiles (
  user_id,
  professional_summary,
  career_category,
  pilot_licenses,
  habilitacoes,
  medical_class,
  total_flight_hours,
  pic_hours,
  sic_hours,
  instruction_hours,
  ifr_hours,
  night_hours,
  work_experience,
  education,
  skills,
  languages,
  available_for_work,
  willing_to_relocate,
  preferred_locations,
  preferred_aircraft_types,
  preferred_operation_types,
  contact_phone,
  contact_email,
  linkedin_url,
  profile_visibility,
  resume_photo,
  photo_source,
  profile_completed_percentage,
  created_at,
  last_updated
) 
SELECT 
  u.id,
  'Experienced commercial pilot with extensive flight hours in various aircraft types. Strong focus on safety, crew resource management, and customer service. Seeking opportunities for career advancement.',
  'CPL',
  '{"type":"CPL","level":"Commercial","typeRatings":"A320,B737"}'::jsonb,
  '["A320","B737","MLTE"]'::jsonb,
  'Class 1',
  1500,
  800,
  700,
  0,
  600,
  400,
  '{"currentPosition":"First Officer","currentCompany":"TAM Linhas Aéreas","startDate":"2020-01-15","employmentType":"Full-time","industry":"Commercial Aviation"}'::jsonb,
  '{"level":"Bachelor of Science","specializations":["Aeronautical Science","Aviation Management"]}'::jsonb,
  '{"coreSkills":["Flight Operations","CRM","Navigation","Emergency Procedures"],"softSkills":["Leadership","Communication","Problem Solving","Teamwork"]}'::jsonb,
  '["Portuguese","English","Spanish"]'::jsonb,
  true,
  true,
  'São Paulo, Rio de Janeiro, Brasília',
  'A320, B737, E-Jets',
  'Commercial Aviation, Corporate',
  '+55 11 98765-4321',
  'carlos.silva@test.local',
  'https://linkedin.com/in/carlossilva',
  'public',
  NULL,
  'portal',
  85,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '5 days'
FROM users u WHERE u.email = 'carlos.silva@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO career_profiles (
  user_id, professional_summary, career_category, pilot_licenses, habilitacoes,
  medical_class, total_flight_hours, pic_hours, sic_hours, instruction_hours,
  ifr_hours, night_hours, work_experience, education, skills, languages,
  available_for_work, willing_to_relocate, preferred_locations,
  preferred_aircraft_types, preferred_operation_types, contact_phone,
  contact_email, linkedin_url, profile_visibility, photo_source,
  profile_completed_percentage, created_at, last_updated
)
SELECT 
  u.id,
  'Airline Transport Pilot with 15+ years of experience. Currently serving as Captain on widebody aircraft. Certified flight instructor with passion for training and mentoring new pilots.',
  'ATPL',
  '{"type":"ATPL","level":"Airline Transport","typeRatings":"B777,B787,A330"}'::jsonb,
  '["B777","B787","A330","Multi-Engine"]'::jsonb,
  'Class 1',
  8500,
  6000,
  2500,
  450,
  4500,
  2000,
  '{"currentPosition":"Captain","currentCompany":"LATAM Airlines","startDate":"2015-03-01","employmentType":"Full-time","industry":"International Aviation"}'::jsonb,
  '{"level":"Master of Science","specializations":["Aviation Safety","Human Factors"]}'::jsonb,
  '{"coreSkills":["Wide-body Operations","International Routes","Training & Check","Safety Management"],"softSkills":["Leadership","Mentoring","Decision Making","Cultural Awareness"]}'::jsonb,
  '["Portuguese","English","French"]'::jsonb,
  false,
  false,
  'São Paulo, Rio de Janeiro',
  'B777, B787, A330, A350',
  'International Long-Haul, Training',
  '+55 21 97654-3210',
  'maria.santos@test.local',
  'https://linkedin.com/in/mariasantos',
  'public',
  'portal',
  95,
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'maria.santos@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO career_profiles (
  user_id, professional_summary, career_category, pilot_licenses, habilitacoes,
  medical_class, total_flight_hours, pic_hours, sic_hours, instruction_hours,
  ifr_hours, night_hours, work_experience, education, skills, languages,
  available_for_work, willing_to_relocate, preferred_locations,
  preferred_aircraft_types, preferred_operation_types, contact_phone,
  contact_email, linkedin_url, profile_visibility, photo_source,
  profile_completed_percentage, created_at, last_updated
)
SELECT 
  u.id,
  'Newly licensed private pilot seeking to build hours and gain experience. Enthusiastic about aviation and eager to learn. Open to various flying opportunities.',
  'PPL',
  '{"type":"PPL","level":"Private","typeRatings":"SEL"}'::jsonb,
  '["Single Engine Land"]'::jsonb,
  'Class 2',
  150,
  120,
  30,
  0,
  15,
  20,
  '{"currentPosition":"Junior Pilot","currentCompany":"São Paulo Flying Club","startDate":"2024-06-01","employmentType":"Part-time","industry":"General Aviation"}'::jsonb,
  '{"level":"Bachelor of Engineering","specializations":["Mechanical Engineering"]}'::jsonb,
  '{"coreSkills":["VFR Navigation","Basic Maneuvers","Pre-flight Planning"],"softSkills":["Attention to Detail","Learning Agility","Safety Conscious"]}'::jsonb,
  '["Portuguese","English"]'::jsonb,
  true,
  true,
  'São Paulo, Campinas, Santos',
  'Cessna 152, Cessna 172, PA-28',
  'General Aviation, Flight School',
  '+55 11 96543-2109',
  'joao.oliveira@test.local',
  NULL,
  'public',
  'portal',
  60,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'joao.oliveira@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO career_profiles (
  user_id, professional_summary, career_category, pilot_licenses, habilitacoes,
  medical_class, total_flight_hours, pic_hours, sic_hours, instruction_hours,
  ifr_hours, night_hours, work_experience, education, skills, languages,
  available_for_work, willing_to_relocate, preferred_locations,
  preferred_aircraft_types, preferred_operation_types, contact_phone,
  contact_email, linkedin_url, profile_visibility, photo_source,
  profile_completed_percentage, created_at, last_updated
)
SELECT 
  u.id,
  'Corporate pilot with extensive experience in business aviation. Specialized in executive transport with focus on discretion, flexibility, and premium service delivery.',
  'CPL',
  '{"type":"CPL","level":"Commercial","typeRatings":"Citation,Phenom,Learjet"}'::jsonb,
  '["Citation CJ","Phenom 300","Learjet 45"]'::jsonb,
  'Class 1',
  3500,
  2800,
  700,
  0,
  2000,
  800,
  '{"currentPosition":"Corporate Pilot","currentCompany":"Executive Jets International","startDate":"2018-09-01","employmentType":"Full-time","industry":"Corporate Aviation"}'::jsonb,
  '{"level":"Bachelor of Aviation","specializations":["Professional Pilot","Aviation Management"]}'::jsonb,
  '{"coreSkills":["Corporate Operations","International Flight Planning","Crew Coordination","VIP Service"],"softSkills":["Discretion","Flexibility","Customer Service","Time Management"]}'::jsonb,
  '["English","Spanish","Portuguese"]'::jsonb,
  true,
  true,
  'Miami, São Paulo, Mexico City',
  'Citation, Phenom, Gulfstream, Legacy',
  'Corporate, Executive Charter',
  '+1 555 123-4567',
  'michael.johnson@test.local',
  'https://linkedin.com/in/michaeljohnson',
  'public',
  'portal',
  90,
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '7 days'
FROM users u WHERE u.email = 'michael.johnson@test.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO career_profiles (
  user_id, professional_summary, career_category, pilot_licenses, habilitacoes,
  medical_class, total_flight_hours, pic_hours, sic_hours, instruction_hours,
  ifr_hours, night_hours, work_experience, education, skills, languages,
  available_for_work, willing_to_relocate, preferred_locations,
  preferred_aircraft_types, preferred_operation_types, contact_phone,
  contact_email, linkedin_url, profile_visibility, photo_source,
  profile_completed_percentage, created_at, last_updated
)
SELECT 
  u.id,
  'Certified Flight Instructor with 2000+ hours of instruction given. Passionate about teaching and developing competent, safe pilots. Experienced in both fixed-wing and rotary-wing instruction.',
  'CFI',
  '{"type":"CFI","level":"Flight Instructor","typeRatings":"SEL,MEL,Instrument"}'::jsonb,
  '["CFII","MEI","Aerobatic"]'::jsonb,
  'Class 1',
  2500,
  500,
  0,
  2000,
  1500,
  600,
  '{"currentPosition":"Chief Flight Instructor","currentCompany":"Madrid Flight Academy","startDate":"2019-05-15","employmentType":"Full-time","industry":"Flight Training"}'::jsonb,
  '{"level":"Master of Education","specializations":["Aviation Education","Instructional Design"]}'::jsonb,
  '{"coreSkills":["Flight Instruction","Curriculum Development","Safety Training","Checkride Preparation"],"softSkills":["Teaching","Patience","Communication","Motivation"]}'::jsonb,
  '["Spanish","English","Portuguese"]'::jsonb,
  false,
  false,
  'Madrid, Barcelona, Lisboa',
  'Cessna, Piper, Diamond, Tecnam',
  'Flight Training, Aerobatic',
  '+34 612 345 678',
  'sofia.rodriguez@test.local',
  'https://linkedin.com/in/sofiarodriguez',
  'public',
  'portal',
  88,
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '10 days'
FROM users u WHERE u.email = 'sofia.rodriguez@test.local'
ON CONFLICT (user_id) DO NOTHING;

-- Output summary
SELECT 
  'Career profiles seeded successfully!' as message,
  COUNT(*) as total_profiles 
FROM career_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.email LIKE '%@test.local';
