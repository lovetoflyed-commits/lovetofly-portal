import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/career/jobs/[id] - Get single job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const jobId = id;

    const result = await pool.query(
      `SELECT 
        j.*,
        c.company_name,
        c.logo_url,
        c.is_verified as company_verified,
        c.headquarters_city,
        c.headquarters_country,
        c.description as company_description,
        c.average_rating,
        c.review_count
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Vaga não encontrada' },
        { status: 404 }
      );
    }

    // Increment view count
    await pool.query(
      'UPDATE jobs SET view_count = view_count + 1 WHERE id = $1',
      [jobId]
    );

    return NextResponse.json({ job: result.rows[0] });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar vaga' },
      { status: 500 }
    );
  }
}

// PATCH /api/career/jobs/[id] - Update job (business owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    const jobId = id;

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
        `SELECT j.id 
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE j.id = $1 AND c.user_id = $2`,
        [jobId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { message: 'Acesso negado. Você não possui permissão para editar esta vaga.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    
    // Build dynamic update query
    const allowedFields = [
      'title', 'category', 'seniority_level', 'base_location',
      'operating_countries', 'relocation_assistance', 'relocation_amount_usd',
      'required_certifications', 'minimum_flight_hours', 'minimum_pic_hours',
      'minimum_experience_description', 'medical_class_required',
      'visa_sponsorship_available', 'type_ratings_required', 'languages_required',
      'type_rating_training_provided', 'training_duration_weeks', 'training_cost_usd',
      'aircraft_types', 'operation_type', 'domestic_international',
      'etops_required', 'rvsm_required', 'salary_min_usd', 'salary_max_usd',
      'benefits_description', 'signing_bonus_usd', 'seniority_pay_scale',
      'trip_length_avg_days', 'reserve_percentage', 'schedule_type',
      'culture_description', 'application_method', 'expected_review_timeline',
      'contact_email', 'contact_recruiter_name', 'closes_at', 'status'
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

    // Add job ID as last parameter
    values.push(jobId);

    const query = `
      UPDATE jobs 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      message: 'Vaga atualizada com sucesso',
      job: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar vaga' },
      { status: 500 }
    );
  }
}

// DELETE /api/career/jobs/[id] - Delete/close job (business owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    const jobId = id;

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
        `SELECT j.id 
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE j.id = $1 AND c.user_id = $2`,
        [jobId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { message: 'Acesso negado. Você não possui permissão para excluir esta vaga.' },
          { status: 403 }
        );
      }
    }

    // Soft delete - set status to 'archived' instead of actual deletion
    await pool.query(
      `UPDATE jobs 
      SET status = 'archived', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1`,
      [jobId]
    );

    return NextResponse.json({
      message: 'Vaga arquivada com sucesso'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { message: 'Erro ao arquivar vaga' },
      { status: 500 }
    );
  }
}
