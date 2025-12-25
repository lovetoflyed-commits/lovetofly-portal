import { NextResponse } from 'next/server';
import pool from '../config/db'; // Certifique-se de que este caminho está correto
import bcrypt from 'bcrypt'; // Ou 'bcryptjs', certifique-se de usar o mesmo em todo lugar
import jwt from 'jsonwebtoken';

// Função para registrar um novo usuário
export const registerUser = async (req: Request) => {
  try {
    // Desestrutura todos os campos do corpo da requisição, conforme o formulário
    const {
      firstName,
      lastName,
      birthDate,
      cpf,
      email,
      password,
      mobilePhone,
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
      addressCountry,
      aviationRole,
      aviationRoleOther,
      socialMedia,
      newsletter,
      terms,
    } = await req.json();

    // Validação básica para campos obrigatórios
    if (!firstName || !lastName || !email || !password || !cpf || !birthDate || !mobilePhone || !addressStreet || !addressNumber || !addressNeighborhood || !addressCity || !addressState || !addressZip || !addressCountry || !aviationRole || !terms) {
      return NextResponse.json(
        { message: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Verifica se o email ou CPF já estão em uso (conforme as chaves UNIQUE do seu DB)
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR cpf = $2',
      [email, cpf]
    );

    if (userCheck.rows.length > 0) {
      if (userCheck.rows[0].email === email) {
        return NextResponse.json({ message: 'Email já está em uso.' }, { status: 409 });
      }
      if (userCheck.rows[0].cpf === cpf) {
        return NextResponse.json({ message: 'CPF já está em uso.' }, { status: 409 });
      }
    }

    // Criptografa a senha para 'password_hash'
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt); // Usando passwordHash

    // Insere no banco de dados com os nomes de colunas EXATOS do seu esquema
    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, birth_date, cpf, email, password_hash, mobile_phone,
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, address_country,
        aviation_role, aviation_role_other, social_media, newsletter_opt_in, terms_agreed
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id, first_name, email`,
      [
        firstName, lastName, birthDate, cpf, email, passwordHash, mobilePhone,
        addressStreet, addressNumber, addressComplement, addressNeighborhood,
        addressCity, addressState, addressZip, addressCountry,
        aviationRole, aviationRoleOther, socialMedia, newsletter, terms
      ]
    );

    return NextResponse.json(
      { message: 'Cadastro realizado com sucesso!', user: newUser.rows[0] },
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
    const { email, password } = await req.json(); // Use email directly

    // Busca usuário apenas pelo Email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    const user = result.rows[0];

    // Verifica a senha usando 'password_hash'
    const isMatch = await bcrypt.compare(password, user.password_hash); // Usando user.password_hash

    if (!isMatch) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, firstName: user.first_name }, // Incluindo first_name no token
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Retorna o token e dados do usuário
    return NextResponse.json(
      {
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          firstName: user.first_name, // Retornando first_name
          email: user.email
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
