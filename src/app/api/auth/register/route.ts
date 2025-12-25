import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // 1. Validação Básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // 2. Verifica se usuário já existe (Email)
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return NextResponse.json({ message: 'Este email já está cadastrado.' }, { status: 409 });
    }

    // 3. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insere no Banco de Dados
    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, birth_date, created_at) 
       VALUES ($1, '', $2, $3, NULL, NOW()) 
       RETURNING id, first_name as name, email`,
      [name, email, hashedPassword]
    );

    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso!', 
        user: newUser.rows[0] 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor.', error: error.message },
      { status: 500 }
    );
  }
}
