-- Register manually run migrations in pgmigrations table

INSERT INTO pgmigrations (id, name, run_on) VALUES
  (31, '031_add_aviation_qualifications', NOW()),
  (32, '032_add_first_last_name_to_users', NOW()),
  (33, '033_create_business_management_tables', NOW()),
  (34, '034_create_financial_tables', NOW()),
  (35, '035_create_compliance_and_marketing_tables', NOW()),
  (36, '036_create_coupons_tables', NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequence
SELECT setval('pgmigrations_id_seq', 36);

-- Verify all migrations
SELECT id, name FROM pgmigrations ORDER BY id;
