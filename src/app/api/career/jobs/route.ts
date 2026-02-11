import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/career/jobs - List jobs (public or filtered for business)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Check if request is from authenticated business user
    let businessUserId = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        businessUserId = decoded.id || decoded.userId;
      } catch (err) {
        // Invalid token, proceed as public request
        console.log('Invalid token in jobs GET:', err);
      }
    }

    let query = `
      SELECT 
        j.*,
        c.company_name,
        c.logo_url,
        c.is_verified as company_verified
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'open'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // If business user, show their own jobs (all statuses)
    if (businessUserId) {
      query = `
        SELECT 
          j.*,
          c.company_name,
          c.logo_url,
          c.is_verified as company_verified
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE c.user_id = $${paramIndex}
      `;
      params.push(businessUserId);
      paramIndex++;
    }

    if (category) {
      query += ` AND j.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        j.title ILIKE $${paramIndex} OR 
        j.base_location ILIKE $${paramIndex} OR
        c.company_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY j.posted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      jobs: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        message: 'Erro ao buscar vagas',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/career/jobs - Create new job (business only)
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
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];
    if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas empresas e administradores podem criar vagas.' },
        { status: 403 }
      );
    }

    // Get company ID
    const companyResult = await pool.query(
      'SELECT id, is_verified FROM companies WHERE user_id = $1',
      [userId]
    );

    if (companyResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Empresa não encontrada. Configure seu perfil empresarial primeiro.' },
        { status: 404 }
      );
    }

    const companyId = companyResult.rows[0].id;

    const body = await request.json();
    const {
      title,
      category,
      seniority_level,
      base_location,
      operating_countries,
      relocation_assistance,
      relocation_amount_usd,
      required_certifications,
      minimum_flight_hours,
      minimum_pic_hours,
      minimum_experience_description,
      medical_class_required,
      visa_sponsorship_available,
      type_ratings_required,
      languages_required,
      type_rating_training_provided,
      training_duration_weeks,
      training_cost_usd,
      aircraft_types,
      operation_type,
      domestic_international,
      etops_required,
      rvsm_required,
      salary_min_usd,
      salary_max_usd,
      benefits_description,
      signing_bonus_usd,
      seniority_pay_scale,
      trip_length_avg_days,
      reserve_percentage,
      schedule_type,
      culture_description,
      application_method,
      expected_review_timeline,
      contact_email,
      contact_recruiter_name,
      closes_at
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { message: 'Título e categoria são obrigatórios' },
        { status: 400 }
      );
    }

    // Insert job
    const insertResult = await pool.query(
      `INSERT INTO jobs (
        company_id, title, category, seniority_level, base_location, 
        operating_countries, relocation_assistance, relocation_amount_usd,
        required_certifications, minimum_flight_hours, minimum_pic_hours,
        minimum_experience_description, medical_class_required,
        visa_sponsorship_available, type_ratings_required, languages_required,
        type_rating_training_provided, training_duration_weeks, training_cost_usd,
        aircraft_types, operation_type, domestic_international,
        etops_required, rvsm_required, salary_min_usd, salary_max_usd,
        benefits_description, signing_bonus_usd, seniority_pay_scale,
        trip_length_avg_days, reserve_percentage, schedule_type,
        culture_description, application_method, expected_review_timeline,
        contact_email, contact_recruiter_name, closes_at, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, 'open'
      ) RETURNING *`,
      [
        companyId, title, category, seniority_level, base_location,
        operating_countries, relocation_assistance, relocation_amount_usd,
        required_certifications, minimum_flight_hours, minimum_pic_hours,
        minimum_experience_description, medical_class_required,
        visa_sponsorship_available, type_ratings_required, languages_required,
        type_rating_training_provided, training_duration_weeks, training_cost_usd,
        aircraft_types, operation_type, domestic_international,
        etops_required, rvsm_required, salary_min_usd, salary_max_usd,
        benefits_description, signing_bonus_usd, seniority_pay_scale,
        trip_length_avg_days, reserve_percentage, schedule_type,
        culture_description, application_method, expected_review_timeline,
        contact_email, contact_recruiter_name, closes_at
      ]
    );

    return NextResponse.json(
      {
        message: 'Vaga publicada com sucesso',
        job: insertResult.rows[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating job:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        message: 'Erro ao criar vaga',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
