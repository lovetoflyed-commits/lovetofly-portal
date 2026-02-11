import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// GET /api/career/jobs/[id]/applications - List applications for a specific job (business owner only)
export async function GET(
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    const jobId = params.id;

    // Check if user is admin/master
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    const isAdmin = userCheck.rows.length > 0 && 
                   (userCheck.rows[0].role === 'master' || userCheck.rows[0].role === 'admin');

    // Verify ownership of the job OR user is admin
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
          { message: 'Acesso negado. Você não possui permissão para ver as candidaturas desta vaga.' },
          { status: 403 }
        );
      }
    }

    // Get all applications for this job with candidate details
    const result = await pool.query(
      `SELECT 
        a.id,
        a.job_id,
        a.candidate_id,
        a.status,
        a.cover_letter,
        a.video_intro_url,
        a.expected_start_date,
        a.salary_expectations_min,
        a.salary_expectations_max,
        a.relocation_willing,
        a.applied_at,
        a.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        cp.resume_url,
        cp.total_flight_hours,
        cp.pic_hours,
        cp.certifications,
        cp.type_ratings,
        cp.languages,
        cp.availability_date
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      LEFT JOIN career_profiles cp ON cp.user_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.applied_at DESC`,
      [jobId]
    );

    return NextResponse.json({
      applications: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar candidaturas' },
      { status: 500 }
    );
  }
}
