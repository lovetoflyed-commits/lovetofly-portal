import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * POST - Approve a document
 * Updates document status and owner verification status if all documents approved
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
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

    // Check if user is admin
    if (decoded.role !== 'MASTER' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const userAgent = request.headers.get('user-agent') || null;

    const body = await request.json();
    const { notes } = body;

    // Get document info
    const docResult = await pool.query(
      `SELECT id, user_id, owner_id, document_type, validation_status 
       FROM user_documents 
       WHERE id = $1`,
      [documentId]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    const document = docResult.rows[0];

    if (document.validation_status === 'approved') {
      return NextResponse.json(
        { error: 'Documento já foi aprovado' },
        { status: 400 }
      );
    }

    // Update document status
    await pool.query(
      `UPDATE user_documents 
       SET validation_status = 'approved',
           reviewed_by = $1,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [decoded.userId, documentId]
    );

    // Check if all documents for this owner are approved
    if (document.owner_id) {
      const ownerDocsResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN validation_status = 'approved' THEN 1 END) as approved
         FROM user_documents
         WHERE owner_id = $1`,
        [document.owner_id]
      );

      const { total, approved } = ownerDocsResult.rows[0];

      // If all documents are approved, update owner verification status
      if (parseInt(total) === parseInt(approved)) {
        await pool.query(
          `UPDATE hangar_owners 
           SET verification_status = 'verified',
               updated_at = NOW()
           WHERE id = $1`,
          [document.owner_id]
        );

        console.log(`[VERIFICATION COMPLETE] Owner ${document.owner_id} fully verified`);
      }
    }

    if (document.user_id) {
      await pool.query(
        `INSERT INTO user_activity_log
          (user_id, activity_type, activity_category, description, details, target_type, target_id, status, ip_address, user_agent)
         VALUES ($1, $2, 'admin', $3, $4, 'document', $5, 'success', $6, $7)`,
        [
          document.user_id,
          'admin_document_approve',
          'Admin aprovou documento',
          JSON.stringify({
            documentId: document.id,
            documentType: document.document_type,
            ownerId: document.owner_id || null,
            notes: notes || null,
            adminId: decoded.userId
          }),
          document.id,
          ipAddress,
          userAgent
        ]
      );
    }

    // TODO: Send email notification to user
    console.log(`[DOCUMENT APPROVED] Document ${documentId} approved by admin ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Documento aprovado com sucesso',
      document: {
        id: documentId,
        status: 'approved',
        reviewedBy: decoded.userId,
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error approving document:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar documento' },
      { status: 500 }
    );
  }
}
