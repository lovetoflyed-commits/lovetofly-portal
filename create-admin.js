const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('TestAdmin@123', 10);
    
    const result = await pool.query(
      `INSERT INTO users(email, password_hash, first_name, last_name, role, plan)
       VALUES($1, $2, $3, $4, $5, $6)
       ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='master'
       RETURNING id, email, role`,
      ['testadmin@lovetofly.com.br', hashedPassword, 'Admin', 'Test', 'master', 'pro']
    );
    
    console.log('✅ Admin user created:', result.rows[0]);
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
  }
})();
