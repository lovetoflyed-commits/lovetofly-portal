import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, aviation_role, plan, created_at FROM users ORDER BY created_at DESC'
    );
    // Map to include full name
    const users = result.rows.map(u => ({
      ...u,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ')
    }));
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, role } = body || {};

    if (!id || !role) {
      return NextResponse.json({ message: 'id e role são obrigatórios' }, { status: 400 });
    }

    const allowedRoles = ['master', 'admin', 'staff', 'partner', 'owner', 'user'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Role inválido' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role, aviation_role, plan, created_at',
      [role, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = result.rows[0];
    const payload = {
      ...user,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ')
    };

    return NextResponse.json({ user: payload }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error);
    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
