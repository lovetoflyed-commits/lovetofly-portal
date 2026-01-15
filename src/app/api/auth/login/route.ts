import { NextResponse } from 'next/server';
import pool from '@/config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkStrictRateLimit, getClientIdentifier } from '@/lib/ratelimit';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // Rate limiting for login attempts
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkStrictRateLimit(`login:${identifier}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          message: 'Too many login attempts. Please try again later.',
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
    const email = body.email || body.identifier;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        plan: user.plan || 'free',
        role: user.role || 'user',
      },
    });
  } catch (error: any) {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'auth/login',
        method: 'POST'
      },
      extra: {
        errorCode: error?.code,
        errorDetail: error?.detail
      }
    });
    
    console.error('Login error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      fullError: error
    });
    
    const errorMessage = error?.detail || error?.message || 'Server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
