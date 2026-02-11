import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { requireAdmin, getAdminUser, logAdminAction } from '@/utils/adminAuth';
import { NextRequest } from 'next/server';

// GET /api/admin/users/[userId] - Get single user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, aviation_role, plan, created_at, deleted_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const user = result.rows[0];
    return NextResponse.json({ 
      user: {
        ...user,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ')
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[userId] - Update user (role, plan, etc.)
export async function PATCH(
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
    const body = await request.json();

    if (body.role !== undefined && adminUser.role?.toLowerCase() !== 'master') {
      return NextResponse.json(
        { message: 'Forbidden - Master role required to change roles' },
        { status: 403 }
      );
    }
    
    // Fetch old user data for audit log
    const oldUserResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, plan, aviation_role FROM users WHERE id = $1',
      [userId]
    );
    
    if (oldUserResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const oldUser = oldUserResult.rows[0];
    
    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const updatedFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (body.role !== undefined) {
      if (body.role === 'master') {
        await pool.query(
          "UPDATE users SET role = 'admin' WHERE role = 'master' AND id <> $1",
          [userId]
        );
      }
      updates.push(`role = $${paramCount}`);
      values.push(body.role);
      updatedFields.push('role');
      paramCount++;
    }
    
    if (body.plan !== undefined) {
      updates.push(`plan = $${paramCount}`);
      values.push(body.plan);
      updatedFields.push('plan');
      paramCount++;
    }
    
    if (body.aviation_role !== undefined) {
      updates.push(`aviation_role = $${paramCount}`);
      values.push(body.aviation_role);
      updatedFields.push('aviation_role');
      paramCount++;
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Add userId as last parameter
    values.push(userId);
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, email, role, plan, aviation_role, updated_at
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const updatedUser = result.rows[0];
    
    // Log admin action
    await logAdminAction(
      adminUser.id,
      'update_user',
      'user',
      userId,
      { userId, changes: updatedFields },
      request,
      oldUser,
      updatedUser
    );

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/users/[userId]] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Soft delete user (sets deleted_at timestamp)
export async function DELETE(
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
    
    // Fetch user data before deletion for audit log
    const oldUserResult = await pool.query(
      'SELECT id, email, first_name, last_name, role, plan, aviation_role, deleted_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (oldUserResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const oldUser = oldUserResult.rows[0];
    
    // Check if already deleted
    if (oldUser.deleted_at) {
      return NextResponse.json({ 
        message: 'User already deleted',
        deletedAt: oldUser.deleted_at 
      }, { status: 400 });
    }
    
    // Soft delete by setting deleted_at timestamp and tracking who deleted
    const result = await pool.query(
      `UPDATE users 
       SET deleted_at = NOW(), deleted_by = $1 
       WHERE id = $2 
       RETURNING id, email, first_name, last_name, deleted_at`,
      [adminUser.id, userId]
    );
    
    const deletedUser = result.rows[0];
    
    // Log admin action with full user details
    await logAdminAction(
      adminUser.id,
      'delete_user',
      'user',
      userId,
      {
        userId,
        email: oldUser.email,
        name: `${oldUser.first_name} ${oldUser.last_name}`,
        deletedAt: deletedUser.deleted_at
      },
      request,
      oldUser,
      deletedUser
    );
    
    return NextResponse.json({ 
      message: 'User deleted successfully (soft delete)',
      user: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: [deletedUser.first_name, deletedUser.last_name].filter(Boolean).join(' '),
        deletedAt: deletedUser.deleted_at
      }
    });
  } catch (error) {
    console.error('[DELETE /api/admin/users/[userId]] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

