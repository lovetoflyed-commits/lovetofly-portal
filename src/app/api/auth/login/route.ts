import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json(); // identifier pode ser Email ou CANAC

    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Preencha todos os campos.' },
        { status: 400 }
      );
    }

    // 1. Busca usuário pelo Email OU pelo CANAC
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR anac_code = $1',
      [identifier]
    );

    const user = result.rows[0];

    // 2. Se usuário não existe
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado.' },
        { status: 401 }
      );
    }

    // 3. Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Senha incorreta.' },
        { status: 401 }
      );
    }

    // 4. Login bem-sucedido!
    // Retorna os dados do usuário (sem a senha) para o frontend usar
    return NextResponse.json(
      {
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          anac_code: user.anac_code,
          plan: user.plan
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

