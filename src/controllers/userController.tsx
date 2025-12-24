import { NextResponse } from 'next/server';
import pool from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Função para registrar um novo usuário
export const registerUser = async (req: Request) => {
  try {
    const { name, email, password, anac_code, phone_number } = await req.json();

    // Validação básica
    if (!name || !email || !password || !anac_code) {
      return NextResponse.json(
        { message: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Verifica se o usuário já existe (Email ou CANAC)
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR anac_code = $2',
      [email, anac_code]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      if (existingUser.email === email) {
        return NextResponse.json({ message: 'Email já está em uso.' }, { status: 409 });
      }
      if (existingUser.anac_code === anac_code) {
        return NextResponse.json({ message: 'CANAC já cadastrado.' }, { status: 409 });
      }
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insere no banco de dados
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, anac_code, phone_number) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, anac_code`,
      [name, email, hashedPassword, anac_code, phone_number]
    );

    return NextResponse.json(
      { message: 'Usuário registrado com sucesso!', user: newUser.rows[0] },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
};

// Função para login (Autenticação)
export const loginUser = async (req: Request) => {
  try {
    const { identifier, password } = await req.json(); // identifier pode ser Email ou CANAC

    // Busca usuário pelo Email ou CANAC
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR anac_code = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    const user = result.rows[0];

    // Verifica a senha
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, anac_code: user.anac_code },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' } // Token expira em 1 dia
    );

    // Retorna o token e dados do usuário
    return NextResponse.json(
      { 
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          anac_code: user.anac_code
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
};
