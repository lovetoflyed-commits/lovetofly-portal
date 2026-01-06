// Admin API - Approve or Reject verification
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authorization
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id: verificationId } = await params;
    const body = await request.json();
    const { action, reason, notes } = body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get verification details
    const verification = await pool.query(
      'SELECT * FROM hangar_owner_verification WHERE id = $1',
      [verificationId]
    );

    if (verification.rows.length === 0) {
      return NextResponse.json(
        { message: 'Verification not found' },
        { status: 404 }
      );
    }

    const userId = verification.rows[0].user_id;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (action === 'approve') {
        // Update verification status
        await client.query(
          `UPDATE hangar_owner_verification 
           SET verification_status = 'approved',
               verified_by = $1,
               verified_at = NOW(),
               admin_notes = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [admin.id, notes || '', verificationId]
        );

        // Update hangar_owners verified status
        await client.query(
          `UPDATE hangar_owners 
           SET verified = true, 
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );

        // Auto-approve any pending listings from this owner
        await client.query(
          `UPDATE hangar_listings 
           SET approval_status = 'approved',
               approved_by = $1,
               approved_at = NOW(),
               status = 'active'
           WHERE owner_id IN (SELECT id FROM hangar_owners WHERE user_id = $2)
           AND approval_status = 'pending'`,
          [admin.id, userId]
        );
      } else {
        // Reject verification
        await client.query(
          `UPDATE hangar_owner_verification 
           SET verification_status = 'rejected',
               verified_by = $1,
               verified_at = NOW(),
               rejection_reason = $2,
               admin_notes = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [admin.id, reason || 'Verification failed', notes || '', verificationId]
        );

        // Update hangar_owners
        await client.query(
          `UPDATE hangar_owners 
           SET verified = false, 
               updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );
      }

      await client.query('COMMIT');

      // Log admin action
      await logAdminAction(
        admin.id,
        action === 'approve' ? 'approve_verification' : 'reject_verification',
        'hangar_owner_verification',
        verificationId,
        { action, reason, notes },
        request
      );

      return NextResponse.json({
        message: `Verification ${action}d successfully`,
        status: action === 'approve' ? 'approved' : 'rejected'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { message: 'Error updating verification' },
      { status: 500 }
    );
  }
}
