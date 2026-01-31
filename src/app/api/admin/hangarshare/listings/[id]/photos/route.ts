import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { uploadFile, deleteFile } from '@/utils/storage';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const listingId = Number(id);
    if (!listingId) {
      return NextResponse.json({ message: 'Listing inválido' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) {
      return NextResponse.json({ message: 'Arquivo não fornecido' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }

    const uploadResult = await uploadFile(file, `hangar-photos/${listingId}`, {
      maxSize,
      allowedTypes,
    });

    const listingRes = await pool.query('SELECT photos FROM hangar_listings WHERE id = $1', [listingId]);
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    const existingPhotos = listingRes.rows[0].photos || [];
    const photosArray = Array.isArray(existingPhotos) ? existingPhotos : JSON.parse(existingPhotos);
    const updatedPhotos = [...photosArray, uploadResult.url];

    await pool.query(
      'UPDATE hangar_listings SET photos = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedPhotos), listingId]
    );

    await logAdminAction(admin.id, 'upload', 'hangar_photo', String(listingId), { url: uploadResult.url }, request);

    return NextResponse.json({ photos: updatedPhotos, url: uploadResult.url });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error uploading hangar photo (admin):', err);
    return NextResponse.json({ message: 'Erro ao fazer upload da foto', error: err }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const listingId = Number(id);
    if (!listingId) {
      return NextResponse.json({ message: 'Listing inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl : null;
    if (!photoUrl) {
      return NextResponse.json({ message: 'URL da foto ausente' }, { status: 400 });
    }

    const listingRes = await pool.query('SELECT photos FROM hangar_listings WHERE id = $1', [listingId]);
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    const existingPhotos = listingRes.rows[0].photos || [];
    const photosArray = Array.isArray(existingPhotos) ? existingPhotos : JSON.parse(existingPhotos);
    const updatedPhotos = photosArray.filter((photo: string) => photo !== photoUrl);

    await pool.query(
      'UPDATE hangar_listings SET photos = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedPhotos), listingId]
    );

    try {
      await deleteFile(photoUrl);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }

    await logAdminAction(admin.id, 'delete', 'hangar_photo', String(listingId), { url: photoUrl }, request);

    return NextResponse.json({ photos: updatedPhotos });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error('Error removing hangar photo (admin):', err);
    return NextResponse.json({ message: 'Erro ao remover foto', error: err }, { status: 500 });
  }
}
