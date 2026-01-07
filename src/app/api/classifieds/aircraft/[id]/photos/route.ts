import { NextResponse } from 'next/server';
import pool from '@/config/db';

// POST - Add photos to listing (placeholder - AWS S3 integration needed)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photos } = body; // Array of { url, thumbnail_url, display_order, is_primary }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ message: 'Array de fotos obrigatório' }, { status: 400 });
    }

    // Verify listing exists
    const listingCheck = await pool.query(
      'SELECT id FROM aircraft_listings WHERE id = $1',
      [id]
    );

    if (listingCheck.rows.length === 0) {
      return NextResponse.json({ message: 'Anúncio não encontrado' }, { status: 404 });
    }

    // Insert photos
    const insertedPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const result = await pool.query(
        `INSERT INTO listing_photos (
          listing_type, listing_id, url, thumbnail_url, display_order, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          'aircraft',
          id,
          photo.url,
          photo.thumbnail_url || photo.url,
          photo.display_order || i,
          photo.is_primary || false
        ]
      );
      insertedPhotos.push(result.rows[0]);
    }

    return NextResponse.json(
      { data: insertedPhotos, message: 'Fotos adicionadas com sucesso!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao adicionar fotos:', error);
    return NextResponse.json({ message: 'Erro ao adicionar fotos' }, { status: 500 });
  }
}

// DELETE - Remove photo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photo_id = searchParams.get('photo_id');

    if (!photo_id) {
      return NextResponse.json({ message: 'photo_id obrigatório' }, { status: 400 });
    }

    const result = await pool.query(
      `DELETE FROM listing_photos WHERE id = $1 AND listing_type = 'aircraft' RETURNING *`,
      [photo_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Foto não encontrada' }, { status: 404 });
    }

    // TODO: Delete from S3 storage

    return NextResponse.json({ message: 'Foto removida com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json({ message: 'Erro ao remover foto' }, { status: 500 });
  }
}
