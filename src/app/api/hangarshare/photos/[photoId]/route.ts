import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// API to serve photos stored in database
// GET /api/hangarshare/photos/[photoId]

export async function GET(
  req: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const { photoId } = params;

    const result = await pool.query(
      'SELECT photo_data, mime_type, file_name FROM hangar_photos WHERE id = $1',
      [photoId]
    );

    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = result.rows[0];
    const buffer = photo.photo_data;

    // Return image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': photo.mime_type || 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Disposition': `inline; filename="${photo.file_name || 'photo.jpg'}"`,
      },
    });
  } catch (error: any) {
    console.error('Error serving photo:', error);
    return NextResponse.json(
      { error: 'Failed to load photo', details: error?.message },
      { status: 500 }
    );
  }
}
