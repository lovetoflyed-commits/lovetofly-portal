const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edsonassumpcao@localhost:5432/lovetofly-portal'
});

(async () => {
  try {
    // Test with a real user ID (assuming user 1 exists)
    const userId = 1;
    
    // Try inserting a test career profile
    const result = await pool.query(
      `INSERT INTO career_profiles (
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
        languages
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
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
        last_updated = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId,
        'Test professional summary',
        'Commercial Pilot',
        JSON.stringify({ type: 'CPL', level: 'Commercial' }),
        JSON.stringify(['EASA']),
        'Class 1',
        1500,
        JSON.stringify({ currentPosition: 'Captain', currentCompany: 'Test Airline' }),
        JSON.stringify({ level: 'Bachelor' }),
        JSON.stringify({ coreSkills: ['Flying', 'Leadership'] }),
        JSON.stringify(['English', 'Portuguese'])
      ]
    );
    
    console.log('✅ Insert/Update successful');
    console.log('Data:', result.rows[0]);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
