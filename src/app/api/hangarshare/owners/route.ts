import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, companyName, companyCnpj, phone, address, website, description } = body;

    if (!userId || !companyName) {
      return NextResponse.json(
        { error: 'userId and companyName are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO hangar_owners 
       (user_id, company_name, cnpj, phone, address, website, description, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, user_id, company_name, cnpj, phone, verification_status, created_at`,
      [userId, companyName, companyCnpj, phone, address, website, description]
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
    if (error?.code === '23505' && error?.constraint === 'hangar_owners_cnpj_key') {
      return NextResponse.json(
        { error: 'CNPJ already registered' },
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
