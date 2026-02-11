import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

// PATCH /api/business/applications/[id] - Update application status (business owner only)
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    const applicationId = params.id;

    // Check if user is admin/master
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    const isAdmin = userCheck.rows.length > 0 && 
                   (userCheck.rows[0].role === 'master' || userCheck.rows[0].role === 'admin');

    // Verify ownership (application belongs to a job owned by this user's company) OR user is admin
    if (!isAdmin) {
      const ownershipCheck = await pool.query(
        `SELECT a.id 
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        WHERE a.id = $1 AND c.user_id = $2`,
        [applicationId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { message: 'Acesso negado. Você não possui permissão para atualizar esta candidatura.' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { message: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    // Valid statuses: pending, reviewing, interview, offer, accepted, rejected
    const validStatuses = ['pending', 'reviewing', 'interview', 'offer', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      );
    }

    // Update application status
    const result = await pool.query(
      `UPDATE applications 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [status, applicationId]
    );

    // TODO: Send email notification to candidate about status change

    return NextResponse.json({
      message: 'Status da candidatura atualizado com sucesso',
      application: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar status da candidatura' },
      { status: 500 }
    );
  }
}
