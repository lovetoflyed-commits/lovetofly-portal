import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/utils/storage';

interface JWTPayload {
  userId: number;
  email: string;
}

// GET - Fetch owner's documents
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Get owner's documents
    const result = await pool.query(
      `SELECT 
        id,
        owner_id,
        listing_id,
        document_type,
        document_name,
        file_path,
        file_size,
        mime_type,
        upload_status,
        uploaded_at,
        verified_by,
        verified_at,
        rejection_reason,
        expires_at,
        notes,
        created_at,
        updated_at
      FROM owner_documents
      WHERE owner_id = (SELECT id FROM hangar_owners WHERE user_id = $1)
      ORDER BY uploaded_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

// POST - Upload document
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JWTPayload;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const documentType = formData.get('documentType') as string;
    const listingIdRaw = formData.get('listingId');
    const expiresAtRaw = formData.get('expiresAt');
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Tipo de documento não fornecido' }, { status: 400 });
    }

    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    // Get owner ID
    const ownerResult = await pool.query(
      'SELECT id FROM hangar_owners WHERE user_id = $1',
      [decoded.userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Perfil de proprietário não encontrado' },
        { status: 404 }
      );
    }

    const ownerId = ownerResult.rows[0].id as number;
    const listingId = listingIdRaw ? Number(listingIdRaw) : null;
    const expiresAt = expiresAtRaw ? new Date(String(expiresAtRaw)) : null;

    const uploadResult = await uploadFile(file, `owner-documents/${ownerId}`, {
      maxSize,
      allowedTypes,
    });

    // Check if document already exists for this type
    const existingDoc = await pool.query(
      `SELECT id FROM owner_documents 
       WHERE owner_id = $1 
         AND document_type = $2
         AND listing_id IS NOT DISTINCT FROM $3`,
      [ownerId, documentType, listingId]
    );

    let result;
    if (existingDoc.rows.length > 0) {
      // Update existing document
      result = await pool.query(
        `UPDATE owner_documents 
         SET file_path = $1,
             document_name = $2,
             file_size = $3,
             mime_type = $4,
             uploaded_at = NOW(),
             upload_status = 'uploaded',
             verified_by = NULL,
             verified_at = NULL,
             rejection_reason = NULL,
             expires_at = $5,
             notes = $6
         WHERE owner_id = $7 AND document_type = $8 AND listing_id IS NOT DISTINCT FROM $9
         RETURNING id`,
        [
          uploadResult.url,
          file.name,
          uploadResult.size,
          file.type,
          expiresAt,
          notes,
          ownerId,
          documentType,
          listingId,
        ]
      );
    } else {
      // Insert new document
      result = await pool.query(
        `INSERT INTO owner_documents (
          owner_id,
          listing_id,
          document_type,
          document_name,
          file_path,
          file_size,
          mime_type,
          upload_status,
          uploaded_at,
          expires_at,
          notes
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded', NOW(), $8, $9)
         RETURNING id`,
        [
          ownerId,
          listingId,
          documentType,
          file.name,
          uploadResult.url,
          uploadResult.size,
          file.type,
          expiresAt,
          notes,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso',
      documentId: result.rows[0].id,
      filePath: uploadResult.url,
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do documento' },
      { status: 500 }
    );
  }
}
