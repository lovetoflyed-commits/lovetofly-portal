/**
 * Admin API: GET/POST /api/admin/pix/keys
 * Purpose: List and create PIX keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminUser } from '@/utils/adminAuth';
import pool from '@/config/db';
import { validatePIXKey } from '@/utils/pixUtils';

export async function GET(request: NextRequest) {
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

        // Get all PIX keys, sorted by active status first
        // For single-tenant setup, get all keys regardless of organization
        const result = await pool.query(
            `SELECT id, pix_key, pix_key_type, bank_name, account_holder_name, is_active, created_at
             FROM pix_keys
             ORDER BY is_active DESC, created_at DESC`
        );

        return NextResponse.json(
            { success: true, data: result.rows },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[Admin PIX Keys GET] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch PIX keys' },
            { status: error.status || 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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
        
        const body = await request.json();

        const { pix_key, pix_key_type, bank_name, account_holder_name } = body;

        // Validate required fields
        if (!pix_key || !pix_key_type || !account_holder_name) {
            return NextResponse.json(
                { error: 'Missing required fields: pix_key, pix_key_type, account_holder_name' },
                { status: 400 }
            );
        }

        // Validate PIX key format
        if (!validatePIXKey(pix_key, pix_key_type)) {
            return NextResponse.json(
                { error: `Invalid PIX key format for type: ${pix_key_type}` },
                { status: 400 }
            );
        }

        // Check if PIX key already exists
        const existing = await pool.query(
            'SELECT id FROM pix_keys WHERE pix_key = $1',
            [pix_key]
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: 'This PIX key is already registered' },
                { status: 409 }
            );
        }

        // Create PIX key
        // Use a default organization_id for single-tenant setup
        const defaultOrgId = '00000000-0000-0000-0000-000000000001';
        
        const result = await pool.query(
            `INSERT INTO pix_keys (
                organization_id, pix_key, pix_key_type, bank_name, 
                account_holder_name, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, pix_key, pix_key_type, bank_name, account_holder_name, is_active, created_at`,
            [
                defaultOrgId,
                pix_key,
                pix_key_type,
                bank_name || null,
                account_holder_name,
                true // New keys are active by default
            ]
        );

        // Log admin action
        console.log(`[Admin Action] PIX Key created by ${admin.id}:`, {
            keyId: result.rows[0].id,
            keyType: pix_key_type
        });

        return NextResponse.json(
            {
                success: true,
                data: result.rows[0],
                message: 'PIX key created successfully'
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[Admin PIX Keys POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create PIX key' },
            { status: error.status || 500 }
        );
    }
}
