import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      ownerType = 'company',
      companyName, 
      companyCnpj, 
      cpf,
      phone, 
      address, 
      website, 
      description,
      bankCode,
      bankAgency,
      bankAccount,
      accountHolderName,
      pixKey,
      pixKeyType
    } = body;

    if (!userId || !companyName) {
      return NextResponse.json(
        { error: 'userId and companyName are required' },
        { status: 400 }
      );
    }

    // Validate based on owner type
    if (ownerType === 'company' && !companyCnpj) {
      return NextResponse.json(
        { error: 'CNPJ is required for company owners' },
        { status: 400 }
      );
    }
    
    if (ownerType === 'individual' && !cpf) {
      return NextResponse.json(
        { error: 'CPF is required for individual owners' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO hangar_owners 
       (user_id, owner_type, company_name, cnpj, cpf, phone, address, website, description,
        bank_code, bank_agency, bank_account, account_holder_name, pix_key, pix_key_type,
        verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
       RETURNING id, user_id, owner_type, company_name, cnpj, cpf, phone, verification_status, created_at`,
      [
        userId, 
        ownerType,
        companyName, 
        companyCnpj || null, 
        cpf || null,
        phone, 
        address, 
        website, 
        description,
        bankCode,
        bankAgency,
        bankAccount,
        accountHolderName,
        pixKey || null,
        pixKeyType || null
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Anunciante criado com sucesso',
        ownerId: result.rows[0].id,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating owner:', error);
    
    // Handle duplicate CNPJ
    if (error?.code === '23505' && error?.constraint?.includes('cnpj')) {
      return NextResponse.json(
        { error: 'CNPJ already registered' },
        { status: 409 }
      );
    }
    
    // Handle duplicate CPF
    if (error?.code === '23505' && error?.constraint?.includes('cpf')) {
      return NextResponse.json(
        { error: 'CPF already registered' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create owner', details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT 
        ho.id,
        ho.user_id,
        ho.company_name,
        ho.cnpj,
        ho.phone,
        ho.is_verified,
        ho.verification_status,
        ho.created_at,
        u.email,
        u.first_name || ' ' || u.last_name as owner_name,
        COUNT(hl.id) as total_hangars
       FROM hangar_owners ho
       JOIN users u ON ho.user_id = u.id
       LEFT JOIN hangar_listings hl ON hl.owner_id = ho.id
       GROUP BY ho.id, u.email, u.first_name, u.last_name
       ORDER BY ho.created_at DESC`
    );

    return NextResponse.json({ 
      success: true,
      owners: result.rows 
    });
  } catch (error: any) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners', details: error?.message },
      { status: 500 }
    );
  }
}
