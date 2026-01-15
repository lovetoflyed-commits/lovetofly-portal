import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';
import {
  validatePhotoSize,
  canAddPhoto,
  getStorageStats,
  checkStorageAlerts,
  recordAlert,
} from '@/utils/storage-monitor';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Verify authentication
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check authorization - verify listing owner
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

    // Check if listing can accept more photos
    const canAdd = await canAddPhoto(listingId);
    if (!canAdd.allowed) {
      return NextResponse.json({ error: canAdd.message }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Get file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // Validate file size (200KB max)
    const sizeCheck = validatePhotoSize(fileSize);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    // Save photo to database
    const photoRes = await pool.query(
      `INSERT INTO hangar_photos (
        listing_id, 
        photo_data, 
        mime_type, 
        file_name, 
        file_size,
        display_order, 
        created_at
      )
       VALUES (
        $1, $2, $3, $4, $5,
        (SELECT COALESCE(MAX(display_order), 0) + 1 FROM hangar_photos WHERE listing_id = $1), 
        NOW()
       )
       RETURNING id, listing_id, file_name, file_size, display_order, created_at`,
      [listingId, buffer, file.type, file.name, fileSize]
    );

    if (photoRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to save photo' },
        { status: 500 }
      );
    }

    // Check storage alerts after upload
    const stats = await getStorageStats();
    const alert = await checkStorageAlerts();
    
    if (alert.shouldAlert) {
      await recordAlert(alert, stats);
      // TODO: Send email notification to admin
      console.log('📊 Storage Alert:', alert.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          id: photoRes.rows[0].id,
          listingId: photoRes.rows[0].listing_id,
          fileName: photoRes.rows[0].file_name,
          fileSize: photoRes.rows[0].file_size,
          displayOrder: photoRes.rows[0].display_order,
          createdAt: photoRes.rows[0].created_at,
        },
        storage: {
          usagePercent: stats.usagePercent,
          remainingPhotos: stats.remainingPhotos,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error?.message },
      { status: 500 }
    );
  }
}
