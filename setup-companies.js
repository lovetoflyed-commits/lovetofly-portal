const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const exists = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='companies')`
    );
    if (!exists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS companies(
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          cnpj VARCHAR(18),
          description TEXT,
          website VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
      `);
      console.log('✅ companies table created');
    } else {
      console.log('✅ companies table already exists');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
