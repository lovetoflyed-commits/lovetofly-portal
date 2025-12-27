import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Busca o usuário pelo Email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // 2. Se não achar o usuário
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // 3. Verifica a senha (compara a senha digitada com o hash do banco)
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 4. Gera o Token de Acesso (JWT)
    // Se você não tiver uma chave secreta no .env, use 'segredo-padrao' temporariamente
    const secret = process.env.JWT_SECRET || 'segredo-super-secreto-lovetofly';

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.first_name },
      secret,
      { expiresIn: '1d' } // Token expira em 1 dia
    );

    // 5. Retorna sucesso e o token
    const response = NextResponse.json({ 
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        role: user.aviation_role
      }
    });

    // Define o cookie no navegador (HttpOnly para segurança)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Erro no Login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
