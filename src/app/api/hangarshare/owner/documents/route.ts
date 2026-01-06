import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

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
        document_type,
        file_path,
        file_name,
        verification_status,
        verified_by,
        verification_notes,
        uploaded_at,
        verified_at
      FROM hangar_owner_verification
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

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Tipo de documento não fornecido' }, { status: 400 });
    }

    // Validate file type (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG.' },
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

    const ownerId = ownerResult.rows[0].id;

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', ownerId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1];
    const filename = `${documentType}_${timestamp}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    const relativeFilePath = `/uploads/documents/${ownerId}/${filename}`;

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Check if document already exists for this type
    const existingDoc = await pool.query(
      'SELECT id FROM hangar_owner_verification WHERE owner_id = $1 AND document_type = $2',
      [ownerId, documentType]
    );

    let result;
    if (existingDoc.rows.length > 0) {
      // Update existing document
      result = await pool.query(
        `UPDATE hangar_owner_verification 
         SET file_path = $1, file_name = $2, uploaded_at = NOW(), verification_status = 'pending'
         WHERE owner_id = $3 AND document_type = $4
         RETURNING id`,
        [relativeFilePath, filename, ownerId, documentType]
      );
    } else {
      // Insert new document
      result = await pool.query(
        `INSERT INTO hangar_owner_verification (owner_id, document_type, file_path, file_name, verification_status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [ownerId, documentType, relativeFilePath, filename]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso',
      documentId: result.rows[0].id,
      filePath: relativeFilePath,
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do documento' },
      { status: 500 }
    );
  }
}
