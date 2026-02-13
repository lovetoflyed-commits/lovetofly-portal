import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: Array<string | number> = [];
    let paramIndex = 1;

    if (query) {
      values.push(`%${query}%`);
      whereClauses.push(
        `(LOWER(u.email) ILIKE LOWER($${paramIndex})
          OR LOWER(u.first_name || ' ' || u.last_name) ILIKE LOWER($${paramIndex}))`
      );
      paramIndex += 1;
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const result = await pool.query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.aviation_role,
        u.plan,
        u.created_at,
        u.user_type,
        u.user_type_verified,
        uas.access_level,
        uas.access_reason
      FROM users u
      LEFT JOIN user_access_status uas ON u.id = uas.user_id
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u
       LEFT JOIN user_access_status uas ON u.id = uas.user_id
       ${whereSql}`,
      values
    );

    const users = result.rows.map((u) => ({
      ...u,
      name: [u.first_name, u.last_name].filter(Boolean).join(' '),
    }));

    const total = Number(countResult.rows[0]?.count || 0);

    return NextResponse.json(
      {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      { status: 200 }
    );
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
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [id]
    );

    if (oldUserResult.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const oldUser = oldUserResult.rows[0];

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role, aviation_role, plan, created_at',
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
