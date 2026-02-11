import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid auth header');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded?.id;
    if (!userId) {
      console.error('No user ID in decoded token');
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const applicationId = params.id;
    console.log(`Fetching application ${applicationId} for user ${userId}`);

    // Fetch the specific application with job and company details
    const result = await pool.query(
      `SELECT 
        a.id,
        a.job_id,
        a.candidate_id as "candidateId",
        a.status,
        a.cover_letter as "coverLetter",
        a.video_intro_url as "videoIntroUrl",
        a.expected_start_date as "expectedStartDate",
        a.salary_expectations_min as "salaryExpectationsMin",
        a.salary_expectations_max as "salaryExpectationsMax",
        a.relocation_willing as "relocationWilling",
        a.screening_notes as "screeningNotes",
        a.interview_scheduled_at as "interviewScheduledAt",
        a.interview_completed_at as "interviewCompletedAt",
        a.simulator_check_scheduled_at as "simulatorCheckScheduledAt",
        a.simulator_check_completed_at as "simulatorCheckCompletedAt",
        a.offer_extended_at as "offerExtendedAt",
        a.offer_accepted_at as "offerAcceptedAt",
        a.recruiter_score as "recruiterScore",
        a.chief_pilot_score as "chiefPilotScore",
        a.culture_fit_score as "cultureFitScore",
        a.rejection_reason as "rejectionReason",
        a.rejection_details as "rejectionDetails",
        a.withdrawn_reason as "withdrawnReason",
        a.credential_match_percentage as "credentialMatchPercentage",
        a.is_flagged as "isFlagged",
        a.is_recommended as "isRecommended",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        a.applied_at as "appliedAt",
        j.id as "jobId",
        j.title as "jobTitle",
        j.description,
        j.salary_min as "salaryMin",
        j.salary_max as "salaryMax",
        j.location,
        j.base_location as "baseLocation",
        j.requirements,
        j.benefits,
        j.company_id as "companyId",
        c.id as "company_id",
        c.name as "companyName",
        c.logo_url as "companyLogoUrl",
        c.location as "companyLocation"
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = $1 AND a.candidate_id = $2`,
      [applicationId, userId]
    );

    if (result.rows.length === 0) {
      console.error(`Application ${applicationId} not found or not owned by user ${userId}`);
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    const application = result.rows[0];
    console.log(`Application ${applicationId} fetched successfully`);

    return NextResponse.json({
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid auth header');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded?.id;
    if (!userId) {
      console.error('No user ID in decoded token');
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const applicationId = params.id;
    const body = await request.json();

    // Verify the application belongs to the user
    const existingCheck = await pool.query(
      'SELECT id FROM applications WHERE id = $1 AND candidate_id = $2',
      [applicationId, userId]
    );

    if (existingCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Application not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      'status',
      'cover_letter',
      'expected_start_date',
      'salary_expectations_min',
      'salary_expectations_max',
      'relocation_willing',
      'screening_notes',
      'interview_scheduled_at',
      'interview_completed_at',
      'simulator_check_scheduled_at',
      'simulator_check_completed_at',
      'rejection_reason',
      'rejection_details',
      'withdrawn_reason',
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Map camelCase to snake_case and add to updates
    const fieldMap: { [key: string]: string } = {
      status: 'status',
      coverLetter: 'cover_letter',
      expectedStartDate: 'expected_start_date',
      salaryExpectationsMin: 'salary_expectations_min',
      salaryExpectationsMax: 'salary_expectations_max',
      relocationWilling: 'relocation_willing',
      screeningNotes: 'screening_notes',
      interviewScheduledAt: 'interview_scheduled_at',
      interviewCompletedAt: 'interview_completed_at',
      simulatorCheckScheduledAt: 'simulator_check_scheduled_at',
      simulatorCheckCompletedAt: 'simulator_check_completed_at',
      rejectionReason: 'rejection_reason',
      rejectionDetails: 'rejection_details',
      withdrawnReason: 'withdrawn_reason',
    };

    for (const [key, value] of Object.entries(body)) {
      const dbField = fieldMap[key];
      if (dbField && allowedFields.includes(dbField)) {
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    // Add the application ID for the WHERE clause
    values.push(applicationId);

    const updateQuery = `
      UPDATE applications
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log(`Updating application ${applicationId}`);
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Failed to update application' },
        { status: 500 }
      );
    }

    console.log(`Application ${applicationId} updated successfully`);

    return NextResponse.json({
      data: result.rows[0],
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
