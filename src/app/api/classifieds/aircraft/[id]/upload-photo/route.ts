import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Upload photo to aircraft listing
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id, 10);

    // Verify listing exists
    const listingCheck = await pool.query(
      'SELECT id FROM aircraft_listings WHERE id = $1',
      [listingId]
    );

    if (listingCheck.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    // Check photo count limit (max 10 photos per listing)
    const photoCount = await pool.query(
      `SELECT COUNT(*) as count FROM classified_photos 
       WHERE listing_type = 'aircraft' AND listing_id = $1`,
      [listingId]
    );

    if (parseInt(photoCount.rows[0].count) >= 10) {
      return NextResponse.json(
        { message: 'Limite de 10 fotos por anúncio atingido' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Get file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // Validate file size (200KB max)
    const maxSize = 200 * 1024; // 200KB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { message: `Arquivo muito grande. Tamanho máximo: 200KB (atual: ${Math.round(fileSize / 1024)}KB)` },
        { status: 400 }
      );
    }

    // Get next display order
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 as next_order 
       FROM classified_photos 
       WHERE listing_type = 'aircraft' AND listing_id = $1`,
      [listingId]
    );
    const displayOrder = orderResult.rows[0].next_order;

    // Check if this should be primary (first photo)
    const isPrimary = photoCount.rows[0].count === '0';

    // Save photo to database
    const photoRes = await pool.query(
      `INSERT INTO classified_photos (
        listing_type,
        listing_id,
        photo_data,
        mime_type,
        file_name,
        file_size,
        display_order,
        is_primary,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, listing_type, listing_id, file_name, file_size, display_order, is_primary, created_at`,
      [
        'aircraft',
        listingId,
        buffer,
        file.type,
        file.name,
        fileSize,
        displayOrder,
        isPrimary
      ]
    );

    if (photoRes.rows.length === 0) {
      return NextResponse.json(
        { message: 'Falha ao salvar foto' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Foto enviada com sucesso',
        photo: {
          id: photoRes.rows[0].id,
          listingType: photoRes.rows[0].listing_type,
          listingId: photoRes.rows[0].listing_id,
          fileName: photoRes.rows[0].file_name,
          fileSize: photoRes.rows[0].file_size,
          displayOrder: photoRes.rows[0].display_order,
          isPrimary: photoRes.rows[0].is_primary,
          createdAt: photoRes.rows[0].created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao enviar foto:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar foto', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve photo binary data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      // Return all photos metadata (no binary)
      const photos = await pool.query(
        `SELECT id, file_name, file_size, mime_type, display_order, is_primary, caption, created_at
         FROM classified_photos
         WHERE listing_type = 'aircraft' AND listing_id = $1
         ORDER BY display_order, is_primary DESC`,
        [listingId]
      );

      return NextResponse.json({ photos: photos.rows }, { status: 200 });
    }

    // Return specific photo binary
    const photo = await pool.query(
      `SELECT photo_data, mime_type, file_name
       FROM classified_photos
       WHERE id = $1 AND listing_type = 'aircraft' AND listing_id = $2`,
      [photoId, listingId]
    );

    if (photo.rows.length === 0) {
      return NextResponse.json({ message: 'Foto não encontrada' }, { status: 404 });
    }

    const photoData = photo.rows[0].photo_data;
    const mimeType = photo.rows[0].mime_type || 'image/jpeg';

    return new NextResponse(photoData, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar foto:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar foto' },
      { status: 500 }
    );
  }
}

// DELETE - Remove photo
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ message: 'photoId obrigatório' }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM classified_photos 
       WHERE id = $1 AND listing_type = 'aircraft' 
       RETURNING id`,
      [photoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Foto não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Foto removida com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json({ message: 'Erro ao remover foto' }, { status: 500 });
  }
}
