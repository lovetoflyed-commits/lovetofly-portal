import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    const result = await pool.query(
      `SELECT 
        id, 
        listing_id,
        photo_url,
        file_name, 
        file_size, 
        mime_type,
        display_order, 
        is_primary,
        created_at
       FROM hangar_photos 
       WHERE listing_id = $1 
       ORDER BY display_order ASC`,
      [listingId]
    );

    // Return photo metadata with URLs to fetch actual images
    const photos = result.rows.map((photo) => ({
      id: photo.id,
      listingId: photo.listing_id,
      fileName: photo.file_name,
      fileSize: photo.file_size,
      mimeType: photo.mime_type,
      displayOrder: photo.display_order,
      isPrimary: photo.is_primary,
      createdAt: photo.created_at,
      // URL to fetch the actual image (DB stored or legacy URL)
      url: photo.photo_data ? `/api/hangarshare/photos/${photo.id}` : photo.photo_url,
    }));

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length,
    });
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id: listingId } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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

    const body = await req.json();
    const order = Array.isArray(body.order) ? body.order : null;
    const primaryPhotoId = body.primaryPhotoId ?? null;

    if (!order || order.length === 0) {
      return NextResponse.json({ error: 'Order is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    for (let i = 0; i < order.length; i += 1) {
      await client.query(
        `UPDATE hangar_photos
         SET display_order = $1
         WHERE id = $2 AND listing_id = $3`,
        [i, order[i], listingId]
      );
    }

    const nextPrimaryId = primaryPhotoId || order[0];
    if (nextPrimaryId) {
      await client.query(
        'UPDATE hangar_photos SET is_primary = false WHERE listing_id = $1',
        [listingId]
      );
      await client.query(
        'UPDATE hangar_photos SET is_primary = true WHERE id = $1 AND listing_id = $2',
        [nextPrimaryId, listingId]
      );
    }

    const refreshed = await client.query(
      `SELECT id, listing_id, photo_url, file_name, file_size, mime_type, display_order, is_primary, created_at
       FROM hangar_photos
       WHERE listing_id = $1
       ORDER BY display_order ASC`,
      [listingId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      photos: refreshed.rows,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error reordering photos:', error);
    return NextResponse.json(
      { error: 'Failed to reorder photos', details: error?.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
