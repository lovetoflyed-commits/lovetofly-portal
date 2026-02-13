import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';
import { checkCriticalRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import { isValidCNPJ, isValidCPF } from '@/utils/masks';
import * as Sentry from '@sentry/nextjs';
import { sendWelcomeMessage } from '@/utils/systemMessages';

export async function POST(request: Request) {
  try {
    // Critical rate limiting for registration (3 attempts per hour)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkCriticalRateLimit(`register:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.',
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
    const { userType = 'individual', ...userData } = body;

    // Validate user type
    if (!['individual', 'business'].includes(userType)) {
      return NextResponse.json(
        { error: 'Tipo de usuário inválido' },
        { status: 400 }
      );
    }

    // Route to appropriate handler
    if (userType === 'individual') {
      return handleIndividualRegistration(userData);
    } else {
      return handleBusinessRegistration(userData);
    }

  } catch (error: any) {
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
    
    console.error('Registro - erro detalhado:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      fullError: error
    });
    
    const errorMessage = error?.detail || error?.message || 'Erro no servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handleIndividualRegistration(userData: any) {
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
  } = userData;

  const cleanedCPF = (cpf || '').replace(/\D/g, '');
  const cleanedPhone = (mobilePhone || '').replace(/\D/g, '');
  const cleanedZip = (addressZip || '').replace(/\D/g, '');

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: 'Por favor, preencha todos os campos obrigatórios' },
      { status: 400 }
    );
  }

  // Validate CPF
  if (!isValidCPF(cleanedCPF)) {
    return NextResponse.json(
      { error: 'CPF inválido' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existingUserEmail = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existingUserEmail.rows.length > 0) {
    return NextResponse.json(
      { error: 'E-mail já cadastrado' },
      { status: 409 }
    );
  }

  // Check if CPF already exists
  const existingUserCPF = await pool.query(
    'SELECT id FROM users WHERE cpf = $1',
    [cleanedCPF]
  );
  if (existingUserCPF.rows.length > 0) {
    return NextResponse.json(
      { error: 'CPF já cadastrado' },
      { status: 409 }
    );
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await pool.query(
    `INSERT INTO users (
      first_name, last_name, email, password_hash, cpf, birth_date, mobile_phone,
      address_street, address_number, address_complement, address_neighborhood,
      address_city, address_state, address_zip, address_country,
      aviation_role, aviation_role_other, licencas, habilitacoes, curso_atual,
      newsletter_opt_in, terms_agreed, plan, user_type, user_type_verified
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
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
      'free',
      'individual',
      true  // Individual users are immediately verified
    ]
  );

  const userId = newUser.rows[0].id;

  // Send welcome message (don't block registration if it fails)
  sendWelcomeMessage(userId).catch(err => {
    console.error('Failed to send welcome message:', err);
  });

  return NextResponse.json({
    message: 'Usuário criado com sucesso!',
    user: {
      id: newUser.rows[0].id,
      firstName: newUser.rows[0].first_name,
      lastName: newUser.rows[0].last_name,
      email: newUser.rows[0].email,
      plan: newUser.rows[0].plan,
      userType: 'individual',
    },
  }, { status: 201 });
}

async function handleBusinessRegistration(userData: any) {
  const {
    cnpj,
    legalName,
    businessName,
    businessType,
    email,
    password,
    businessPhone,
    businessEmail,
    website,
    representativeName,
    representativeTitle,
    headquartersStreet,
    headquartersNumber,
    headquartersComplement,
    headquartersNeighborhood,
    headquartersCity,
    headquartersState,
    headquartersZip,
    headquartersCountry = 'Brasil',
    companySize,
    industry,
    description,
    establishedYear,
    annualHiringVolume,
    primaryOperations,
    faaCertificateNumber,
    newsletter,
    terms,
  } = userData;

  const cleanedCNPJ = (cnpj || '').replace(/\D/g, '');
  const cleanedPhone = (businessPhone || '').replace(/\D/g, '');
  const cleanedZip = (headquartersZip || '').replace(/\D/g, '');

  // Validate required fields
  if (!legalName || !businessName || !email || !password || !representativeName) {
    return NextResponse.json(
      { error: 'Por favor, preencha todos os campos obrigatórios' },
      { status: 400 }
    );
  }

  // Validate CNPJ
  if (!isValidCNPJ(cleanedCNPJ)) {
    return NextResponse.json(
      { error: 'CNPJ inválido' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existingUserEmail = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existingUserEmail.rows.length > 0) {
    return NextResponse.json(
      { error: 'E-mail já cadastrado' },
      { status: 409 }
    );
  }

  // Check if CNPJ already exists
  const existingUserCNPJ = await pool.query(
    'SELECT id FROM users WHERE cnpj = $1',
    [cleanedCNPJ]
  );
  if (existingUserCNPJ.rows.length > 0) {
    return NextResponse.json(
      { error: 'CNPJ já cadastrado' },
      { status: 409 }
    );
  }

  // Check if CNPJ already exists in business_users
  const existingBusinessCNPJ = await pool.query(
    'SELECT id FROM business_users WHERE cnpj = $1',
    [cleanedCNPJ]
  );
  if (existingBusinessCNPJ.rows.length > 0) {
    return NextResponse.json(
      { error: 'CNPJ já cadastrado no sistema' },
      { status: 409 }
    );
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Create user account
    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, cnpj,
        mobile_phone, newsletter_opt_in, terms_agreed,
        plan, user_type, user_type_verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id, email`,
      [
        representativeName,
        representativeTitle || '',
        email,
        hashedPassword,
        cleanedCNPJ,
        cleanedPhone,
        newsletter || false,
        terms || false,
        'free',
        'business',
        false  // Business users need verification
      ]
    );

    const userId = newUser.rows[0].id;

    // Create business profile
    const businessUserResult = await pool.query(
      `INSERT INTO business_users (
        user_id, cnpj, legal_name, business_name, business_type,
        business_phone, business_email, website, representative_name, representative_title,
        headquarters_street, headquarters_number, headquarters_complement,
        headquarters_neighborhood, headquarters_city, headquarters_state,
        headquarters_zip, headquarters_country, company_size, industry,
        description, established_year, annual_hiring_volume,
        primary_operations, faa_certificate_number,
        verification_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id`,
      [
        userId,
        cleanedCNPJ,
        legalName,
        businessName,
        businessType || null,
        cleanedPhone,
        businessEmail || email,
        website || null,
        representativeName,
        representativeTitle || null,
        headquartersStreet || null,
        headquartersNumber || null,
        headquartersComplement || null,
        headquartersNeighborhood || null,
        headquartersCity || null,
        headquartersState || null,
        cleanedZip,
        headquartersCountry,
        companySize || null,
        industry || null,
        description || null,
        establishedYear || null,
        annualHiringVolume || null,
        primaryOperations ? JSON.stringify(primaryOperations) : null,
        faaCertificateNumber || null,
        'pending'  // pending verification
      ]
    );

    // Commit transaction
    await pool.query('COMMIT');

    // Send welcome message (don't block registration if it fails)
    sendWelcomeMessage(userId).catch(err => {
      console.error('Failed to send welcome message:', err);
    });

    return NextResponse.json({
      message: 'Empresa registrada com sucesso! Aguardando verificação.',
      user: {
        id: userId,
        email: newUser.rows[0].email,
        plan: 'free',
        userType: 'business',
        verificationStatus: 'pending',
      },
      businessUser: {
        id: businessUserResult.rows[0].id,
        legalName,
        businessName,
        cnpj: cleanedCNPJ,
        verificationStatus: 'pending',
      },
    }, { status: 201 });

  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    throw error;
  }
}

