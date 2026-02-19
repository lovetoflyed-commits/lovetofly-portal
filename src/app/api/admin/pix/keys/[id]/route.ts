/**
 * Admin API: DELETE/PATCH /api/admin/pix/keys/[id]
 * Purpose: Delete and toggle PIX keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminUser } from '@/utils/adminAuth';
import pool from '@/config/db';
import { validatePIXKey } from '@/utils/pixUtils';

export async function DELETE(
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
            'SELECT id FROM pix_keys WHERE id = $1',
            [keyId]
        );

        if (keyResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'PIX key not found' },
                { status: 404 }
            );
        }

        try {
            // Delete the key
            await pool.query('DELETE FROM pix_keys WHERE id = $1', [keyId]);

            console.log(`[Admin Action] PIX Key ${keyId} deleted by ${admin.id}`);

            return NextResponse.json(
                { success: true, message: 'PIX key deleted successfully' },
                { status: 200 }
            );
        } catch (deleteError: any) {
            // Fallback: deactivate if the key is referenced by payments
            if (deleteError?.code === '23503') {
                await pool.query('UPDATE pix_keys SET is_active = false WHERE id = $1', [keyId]);
                return NextResponse.json(
                    {
                        success: true,
                        message: 'PIX key is in use and was deactivated instead of deleted'
                    },
                    { status: 200 }
                );
            }
            throw deleteError;
        }
    } catch (error: any) {
        console.error('[Admin PIX Keys DELETE] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete PIX key' },
            { status: error.status || 500 }
        );
    }
}

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

        const body = await request.json();
        const { pix_key, pix_key_type, bank_name, account_holder_name } = body ?? {};

        if (!pix_key && !pix_key_type && !bank_name && !account_holder_name) {
            return NextResponse.json(
                { error: 'No fields provided to update' },
                { status: 400 }
            );
        }

        if ((pix_key && !pix_key_type) || (!pix_key && pix_key_type)) {
            return NextResponse.json(
                { error: 'pix_key and pix_key_type must be updated together' },
                { status: 400 }
            );
        }

        if (pix_key && pix_key_type && !validatePIXKey(pix_key, pix_key_type)) {
            return NextResponse.json(
                { error: `Invalid PIX key format for type: ${pix_key_type}` },
                { status: 400 }
            );
        }

        const updateFields: string[] = [];
        const sqlParams: Array<string | number | null> = [];
        let paramIndex = 1;

        if (pix_key) {
            // Ensure PIX key is unique
            const existing = await pool.query(
                'SELECT id FROM pix_keys WHERE pix_key = $1 AND id <> $2',
                [pix_key, keyId]
            );

            if (existing.rows.length > 0) {
                return NextResponse.json(
                    { error: 'This PIX key is already registered' },
                    { status: 409 }
                );
            }

            updateFields.push(`pix_key = $${paramIndex++}`);
            sqlParams.push(pix_key);

            updateFields.push(`pix_key_type = $${paramIndex++}`);
            sqlParams.push(pix_key_type);
        }

        if (bank_name !== undefined) {
            updateFields.push(`bank_name = $${paramIndex++}`);
            sqlParams.push(bank_name || null);
        }

        if (account_holder_name) {
            updateFields.push(`account_holder_name = $${paramIndex++}`);
            sqlParams.push(account_holder_name);
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: 'No valid fields provided to update' },
                { status: 400 }
            );
        }

        sqlParams.push(keyId);

        const result = await pool.query(
            `UPDATE pix_keys SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
             RETURNING id, pix_key, pix_key_type, bank_name, account_holder_name, is_active, created_at`,
            sqlParams
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'PIX key not found' },
                { status: 404 }
            );
        }

        console.log(`[Admin Action] PIX Key ${keyId} updated by ${admin.id}`);

        return NextResponse.json(
            {
                success: true,
                message: 'PIX key updated successfully',
                data: result.rows[0]
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[Admin PIX Keys PATCH] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update PIX key' },
            { status: error.status || 500 }
        );
    }
}
