const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edsonassumpcao@localhost:5432/lovetofly-portal'
});

(async () => {
  try {
    console.log('Creating career_profiles table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS career_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        resume_file_url TEXT,
        resume_file_name VARCHAR(255),
        resume_uploaded_at TIMESTAMP,
        professional_summary TEXT,
        career_category VARCHAR(50),
        certifications TEXT,
        pilot_licenses TEXT,
        habilitacoes TEXT,
        medical_class VARCHAR(50),
        medical_expiry DATE,
        total_flight_hours INTEGER,
        pic_hours INTEGER,
        sic_hours INTEGER,
        instruction_hours INTEGER,
        ifr_hours INTEGER,
        night_hours INTEGER,
        work_experience TEXT,
        education TEXT,
        skills TEXT,
        languages TEXT,
        available_for_work BOOLEAN DEFAULT true,
        willing_to_relocate BOOLEAN DEFAULT false,
        preferred_locations TEXT,
        preferred_aircraft_types TEXT,
        preferred_operation_types TEXT,
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        linkedin_url TEXT,
        profile_visibility VARCHAR(50) DEFAULT 'private',
        resume_photo TEXT,
        photo_source VARCHAR(50) DEFAULT 'portal',
        profile_completed_percentage INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ career_profiles table created successfully');
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_career_profiles_user_id ON career_profiles(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_career_profiles_available ON career_profiles(available_for_work)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_career_profiles_visibility ON career_profiles(profile_visibility)');
    console.log('✅ Indexes created successfully');
    
    // Verify table
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'career_profiles'
      ORDER BY ordinal_position
    `);
    console.log('✅ Table has', result.rows.length, 'columns');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
