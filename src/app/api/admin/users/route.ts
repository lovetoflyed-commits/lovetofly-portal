import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, aviation_role, plan, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
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

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
    }

    const body = await request.json();
    const { id, role } = body || {};

    if (!id || !role) {
      return NextResponse.json({ message: 'id e role são obrigatórios' }, { status: 400 });
    }

    const allowedRoles = ['master', 'admin', 'staff', 'partner', 'owner', 'user'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Role inválido' }, { status: 400 });
    }

    // Get old user data for logging
    const oldUserResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (oldUserResult.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const oldUser = oldUserResult.rows[0];

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, first_name, last_name, email, role, aviation_role, plan, created_at',
      [role, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = result.rows[0];
    
    // Log role change
    await logAdminAction(
      adminUser.id,
      'role_change',
      'user',
      id,
      `Changed role for ${oldUser.email} from ${oldUser.role} to ${role}`,
      request,
      { role: oldUser.role },
      { role: role }
    );

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
