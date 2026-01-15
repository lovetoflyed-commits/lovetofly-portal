import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { getImageStorage } from '@/config/image-storage';
import { randomBytes } from 'crypto';

/**
 * POST /api/hangarshare/listings/create-with-image
 * 
 * Required step when owner registers a new hangar listing
 * Creates listing AND requires primary image upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract listing data
    const ownerId = parseInt(formData.get('owner_id') as string, 10);
    const hangarNumber = formData.get('hangar_number') as string;
    const aerodromeName = formData.get('aerodrome_name') as string;
    const city = formData.get('city') as string;
    const description = formData.get('description') as string;
    const hourlyRate = parseFloat(formData.get('hourly_rate') as string);
    const dailyRate = parseFloat(formData.get('daily_rate') as string);
    const monthlyRate = parseFloat(formData.get('monthly_rate') as string);

    // Extract image file (REQUIRED)
    const imageFile = formData.get('image') as File;

    // Validate required fields
    if (!ownerId || !hangarNumber || !aerodromeName || !city) {
      return NextResponse.json(
        { message: 'Missing required listing fields' },
        { status: 400 }
      );
    }

    // Validate image is provided
    if (!imageFile) {
      return NextResponse.json(
        {
          message: 'Hangar image is required to register a listing',
          code: 'IMAGE_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Validate image file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          message: 'Invalid image format. Use JPG, PNG, or WebP',
          code: 'INVALID_IMAGE_TYPE',
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          message: 'Image too large. Maximum size is 5MB',
          code: 'IMAGE_TOO_LARGE',
        },
        { status: 400 }
      );
    }

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create hangar listing
      const listingResult = await client.query(
        `INSERT INTO hangar_listings (
          owner_id, hangar_number, aerodrome_name, city, description,
          hourly_rate, daily_rate, monthly_rate, availability_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, owner_id, hangar_number, created_at`,
        [
          ownerId,
          hangarNumber,
          aerodromeName,
          city,
          description,
          hourlyRate || 0,
          dailyRate || 0,
          monthlyRate || 0,
          'pending', // New listings start as pending
        ]
      );

      const listingId = listingResult.rows[0].id;

      // 2. Upload image
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const ext =
        imageFile.type === 'image/png' ? 'png' : imageFile.type === 'image/webp' ? 'webp' : 'jpg';
      const filename = `hangar-${listingId}-${randomBytes(8).toString('hex')}.${ext}`;

      const storage = getImageStorage();
      const { url: imageUrl, key: imageKey } = await storage.uploadHangarImage(
        buffer,
        listingId,
        filename
      );

      // 3. Update listing with image URL
      await client.query(
        `UPDATE hangar_listings 
         SET image_url = $1, image_key = $2, image_uploaded_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [imageUrl, imageKey, listingId]
      );

      // 4. Log image upload
      await client.query(
        `INSERT INTO hangar_image_uploads 
         (listing_id, image_url, image_key, file_size, file_type, uploaded_by, is_primary, storage_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          listingId,
          imageUrl,
          imageKey,
          imageFile.size,
          imageFile.type,
          ownerId,
          true, // Mark as primary image
          process.env.IMAGE_STORAGE_PROVIDER || 'local',
        ]
      );

      // 5. Create notification for admin
      await client.query(
        `INSERT INTO user_notifications 
         (user_id, type, title, message, priority, action_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          1, // Admin user
          'new_listing_pending_approval',
          'New Hangar Listing Submitted',
          `New listing "${hangarNumber}" in ${city} awaiting approval`,
          'high',
          `/admin?section=listings&id=${listingId}`,
          JSON.stringify({ listing_id: listingId, hangar_number: hangarNumber }),
        ]
      ).catch(() => {
        // Notification table might not exist, continue anyway
      });

      await client.query('COMMIT');

      return NextResponse.json(
        {
          success: true,
          message: 'Listing created with image. Pending admin approval.',
          data: {
            listingId,
            hangarNumber: listingResult.rows[0].hangar_number,
            imageUrl,
            status: 'pending',
            createdAt: listingResult.rows[0].created_at,
          },
        },
        { status: 201 }
      );
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating listing with image:', error);
    return NextResponse.json(
      { message: 'Failed to create listing with image' },
      { status: 500 }
    );
  }
}
