import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/config/db';

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Buscar dados do usuário
    const result = await pool.query(
      `SELECT 
        id,
        first_name,
        last_name,
        cpf,
        email,
        mobile_phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip,
        address_country,
        aviation_role,
        aviation_role_other,
        avatar_url
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    // Checar se o usuário é anunciante ativo no HangarShare
    const hangarResult = await pool.query(
      `SELECT 1 FROM hangar_listings WHERE owner_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    const isHangarshareAdvertiser = hangarResult.rows.length > 0;

    return NextResponse.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      cpf: user.cpf,
      email: user.email,
      mobilePhone: user.mobile_phone,
      addressStreet: user.address_street,
      addressNumber: user.address_number,
      addressComplement: user.address_complement,
      addressNeighborhood: user.address_neighborhood,
      addressCity: user.address_city,
      addressState: user.address_state,
      addressZip: user.address_zip,
      addressCountry: user.address_country,
      aviationRole: user.aviation_role,
      aviationRoleOther: user.aviation_role_other,
      avatarUrl: user.avatar_url,
      isHangarshareAdvertiser,
    });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      mobilePhone,
      aviationRole,
      aviationRoleOther,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(firstName);
      paramIndex++;
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(lastName);
      paramIndex++;
    }
    if (mobilePhone !== undefined) {
      updates.push(`mobile_phone = $${paramIndex}`);
      params.push(mobilePhone);
      paramIndex++;
    }
    if (aviationRole !== undefined) {
      updates.push(`aviation_role = $${paramIndex}`);
      params.push(aviationRole);
      paramIndex++;
    }
    if (aviationRoleOther !== undefined) {
      updates.push(`aviation_role_other = $${paramIndex}`);
      params.push(aviationRoleOther);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        first_name,
        last_name,
        cpf,
        email,
        mobile_phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip,
        address_country,
        aviation_role,
        aviation_role_other,
        avatar_url
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        cpf: user.cpf,
        email: user.email,
        mobilePhone: user.mobile_phone,
        addressStreet: user.address_street,
        addressNumber: user.address_number,
        addressComplement: user.address_complement,
        addressNeighborhood: user.address_neighborhood,
        addressCity: user.address_city,
        addressState: user.address_state,
        addressZip: user.address_zip,
        addressCountry: user.address_country,
        aviationRole: user.aviation_role,
        aviationRoleOther: user.aviation_role_other,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
