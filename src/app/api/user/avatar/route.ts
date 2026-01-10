import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: number;
  email: string;
}

function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET || '';
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Prefer FormData upload; fallback to JSON base64
    let dataUrl: string | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('avatar') as File | null;
      if (!file) {
        return NextResponse.json({ message: 'Arquivo não enviado' }, { status: 400 });
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: 'Tipo de arquivo inválido' }, { status: 400 });
      }
      const maxBytes = 3 * 1024 * 1024; // 3MB
      if (file.size > maxBytes) {
        return NextResponse.json({ message: 'Imagem muito grande (máx 3MB)' }, { status: 413 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      dataUrl = `data:${file.type};base64,${base64}`;
    } else {
      const body = await request.json().catch(() => ({}));
      const { imageData, mimeType } = body as { imageData?: string; mimeType?: string };
      if (!imageData || !mimeType || !mimeType.startsWith('image/')) {
        return NextResponse.json({ message: 'Dados de imagem inválidos' }, { status: 400 });
      }
      // Assume imageData is base64 string without prefix
      dataUrl = `data:${mimeType};base64,${imageData}`;
    }

    const userId = decoded.id;

    const update = await pool.query(
      `UPDATE users SET avatar_url = $2, updated_at = NOW() WHERE id = $1 RETURNING id, first_name, last_name, avatar_url`,
      [userId, dataUrl]
    );

    if (update.rows.length === 0) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = update.rows[0];
    return NextResponse.json({ 
      message: 'Avatar atualizado com sucesso',
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao atualizar avatar:', error);
    return NextResponse.json({ message: 'Erro ao atualizar avatar' }, { status: 500 });
  }
}
