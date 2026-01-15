import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';
import { checkCriticalRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // Critical rate limiting for registration (3 attempts per hour)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkCriticalRateLimit(`register:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
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
      licencas,
      habilitacoes,
      curso_atual,
      newsletter,
      terms,
    } = body;

    const cleanedCPF = (cpf || '').replace(/\D/g, '');
    const cleanedPhone = (mobilePhone || '').replace(/\D/g, '');
    const cleanedZip = (addressZip || '').replace(/\D/g, '');

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Please fill required fields' }, { status: 400 });
    }


    // Verifica se já existe usuário com o mesmo email
    const existingUserEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUserEmail.rows.length > 0) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
    }

    // Verifica se já existe usuário com o mesmo CPF
    const existingUserCPF = await pool.query(
      'SELECT id FROM users WHERE cpf = $1',
      [cleanedCPF]
    );
    if (existingUserCPF.rows.length > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, cpf, birth_date, mobile_phone,
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, address_country,
        aviation_role, aviation_role_other, licencas, habilitacoes, curso_atual,
        newsletter_opt_in, terms_agreed, plan
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
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
        licencas || null,
        habilitacoes || null,
        curso_atual || null,
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
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'auth/register',
        method: 'POST'
      },
      extra: {
        errorCode: error?.code,
        errorDetail: error?.detail
      }
    });
    
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
