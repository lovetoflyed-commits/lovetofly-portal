import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';
import { checkStrictRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // Strict rate limiting for password reset (5 per minute)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkStrictRateLimit(`reset-password:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          message: 'Too many password reset attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }
    
    const { email, resetCode, newPassword } = await request.json();

    if (!email || !resetCode || !newPassword) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Find user with valid reset code
    const userResult = await pool.query(
      `SELECT id, email, reset_code, reset_code_expires 
       FROM users 
       WHERE email = $1 AND reset_code = $2`,
      [email.toLowerCase(), resetCode]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'Código inválido ou expirado' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Check if code is expired
    if (new Date(user.reset_code_expires) < new Date()) {
      return NextResponse.json(
        { message: 'Código expirado. Solicite um novo código' },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           reset_code = NULL, 
           reset_code_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'auth/reset-password',
        method: 'POST'
      }
    });
    
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      { message: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
