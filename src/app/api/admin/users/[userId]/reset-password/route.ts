import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';
import { sendPasswordResetEmail } from '@/utils/email';
import { NextRequest } from 'next/server';

/**
 * POST /api/admin/users/[userId]/reset-password
 * Generate a password reset code and send email to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authorization
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 401 });
    }

    const { userId } = await params;

    // Fetch user info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code in database
    await pool.query(
      `UPDATE users 
       SET password_reset_code = $1, password_reset_expires = $2 
       WHERE id = $3`,
      [resetCode, expiresAt, user.id]
    );

    // Send email with reset code
    await sendPasswordResetEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      resetCode,
    });

    // Log admin action
    await logAdminAction(
      adminUser.id,
      'reset_password',
      'user',
      userId,
      { userId, action: 'Admin-initiated password reset' },
      request
    );

    return NextResponse.json(
      { 
        message: 'Reset code sent successfully',
        email: user.email,
        expiresAt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/reset-password] Error:', error);
    return NextResponse.json(
      { message: 'Error generating reset code' },
      { status: 500 }
    );
  }
}
