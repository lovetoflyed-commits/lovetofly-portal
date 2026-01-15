// API Route: Check owner verification status
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    let userId: string;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Check if user has owner profile
    const ownerResult = await pool.query(
      `SELECT 
        id, 
        company_name, 
        verification_status,
        is_verified,
        created_at
      FROM hangar_owners 
      WHERE user_id = $1`,
      [userId]
    );

    if (ownerResult.rows.length === 0) {
      return NextResponse.json({
        hasProfile: false,
        isVerified: false,
        verificationStatus: null,
        message: 'Owner profile not found. Please complete owner setup first.',
        setupUrl: '/hangarshare/owner/setup'
      });
    }

    const owner = ownerResult.rows[0];

    // 3. Check document verification status
    const docsResult = await pool.query(
      `SELECT 
        document_type,
        validation_status,
        created_at,
        reviewed_at
      FROM user_documents
      WHERE user_id = $1 AND owner_id = $2
      ORDER BY created_at DESC`,
      [userId, owner.id]
    );

    const documents = docsResult.rows;
    const requiredDocs = ['id_front', 'id_back', 'selfie'];
    const uploadedDocs = documents.filter(d => requiredDocs.includes(d.document_type));
    const approvedDocs = uploadedDocs.filter(d => d.validation_status === 'approved');
    const pendingDocs = uploadedDocs.filter(d => d.validation_status === 'pending_review');
    const rejectedDocs = uploadedDocs.filter(d => d.validation_status === 'rejected');

    const allDocsUploaded = requiredDocs.every(docType => 
      documents.some(d => d.document_type === docType)
    );
    const allDocsApproved = requiredDocs.every(docType =>
      documents.some(d => d.document_type === docType && d.validation_status === 'approved')
    );

    // Determine overall verification status
    let canCreateListings = false;
    let statusMessage = '';
    let nextAction = '';

    if (!allDocsUploaded) {
      statusMessage = 'Documents not uploaded. Please upload required documents for verification.';
      nextAction = 'upload_documents';
    } else if (pendingDocs.length > 0) {
      statusMessage = `${pendingDocs.length} document(s) pending admin review. Listings will be visible after approval.`;
      nextAction = 'wait_for_review';
    } else if (rejectedDocs.length > 0 && !allDocsApproved) {
      statusMessage = 'Some documents were rejected. Please re-upload correct documents.';
      nextAction = 'reupload_documents';
    } else if (allDocsApproved) {
      canCreateListings = true;
      statusMessage = 'Verified! You can create listings.';
      nextAction = 'create_listing';
    }

    return NextResponse.json({
      hasProfile: true,
      isVerified: owner.is_verified || allDocsApproved,
      verificationStatus: owner.verification_status,
      canCreateListings,
      statusMessage,
      nextAction,
      owner: {
        id: owner.id,
        companyName: owner.company_name,
        createdAt: owner.created_at
      },
      documents: {
        total: documents.length,
        required: requiredDocs.length,
        uploaded: uploadedDocs.length,
        approved: approvedDocs.length,
        pending: pendingDocs.length,
        rejected: rejectedDocs.length,
        allUploaded: allDocsUploaded,
        allApproved: allDocsApproved
      },
      uploadUrl: '/hangarshare/owner/validate-documents'
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
