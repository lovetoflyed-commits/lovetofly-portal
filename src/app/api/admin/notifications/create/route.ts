import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || '';
    let userId: string;
    let userRole: string;

    try {
      const decoded = jwt.verify(token, secret) as any;
      userId = decoded.userId;
      userRole = decoded.role;
    } catch (err) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (userRole !== 'admin' && userRole !== 'master') {
      return NextResponse.json(
        { error: 'Acesso negado - apenas admins podem criar notificações' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, title, message, type, actionUrl, actionLabel } = body;

    if (!targetUserId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: targetUserId, title, message, type' },
        { status: 400 }
      );
    }

    // Insert notification
    const result = await pool.query(
      `INSERT INTO user_notifications 
       (user_id, title, message, type, action_url, action_label) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [targetUserId, title, message, type, actionUrl || null, actionLabel || null]
    );

    return NextResponse.json(
      { message: 'Notificação criada com sucesso', notification: result.rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    );
  }
}
