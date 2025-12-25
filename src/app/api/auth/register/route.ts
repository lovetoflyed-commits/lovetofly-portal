import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      cpf,
      birthDate,
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
      newsletter,
      terms,
    } = body;

    // 1. Validação Básica
    if (!firstName || !lastName || !email || !password || !cpf || !birthDate) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    if (!terms) {
      return NextResponse.json(
        { error: 'Você deve aceitar os termos de uso.' },
        { status: 400 }
      );
    }

    // 2. Verifica se usuário já existe (Email e CPF)
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR cpf = $2',
      [email, cpf]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.email === email) {
        return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 409 });
      } else {
        return NextResponse.json({ error: 'Este CPF já está cadastrado.' }, { status: 409 });
      }
    }

    // 3. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insere no Banco de Dados
    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password, cpf, birth_date, mobile_phone,
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, address_country,
        aviation_role, aviation_role_other, newsletter, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      ) RETURNING id, first_name, last_name, email`,
      [
        firstName,
        lastName,
        email,
        hashedPassword,
        cpf,
        birthDate,
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
        aviationRoleOther || null,
        newsletter || false,
      ]
    );

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso!',
        user: {
          id: newUser.rows[0].id,
          firstName: newUser.rows[0].first_name,
          lastName: newUser.rows[0].last_name,
          email: newUser.rows[0].email,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o registro. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
