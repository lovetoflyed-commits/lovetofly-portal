-- Add is_hangar_owner flag to users table
-- This flag indicates if a user has hangar ownership profile (entry in hangar_owners table)
-- Note: role = portal permissions (admin/user)
--       aviation_role = aviation profession (pilot, mechanic, etc.) 
--       is_hangar_owner = additional flag for hangar marketplace participation

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_hangar_owner BOOLEAN DEFAULT false;

-- Create index for quick filtering of hangar owners
CREATE INDEX IF NOT EXISTS idx_users_is_hangar_owner ON users(is_hangar_owner) WHERE is_hangar_owner = true;

-- Update existing users who have hangar_owners entries
UPDATE users u
SET is_hangar_owner = true
WHERE EXISTS (
    SELECT 1 FROM hangar_owners ho WHERE ho.user_id = u.id
);

-- Add comment for clarity
COMMENT ON COLUMN users.is_hangar_owner IS 'Flag indicating user participates in HangarShare as an owner/landlord. This is independent of their aviation_role.';
