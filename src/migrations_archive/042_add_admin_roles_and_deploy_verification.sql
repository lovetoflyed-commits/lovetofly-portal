-- Migration: Add admin roles and deploy verification table
-- Date: 2026-01-06
-- Purpose: Enable admin approval workflow for HangarShare

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create role types: 'user', 'admin', 'staff', 'hangar_owner'
COMMENT ON COLUMN users.role IS 'User role: user, admin, staff, hangar_owner';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 2: Create hangar_owner_verification table (from migration 012)
CREATE TABLE IF NOT EXISTS hangar_owner_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identity Verification
  id_document_type VARCHAR(50) NOT NULL,
  id_document_number VARCHAR(100) NOT NULL,
  id_document_country VARCHAR(100) NOT NULL DEFAULT 'Brasil',
  id_document_expiry DATE,
  id_document_front_url TEXT,
  id_document_back_url TEXT,
  selfie_url TEXT,
  
  -- Hangar Ownership/Authorization
  ownership_proof_type VARCHAR(50) NOT NULL,
  ownership_document_url TEXT,
  lease_agreement_url TEXT,
  authorization_letter_url TEXT,
  
  -- Company Documents
  company_registration_url TEXT,
  tax_document_url TEXT,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Terms Agreement
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP,
  terms_version VARCHAR(20) DEFAULT '1.0',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON hangar_owner_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON hangar_owner_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_verified_by ON hangar_owner_verification(verified_by);

-- Step 3: Add approval workflow fields to hangar_listings
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE hangar_listings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- approval_status: 'pending', 'approved', 'rejected', 'under_review'
COMMENT ON COLUMN hangar_listings.approval_status IS 'Approval status: pending, approved, rejected, under_review';

CREATE INDEX IF NOT EXISTS idx_listings_approval_status ON hangar_listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_approved_by ON hangar_listings(approved_by);

-- Step 4: Update existing listings to approved (for migration compatibility)
UPDATE hangar_listings SET approval_status = 'approved', approved_at = NOW() WHERE approval_status IS NULL;

-- Step 5: Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_action ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created ON admin_activity_log(created_at DESC);

COMMENT ON TABLE admin_activity_log IS 'Audit trail for admin actions';

-- Step 6: Set yourself as admin (update with your actual user email)
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
