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
        aviation_role_other
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

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
    });
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
