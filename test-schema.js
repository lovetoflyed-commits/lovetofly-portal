const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:Master@51@localhost:5432/lovetofly-portal'
});

(async () => {
  try {
    console.log('Testing database schema...\n');

    // Check if users table exists
    const usersTableCheck = await pool.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    console.log('✓ users table exists:', usersTableCheck.rows.length > 0);

    // Check if user_access_status table exists
    const uasTableCheck = await pool.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_name = 'user_access_status'
    `);
    console.log('✓ user_access_status table exists:', uasTableCheck.rows.length > 0);

    if (uasTableCheck.rows.length > 0) {
      // Get columns of user_access_status
      const uasColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_access_status'
      `);
      console.log('\n  Columns in user_access_status:');
      uasColumns.rows.      uasColumns.rows.      uasColumns.rows.      uasColumns.rows.row.data_type})`);
      });
                                                  g
    console.log('\nTesting LEFT JOIN    console.log('\nTesting LEFT JOIN    conso`
      SELECT u.id, u.first_name, uas.access_lev      SELECT u.id, u.first_nameT   IN user_access_status uas ON u.id = uas.user_id
      LIMIT 1
    `);
    console.log('✓ LEFT JOIN works, returned rows:', joinTes    console.log('✓ LEFT JOIN worl users
                                               COU                                         log('✓ Tota                                               COU                                    :', error.message);
  } finally {
    await pool.end();
  }
})();
