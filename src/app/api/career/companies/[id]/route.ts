import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/career/companies/[id] - Get single company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    const result = await pool.query(
      `SELECT 
        c.*,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) as open_jobs
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      WHERE c.id = $1
      GROUP BY c.id`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company: result.rows[0] });

  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar empresa' },
      { status: 500 }
    );
  }
}

// PATCH /api/career/companies/[id] - Update company (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }
    
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.error('No user ID in token');
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }

    const companyId = params.id;

    // Check if user is admin/master
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    const isAdmin = userCheck.rows.length > 0 && 
                   (userCheck.rows[0].role === 'master' || userCheck.rows[0].role === 'admin');

    // Verify ownership OR user is admin
    if (!isAdmin) {
      const ownershipCheck = await pool.query(
        'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
        [companyId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { message: 'Acesso negado. Você não possui permissão para editar esta empresa.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    
    // Build dynamic update query
    const allowedFields = [
      'legal_name', 'company_name', 'logo_url', 'website',
      'headquarters_city', 'headquarters_country', 'company_size', 'industry',
      'description', 'culture_statement', 'annual_hiring_volume',
      'faa_certificate_number', 'insurance_verified', 'safety_record_public',
      'hiring_status'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add company ID as last parameter
    values.push(companyId);

    const query = `
      UPDATE companies 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      message: 'Empresa atualizada com sucesso',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar empresa' },
      { status: 500 }
    );
  }
}
