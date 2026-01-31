import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/utils/storage';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Verify authentication
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check authorization
    const listingRes = await pool.query(
      'SELECT owner_id FROM hangar_listings WHERE id = $1',
      [listingId]
    );

    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listingRes.rows[0].owner_id === user.id;
    const isAdmin = user.role === 'MASTER' || user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get photo ID from request body
    const { photoId } = await req.json();

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Get photo URL from database
    const photoRes = await pool.query(
      `SELECT photo_url FROM hangar_photos WHERE id = $1 AND listing_id = $2`,
      [photoId, listingId]
    );

    if (photoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photoUrl = photoRes.rows[0].photo_url;

    // Delete from storage
    await deleteFile(photoUrl);

    // Delete from database
    const deleteRes = await pool.query(
      `DELETE FROM hangar_photos WHERE id = $1 AND listing_id = $2 RETURNING id`,
      [photoId, listingId]
    );

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo', details: error?.message },
      { status: 500 }
    );
  }
}
