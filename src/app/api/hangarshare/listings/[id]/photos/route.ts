import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

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
