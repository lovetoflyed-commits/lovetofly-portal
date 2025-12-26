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

    const cleanedCPF = (cpf || '').replace(/\D/g, '');
    const cleanedPhone = (mobilePhone || '').replace(/\D/g, '');
    const cleanedZip = (addressZip || '').replace(/\D/g, '');

    if (!firstName || !lastName || !email || !password || !cleanedCPF || !birthDate) {
      return NextResponse.json({ error: 'Please fill required fields' }, { status: 400 });
    }

    if (!terms) {
      return NextResponse.json({ error: 'You must accept terms' }, { status: 400 });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR cpf = $2',
      [email, cleanedCPF]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      } else {
        return NextResponse.json({ error: 'CPF already registered' }, { status: 409 });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, cpf, birth_date, mobile_phone,
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, address_country,
        aviation_role, aviation_role_other, newsletter_opt_in, terms_agreed, plan
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id, first_name, last_name, email, plan`,
      [
        firstName,
        lastName,
        email,
        hashedPassword,
        cleanedCPF,
        birthDate,
        cleanedPhone,
        addressStreet,
        addressNumber,
        addressComplement,
        addressNeighborhood,
        addressCity,
        addressState,
        cleanedZip,
        addressCountry,
        aviationRole,
        aviationRoleOther || null,
        newsletter || false,
        terms || false,
        'free'
      ]
    );

    return NextResponse.json({
      message: 'User created successfully!',
      user: {
        id: newUser.rows[0].id,
        firstName: newUser.rows[0].first_name,
        lastName: newUser.rows[0].last_name,
        email: newUser.rows[0].email,
        plan: newUser.rows[0].plan,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Register error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      fullError: error
    });
    
    const errorMessage = error?.detail || error?.message || 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
