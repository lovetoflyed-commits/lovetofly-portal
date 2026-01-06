// API Route: Upload photos for a hangar listing
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Verify ownership
    const ownerCheck = await pool.query(
      `SELECT hl.id 
       FROM hangar_listings hl
       JOIN hangar_owners ho ON hl.owner_id = ho.id
       WHERE hl.id = $1 AND ho.user_id = $2`,
      [listingId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Forbidden - You can only upload photos to your own listings' },
        { status: 403 }
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    const isPrimary = formData.get('isPrimary') === 'true';

    if (files.length === 0) {
      return NextResponse.json(
        { message: 'No photos provided' },
        { status: 400 }
      );
    }

    // 4. Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { message: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: `File ${file.name} has invalid type. Only JPG, PNG, WebP allowed` },
          { status: 400 }
        );
      }
    }

    // 5. Save files to disk (local storage for now)
    // TODO: Replace with AWS S3 or Vercel Blob for production
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hangars', listingId);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    const uploadedPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      await writeFile(filepath, buffer);

      // Public URL
      const photoUrl = `/uploads/hangars/${listingId}/${filename}`;

      // Get next display order
      const orderResult = await pool.query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM hangar_photos WHERE hangar_id = $1',
        [listingId]
      );
      const displayOrder = orderResult.rows[0].next_order;

      // If this is first photo or marked as primary, unset other primary photos
      if (isPrimary || i === 0) {
        await pool.query(
          'UPDATE hangar_photos SET is_primary = false WHERE hangar_id = $1',
          [listingId]
        );
      }

      // Insert into database
      const result = await pool.query(
        `INSERT INTO hangar_photos (hangar_id, photo_url, is_primary, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, photo_url, is_primary, display_order`,
        [listingId, photoUrl, isPrimary || i === 0, displayOrder]
      );

      uploadedPhotos.push(result.rows[0]);
    }

    return NextResponse.json({
      success: true,
      message: `${files.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos,
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    
    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ message: 'Photo ID required' }, { status: 400 });
    }

    // Verify ownership and delete
    const result = await pool.query(
      `DELETE FROM hangar_photos
       WHERE id = $1
       AND hangar_id = $2
       AND hangar_id IN (
         SELECT hl.id FROM hangar_listings hl
         JOIN hangar_owners ho ON hl.owner_id = ho.id
         WHERE ho.user_id = $3
       )
       RETURNING photo_url`,
      [photoId, listingId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Photo not found or unauthorized' }, { status: 404 });
    }

    // TODO: Delete physical file from storage

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
