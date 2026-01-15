import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * GET - List all pending document verifications
 * Admin only endpoint to review uploaded identity documents
 */
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

    // Check if user is admin
    if (decoded.role !== 'MASTER' && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending_review';
    const documentType = url.searchParams.get('document_type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['ud.validation_status = $1'];
    let queryParams: any[] = [status];
    let paramCount = 1;

    if (documentType) {
      paramCount++;
      whereConditions.push(`ud.document_type = $${paramCount}`);
      queryParams.push(documentType);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get documents with user and owner info
    const result = await pool.query(
      `SELECT 
        ud.id,
        ud.user_id,
        ud.owner_id,
        ud.document_type,
        ud.file_url,
        ud.file_size,
        ud.mime_type,
        ud.validation_score,
        ud.validation_status,
        ud.validation_issues,
        ud.validation_suggestions,
        ud.reviewed_by,
        ud.reviewed_at,
        ud.rejection_reason,
        ud.created_at,
        ud.updated_at,
        u.email as user_email,
        u.first_name || ' ' || u.last_name as user_name,
        u.cpf as user_cpf,
        ho.company_name as owner_company,
        ho.cnpj as owner_cnpj,
        ho.verification_status as owner_verification_status,
        reviewer.first_name || ' ' || reviewer.last_name as reviewed_by_name
      FROM user_documents ud
      JOIN users u ON ud.user_id = u.id
      LEFT JOIN hangar_owners ho ON ud.owner_id = ho.id
      LEFT JOIN users reviewer ON ud.reviewed_by = reviewer.id
      WHERE ${whereClause}
      ORDER BY ud.created_at ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM user_documents ud
       WHERE ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      documents: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      stats: {
        pending: await getStatusCount('pending_review'),
        approved: await getStatusCount('approved'),
        rejected: await getStatusCount('rejected'),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get count by status
 */
async function getStatusCount(status: string): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM user_documents WHERE validation_status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting status count:', error);
    return 0;
  }
}
