import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Certifique-se que este caminho do pool está correto no seu projeto
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    console.log('--- TENTATIVA DE CADASTRO ---');
    console.log('Email:', data.email);
    console.log('CPF:', data.cpf);

    // 1. Verifica se o usuário já existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR cpf = $2',
      [data.email, data.cpf]
    );

    if (userCheck.rows.length > 0) {
      console.log('ERRO: Usuário já existe (Email ou CPF duplicado).');
      return NextResponse.json(
        { error: 'Usuário já cadastrado com este Email ou CPF.' },
        { status: 400 }
      );
    }

    // 2. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 3. Tenta Inserir no Banco
    console.log('Tentando inserir no banco...');

    const query = `
      INSERT INTO users (
        first_name, last_name, birth_date, cpf, email, password_hash, mobile_phone,
        address_zip, address_street, address_number, address_complement, 
        address_neighborhood, address_city, address_state, address_country,
        aviation_role, aviation_role_other, social_media, 
        newsletter_opt_in, terms_agreed
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, 
        $12, $13, $14, $15,
        $16, $17, $18, 
        $19, $20
      ) RETURNING id, first_name, email
    `;

    const values = [
      data.firstName, data.lastName, data.birthDate, data.cpf, data.email, passwordHash, data.mobilePhone,
      data.addressZip, data.addressStreet, data.addressNumber, data.addressComplement,
      data.addressNeighborhood, data.addressCity, data.addressState, data.addressCountry,
      data.aviationRole, data.aviationRoleOther, data.socialMedia,
      data.newsletter, data.terms
    ];

    const result = await pool.query(query, values);

    console.log('SUCESSO: Usuário criado com ID:', result.rows[0].id);

    return NextResponse.json(
      { message: 'Cadastro realizado com sucesso!', user: result.rows[0] },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('--- ERRO FATAL NO CADASTRO ---');
    console.error(error); 

    return NextResponse.json(
      { error: 'Erro ao salvar no banco: ' + error.message },
      { status: 500 }
    );
  }
}
