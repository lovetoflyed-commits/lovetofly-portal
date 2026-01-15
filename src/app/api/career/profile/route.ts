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

    console.log('Fetching profile for user:', userId);

    // Fetch user profile data
    let userResult;
    try {
      userResult = await pool.query(
        `SELECT 
          id, 
          first_name as "firstName", 
          last_name as "lastName", 
          email, 
          mobile_phone as "mobilePhone", 
          address_street as "addressStreet", 
          address_number as "addressNumber", 
          address_complement as "addressComplement", 
          address_neighborhood as "addressNeighborhood", 
          address_city as "addressCity", 
          address_state as "addressState", 
          address_zip as "addressZip", 
          address_country as "addressCountry" 
        FROM users WHERE id = $1`,
        [userId]
      );
    } catch (dbError) {
      console.error('Database error fetching user profile:', dbError);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    if (userResult.rows.length === 0) {
      console.error('User not found:', userId);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userProfile = userResult.rows[0];
    console.log('User profile fetched successfully');

    // Fetch career profile data
    let careerResult;
    try {
      careerResult = await pool.query(
        `SELECT 
          id,
          professional_summary,
          career_category,
          certifications,
          pilot_licenses,
          habilitacoes,
          medical_class,
          medical_expiry,
          total_flight_hours,
          pic_hours,
          sic_hours,
          instruction_hours,
          ifr_hours,
          night_hours,
          work_experience,
          education,
          skills,
          languages,
          available_for_work,
          willing_to_relocate,
          preferred_locations,
          preferred_aircraft_types,
          preferred_operation_types,
          contact_phone,
          contact_email,
          linkedin_url,
          profile_visibility,
          resume_photo,
          photo_source,
          last_updated
        FROM career_profiles WHERE user_id = $1`,
        [userId]
      );
    } catch (dbError) {
      console.error('Database error fetching career profile:', dbError);
      // Career profile might not exist, return null instead of error
      careerResult = { rows: [] };
    }

    const careerProfile = careerResult.rows[0] || null;

    return NextResponse.json({
      userProfile,
      careerProfile,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/career/profile:', error);
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    const {
      headline,
      summary,
      licenseType,
      licenseLevel,
      totalFlightHours: totalFlightHoursRaw = 0,
      typeRatings,
      medicalCertificate,
      englishLevel,
      currentPosition,
      currentCompany,
      startDate,
      employmentType,
      industry,
      yearsOfExperience,
      previousJobs,
      highestEducation,
      specializations,
      coreSkills,
      softSkills,
      languages,
      willTravelPercentage,
      desiredSalary,
      jobType,
      profilePhoto,
      photoSource,
      profileVisibility = 'private',
    } = body;

    // Check if career profile exists

    let careerProfileExists = false;
    try {
      const checkResult = await pool.query(
        'SELECT id FROM career_profiles WHERE user_id = $1',
        [userId]
      );
      careerProfileExists = checkResult.rows.length > 0;
      console.log('Career profile exists:', careerProfileExists);
    } catch (dbError) {
      console.error('Error checking career profile existence:', dbError);
      throw dbError;
    }

    const totalFlightHoursValue = Number(totalFlightHoursRaw) || 0;

    // Parse JSON fields
    const workExperienceJson = JSON.stringify({
      currentPosition,
      currentCompany,
      startDate,
      employmentType,
      industry,
    });

    const previousJobsJson = JSON.stringify(previousJobs || []);
    const skillsJson = JSON.stringify({
      coreSkills: coreSkills?.split(',').map((s: string) => s.trim()) || [],
      softSkills: softSkills?.split(',').map((s: string) => s.trim()) || [],
    });

    const languagesJson = JSON.stringify(languages?.split(',').map((l: string) => l.trim()).filter(Boolean) || []);

    if (careerProfileExists) {
      // Update existing career profile
      const updateQuery = `
        UPDATE career_profiles 
        SET 
          professional_summary = $2,
          career_category = $3,
          pilot_licenses = $4,
          habilitacoes = $5,
          medical_class = $6,
          total_flight_hours = $7,
          work_experience = $8,
          education = $9,
          skills = $10,
          languages = $11,
          profile_visibility = $12,
          resume_photo = $13,
          photo_source = $14,
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      try {
        const result = await pool.query(updateQuery, [
          userId,
          summary,
          licenseType,
          JSON.stringify({ type: licenseType, level: licenseLevel, typeRatings }),
          JSON.stringify(typeRatings?.split(',').map((t: string) => t.trim()) || []),
          medicalCertificate,
          totalFlightHoursValue,
          workExperienceJson,
          JSON.stringify({ level: highestEducation, specializations: specializations?.split(',') }),
          skillsJson,
          languagesJson,
          profileVisibility,
          profilePhoto,
          photoSource,
        ]);

        return NextResponse.json({
          message: 'Career profile updated successfully',
          data: result.rows[0],
        });
      } catch (dbError) {
        console.error('Database error updating career profile:', dbError);
        throw dbError;
      }

    } else {
      // Create new career profile
      const insertQuery = `
        INSERT INTO career_profiles (
          user_id,
          professional_summary,
          career_category,
          pilot_licenses,
          habilitacoes,
          medical_class,
          total_flight_hours,
          work_experience,
          education,
          skills,
          languages,
          profile_visibility,
          resume_photo,
          photo_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      try {
        const result = await pool.query(insertQuery, [
          userId,
          summary,
          licenseType,
          JSON.stringify({ type: licenseType, level: licenseLevel, typeRatings }),
          JSON.stringify(typeRatings?.split(',').map((t: string) => t.trim()) || []),
          medicalCertificate,
          totalFlightHoursValue,
          workExperienceJson,
          JSON.stringify({ level: highestEducation, specializations: specializations?.split(',') }),
          skillsJson,
          languagesJson,
          profileVisibility,
          profilePhoto,
          photoSource,
        ]);

        return NextResponse.json(
          {
            message: 'Career profile created successfully',
            data: result.rows[0],
          },
          { status: 201 }
        );
      } catch (dbError) {
        console.error('Database error creating career profile:', dbError);
        throw dbError;
      }

    }
  } catch (error) {
    console.error('Error saving career profile:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Failed to save career profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}
