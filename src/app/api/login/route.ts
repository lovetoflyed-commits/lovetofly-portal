import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('--- TENTATIVA DE LOGIN ---');
    console.log('Email recebido:', email);

    // 1. Busca o usuário pelo email (Forçando minúsculas para evitar erro de digitação)
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = result.rows[0];

    // 2. Se não achar o usuário
    if (!user) {
      console.log('ERRO: Usuário não encontrado no banco de dados.');
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 401 }
      );
    }

    console.log('Usuário encontrado:', user.first_name, user.last_name);

    // 3. Compara a senha enviada com o hash do banco
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    console.log('Senha confere?', isPasswordValid ? 'SIM' : 'NÃO');

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta.' },
        { status: 401 }
      );
    }

    // 4. Prepara os dados para devolver
    const token = 'token-de-acesso-' + user.id + '-' + Date.now();

    const userData = {
      id: user.id,
      name: user.first_name + ' ' + user.last_name,
      email: user.email,
      role: user.aviation_role
    };

    return NextResponse.json(
      { 
        message: 'Login realizado com sucesso!',
        user: userData,
        token: token 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('ERRO CRÍTICO NO LOGIN:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
