import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/career/companies - List companies (public) or get own company (business user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    
    // Check if authenticated business user
    let businessUserId = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        businessUserId = decoded.id;
      } catch (err) {
        // Invalid token, proceed as public request
        console.log('Invalid token in companies GET:', err);
      }
    }

    let query = `
      SELECT 
        c.*,
        COUNT(j.id) as open_jobs_count
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id AND j.status = 'open'
    `;

    const params: any[] = [];
    let paramIndex = 1;
    const whereClauses: string[] = [];

    // Note: user_id filtering removed due to schema inconsistencies
    // Business users should see all companies for now
    // TODO: Re-add user_id filtering once schema is consistent

    if (search) {
      whereClauses.push(`(c.company_name ILIKE $${paramIndex} OR c.legal_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (industry) {
      whereClauses.push(`c.industry = $${paramIndex}`);
      params.push(industry);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` GROUP BY c.id ORDER BY c.company_name ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      companies: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        message: 'Erro ao buscar empresas',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/career/companies - Create company profile (business user only)
export async function POST(request: NextRequest) {
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

    // Verify user is business type or admin
    const userCheck = await pool.query(
      'SELECT user_type, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas empresas e administradores podem criar perfis de empresa.' },
        { status: 403 }
      );
    }

    // Check if user already has a company
    const existingCompany = await pool.query(
      'SELECT id FROM companies WHERE user_id = $1',
      [userId]
    );

    if (existingCompany.rows.length > 0) {
      return NextResponse.json(
        { message: 'Você já possui um perfil de empresa' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      legal_name,
      company_name,
      logo_url,
      website,
      headquarters_city,
      headquarters_country,
      company_size,
      industry,
      description,
      culture_statement,
      annual_hiring_volume,
      faa_certificate_number,
      insurance_verified,
      safety_record_public
    } = body;

    // Validate required fields
    if (!legal_name || !company_name) {
      return NextResponse.json(
        { message: 'Nome legal e nome da empresa são obrigatórios' },
        { status: 400 }
      );
    }

    // Insert company
    const insertResult = await pool.query(
      `INSERT INTO companies (
        user_id, legal_name, company_name, logo_url, website,
        headquarters_city, headquarters_country, company_size, industry,
        description, culture_statement, annual_hiring_volume,
        faa_certificate_number, insurance_verified, safety_record_public
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *`,
      [
        userId, legal_name, company_name, logo_url, website,
        headquarters_city, headquarters_country, company_size, industry,
        description, culture_statement, annual_hiring_volume,
        faa_certificate_number, insurance_verified, safety_record_public
      ]
    );

    return NextResponse.json(
      {
        message: 'Perfil da empresa criado com sucesso',
        company: insertResult.rows[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating company:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        message: 'Erro ao criar perfil da empresa',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
