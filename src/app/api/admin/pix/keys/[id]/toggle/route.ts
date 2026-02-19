/**
 * Admin API: PATCH /api/admin/pix/keys/[id]/toggle
 * Purpose: Toggle PIX key active status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminUser } from '@/utils/adminAuth';
import pool from '@/config/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;
        
        const admin = await getAdminUser(request);
        if (!admin) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        
        const { id } = await params;
        const keyId = parseInt(id);

        if (!keyId) {
            return NextResponse.json(
                { error: 'Invalid key ID' },
                { status: 400 }
            );
        }

        // Verify the key exists
        const keyResult = await pool.query(
            'SELECT is_active FROM pix_keys WHERE id = $1',
            [keyId]
        );

        if (keyResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'PIX key not found' },
                { status: 404 }
            );
        }

        const currentStatus = keyResult.rows[0].is_active;
        const newStatus = !currentStatus;

        await pool.query(
            'UPDATE pix_keys SET is_active = $1 WHERE id = $2',
            [newStatus, keyId]
        );

        console.log(`[Admin Action] PIX Key ${keyId} toggled to ${newStatus ? 'active' : 'inactive'} by ${admin.id}`);

        return NextResponse.json(
            {
                success: true,
                message: `PIX key is now ${newStatus ? 'active' : 'inactive'}`,
                data: { isActive: newStatus }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[Admin PIX Keys Toggle PATCH] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update PIX key' },
            { status: error.status || 500 }
        );
    }
}
