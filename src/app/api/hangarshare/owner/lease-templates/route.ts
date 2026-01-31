import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    try {
      jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, name, version, content_url, created_at
       FROM hangar_lease_templates
       ORDER BY name ASC, version DESC`
    );

    return NextResponse.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching lease templates:', error);
    return NextResponse.json({ message: 'Error fetching lease templates' }, { status: 500 });
  }
}
