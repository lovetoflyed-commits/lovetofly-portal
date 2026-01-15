import { NextResponse } from 'next/server';
import pool from '@/config/db';

// GET /api/admin/users/[userId] - Get single user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, aviation_role, plan, created_at FROM users WHERE id = $1',
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
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    
    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (body.role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(body.role);
      paramCount++;
    }
    
    if (body.plan !== undefined) {
      updates.push(`plan = $${paramCount}`);
      values.push(body.plan);
      paramCount++;
    }
    
    if (body.aviation_role !== undefined) {
      updates.push(`aviation_role = $${paramCount}`);
      values.push(body.aviation_role);
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
    
    const user = result.rows[0];
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: {
        ...user,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ')
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      message: 'Error updating user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] - Delete user (soft delete recommended)
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    // Soft delete by setting a deleted_at timestamp (if column exists)
    // Or hard delete if that's preferred
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: result.rows[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      message: 'Error deleting user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
