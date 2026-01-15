import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * POST - Reject a document
 * Updates document status with rejection reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    // Check if user is admin
    if (decoded.role !== 'MASTER' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const { documentId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      );
    }

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

    if (document.validation_status === 'rejected') {
      return NextResponse.json(
        { error: 'Documento já foi rejeitado' },
        { status: 400 }
      );
    }

    // Update document status
    await pool.query(
      `UPDATE user_documents 
       SET validation_status = 'rejected',
           rejection_reason = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [reason, decoded.userId, documentId]
    );

    // Update owner verification status to rejected if applicable
    if (document.owner_id) {
      await pool.query(
        `UPDATE hangar_owners 
         SET verification_status = 'rejected',
             updated_at = NOW()
         WHERE id = $1`,
        [document.owner_id]
      );
    }

    // TODO: Send email notification to user with rejection reason
    console.log(`[DOCUMENT REJECTED] Document ${documentId} rejected by admin ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Documento rejeitado',
      document: {
        id: documentId,
        status: 'rejected',
        reason,
        reviewedBy: decoded.userId,
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error rejecting document:', error);
    return NextResponse.json(
      { error: 'Erro ao rejeitar documento' },
      { status: 500 }
    );
  }
}
