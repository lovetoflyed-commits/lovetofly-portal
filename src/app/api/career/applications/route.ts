import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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

    console.log('Fetching applications for user:', userId);

    // Fetch all applications for the current user
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
        j.company_id as "companyId",
        c.id as "company_id",
        c.name as "companyName",
        c.logo_url as "companyLogoUrl"
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.candidate_id = $1
      ORDER BY a.applied_at DESC`,
      [userId]
    );

    const applications = result.rows;

    console.log(`Fetched ${applications.length} applications for user ${userId}`);

    return NextResponse.json({
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { jobId, coverLetter, videoIntroUrl, expectedStartDate, salaryExpectationsMin, salaryExpectationsMax, relocationWilling } = body;

    if (!jobId) {
      return NextResponse.json({ message: 'Job ID is required' }, { status: 400 });
    }

    console.log(`Creating application for user ${userId} to job ${jobId}`);

    // Check if user already applied to this job
    const existingCheck = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [jobId, userId]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { message: 'You have already applied to this job' },
        { status: 409 }
      );
    }

    // Create new application
    const result = await pool.query(
      `INSERT INTO applications (
        job_id,
        candidate_id,
        status,
        cover_letter,
        video_intro_url,
        expected_start_date,
        salary_expectations_min,
        salary_expectations_max,
        relocation_willing,
        created_at,
        updated_at,
        applied_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        jobId,
        userId,
        'applied',
        coverLetter || null,
        videoIntroUrl || null,
        expectedStartDate || null,
        salaryExpectationsMin || null,
        salaryExpectationsMax || null,
        relocationWilling || false,
      ]
    );

    console.log(`Application created successfully with ID ${result.rows[0].id}`);

    return NextResponse.json(
      { data: result.rows[0], message: 'Application submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
