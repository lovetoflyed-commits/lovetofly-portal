import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id, 10);

    // Get listing
    const listingResult = await pool.query(
      'SELECT id, hangar_number, image_url FROM hangar_listings WHERE id = $1',
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    // Get all images for listing
    const imagesResult = await pool.query(
      `SELECT 
        id,
        image_url,
        image_key,
        file_size,
        file_type,
        is_primary,
        storage_provider,
        created_at,
        uploaded_by
      FROM hangar_image_uploads
      WHERE listing_id = $1
      ORDER BY is_primary DESC, created_at DESC`,
      [listingId]
    );

    const primaryImage = imagesResult.rows.find((img) => img.is_primary);
    const secondaryImages = imagesResult.rows.filter((img) => !img.is_primary);

    return NextResponse.json(
      {
        success: true,
        data: {
          listing: listingResult.rows[0],
          images: {
            primary: primaryImage || null,
            secondary: secondaryImages,
            total: imagesResult.rows.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching listing images:', error);
    return NextResponse.json(
      { message: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
