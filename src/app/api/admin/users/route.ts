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
