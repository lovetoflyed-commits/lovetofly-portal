import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { getImageStorage } from '@/config/image-storage';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id, 10);

    // Verify listing exists
    const listingResult = await pool.query(
      'SELECT id, owner_id, image_url FROM hangar_listings WHERE id = $1',
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Use JPG, PNG, or WebP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `hangar-${listingId}-${randomBytes(8).toString('hex')}.${ext}`;

    // Upload using configured storage provider
    const storage = getImageStorage();
    const { url: imageUrl, key } = await storage.uploadHangarImage(
      buffer,
      listingId,
      filename
    );

    // Update database
    const updateResult = await pool.query(
      `UPDATE hangar_listings 
       SET image_url = $1, 
           image_key = $2,
           image_uploaded_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING id, image_url, image_uploaded_at`,
      [imageUrl, key, listingId]
    );

    // Log upload
    await pool.query(
      `INSERT INTO hangar_image_uploads 
       (listing_id, image_url, image_key, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [listingId, imageUrl, key, file.size, file.type, listingResult.rows[0].owner_id]
    ).catch(() => {
      // Table might not exist yet, that's ok
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          listingId: updateResult.rows[0].id,
          imageUrl: updateResult.rows[0].image_url,
          uploadedAt: updateResult.rows[0].image_uploaded_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id, 10);

    const result = await pool.query(
      'SELECT id, image_url FROM hangar_listings WHERE id = $1',
      [listingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { message: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
