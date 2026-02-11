import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid auth header');
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
    
    const userId = decoded.id;

    if (!userId) {
      console.error('No user ID in decoded token');
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
        { message: 'Acesso negado. Apenas empresas e administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }

    // Get company info from business_users table
    const companyResult = await pool.query(
      `SELECT 
        bu.id,
        bu.business_name as company_name,
        bu.is_verified,
        bu.company_id
      FROM business_users bu
      WHERE bu.user_id = $1`,
      [userId]
    );

    if (companyResult.rows.length === 0) {
      return NextResponse.json({
        stats: {
          activeJobs: 0,
          totalApplications: 0,
          pendingReview: 0,
          totalViews: 0,
          companyName: 'Empresa não configurada',
          companyVerified: false,
          hasCompany: false
        }
      });
    }

    const company = companyResult.rows[0];
    const companyId = company.company_id;

    if (!companyId) {
      return NextResponse.json({
        stats: {
          activeJobs: 0,
          totalApplications: 0,
          pendingReview: 0,
          totalViews: 0,
          companyName: company.company_name || 'Empresa não configurada',
          companyVerified: company.is_verified || false,
          hasCompany: false
        }
      });
    }

    // Get active jobs count
    let activeJobsCount = 0;
    try {
      const activeJobsResult = await pool.query(
        `SELECT COUNT(*) as count 
        FROM jobs 
        WHERE company_id = $1 AND status = 'open'`,
        [companyId]
      );
      activeJobsCount = parseInt(activeJobsResult.rows[0].count) || 0;
    } catch (err) {
      console.error('Error fetching active jobs count:', err);
      activeJobsCount = 0;
    }

    // Get total applications count
    let totalApplicationsCount = 0;
    try {
      const totalApplicationsResult = await pool.query(
        `SELECT COUNT(*) as count 
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = $1`,
        [companyId]
      );
      totalApplicationsCount = parseInt(totalApplicationsResult.rows[0].count) || 0;
    } catch (err) {
      console.error('Error fetching applications count (table may not exist):', err);
      totalApplicationsCount = 0;
    }

    // Get pending review applications count (applied or screening status)
    let pendingReviewCount = 0;
    try {
      const pendingReviewResult = await pool.query(
        `SELECT COUNT(*) as count 
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = $1 AND a.status IN ('applied', 'screening')`,
        [companyId]
      );
      pendingReviewCount = parseInt(pendingReviewResult.rows[0].count) || 0;
    } catch (err) {
      console.error('Error fetching pending review count (table may not exist):', err);
      pendingReviewCount = 0;
    }

    // Get total views across all jobs
    let totalViewsCount = 0;
    try {
      const totalViewsResult = await pool.query(
        `SELECT COALESCE(SUM(view_count), 0) as total 
        FROM jobs 
        WHERE company_id = $1`,
        [companyId]
      );
      totalViewsCount = parseInt(totalViewsResult.rows[0].total) || 0;
    } catch (err) {
      console.error('Error fetching total views:', err);
      totalViewsCount = 0;
    }

    const stats = {
      activeJobs: activeJobsCount,
      totalApplications: totalApplicationsCount,
      pendingReview: pendingReviewCount,
      totalViews: totalViewsCount,
      companyName: company.company_name,
      companyVerified: company.is_verified,
      hasCompany: true
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching business dashboard stats:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        message: 'Erro ao buscar estatísticas do painel',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
