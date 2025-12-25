-- Migration: 006_make_columns_nullable.sql
-- Make birth_date and cpf columns nullable

ALTER TABLE users ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;