-- Migration: 007_make_cpf_nullable.sql
-- Make cpf column nullable

ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;