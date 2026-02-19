-- Fix pix_payments.user_id column type from UUID to INTEGER
-- User IDs in the system are INTEGER, not UUID

-- Drop the existing foreign key constraint
ALTER TABLE pix_payments 
DROP CONSTRAINT IF EXISTS pix_payments_user_id_fkey;

-- Change the user_id column type from UUID to INTEGER
ALTER TABLE pix_payments 
ALTER COLUMN user_id TYPE INTEGER USING user_id::text::integer;

-- Add the proper foreign key constraint
ALTER TABLE pix_payments 
ADD CONSTRAINT pix_payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
