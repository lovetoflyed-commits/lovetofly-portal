// Admin API - Approve or Reject hangar listing
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { action, reason, notes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await pool.query(
        `UPDATE hangar_listings 
         SET approval_status = 'approved',
             approved_by = $1,
             approved_at = NOW(),
             admin_notes = $2,
             status = 'active',
             is_available = true,
             updated_at = NOW()
         WHERE id = $3`,
        [admin.id, notes || '', listingId]
      );
    } else {
      await pool.query(
        `UPDATE hangar_listings 
         SET approval_status = 'rejected',
             approved_by = $1,
             approved_at = NOW(),
             rejection_reason = $2,
             admin_notes = $3,
             status = 'inactive',
             is_available = false,
             updated_at = NOW()
         WHERE id = $4`,
        [admin.id, reason || 'Listing does not meet requirements', notes || '', listingId]
      );
    }

    await logAdminAction(
      admin.id,
      action === 'approve' ? 'approve_listing' : 'reject_listing',
      'hangar_listing',
      listingId,
      { action, reason, notes },
      request
    );

    return NextResponse.json({
      message: `Listing ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { message: 'Error updating listing' },
      { status: 500 }
    );
  }
}
