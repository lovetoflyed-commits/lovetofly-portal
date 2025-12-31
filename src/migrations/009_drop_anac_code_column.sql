-- Migration: 005_drop_anac_code_column.sql
-- Remove anac_code column as it should not be in the system

ALTER TABLE users DROP COLUMN IF EXISTS anac_code;