import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { sendPasswordResetEmail } from '@/utils/email';
import { checkCriticalRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // Critical rate limiting for password reset requests (3 per hour)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkCriticalRateLimit(`forgot-password:${identifier}`);
    
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
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Return success even if user not found (security best practice)
      return NextResponse.json(
        { message: 'Se o email existir, você receberá instruções de redefinição' },
        { status: 200 }
      );
    }

    const user = userResult.rows[0];

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code in database
    await pool.query(
      `UPDATE users 
       SET reset_code = $1, reset_code_expires = $2 
       WHERE id = $3`,
      [resetCode, expiresAt, user.id]
    );

    // Send email with reset code
    await sendPasswordResetEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      resetCode,
    });

    return NextResponse.json(
      { message: 'Código de redefinição enviado para seu email' },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'auth/forgot-password',
        method: 'POST'
      }
    });
    
    console.error('Error in forgot-password API:', error);
    return NextResponse.json(
      { message: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
