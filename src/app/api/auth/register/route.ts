import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, anac_code } = await request.json();

    // 1. Validação Básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // 2. Verifica se usuário já existe (Email ou CANAC)
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR anac_code = $2',
      [email, anac_code]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      if (existingUser.email === email) {
        return NextResponse.json({ message: 'Este email já está cadastrado.' }, { status: 409 });
      }
      if (existingUser.anac_code === anac_code) {
        return NextResponse.json({ message: 'Este CANAC já está cadastrado.' }, { status: 409 });
      }
    }

    // 3. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insere no Banco de Dados
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, anac_code, plan, created_at) 
       VALUES ($1, $2, $3, $4, 'standard', NOW()) 
       RETURNING id, name, email, plan`,
      [name, email, hashedPassword, anac_code]
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
