const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');

    // Check if tables exist
    const tables = [
      'portal_messages',
      'moderation_messages',
      'bad_conduct_alerts',
      'portal_message_reports',
      'user_moderation',
      'user_activity_log',
      'users'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 LIMIT 1`,
          [table]
        );
        if (result.rows.length > 0) {
          console.log(`✅ Table ${table} EXISTS`);
          
          // Get all columns
          const colResult = await client.query(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
            [table]
          );
          colResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
          });
        } else {
          console.log(`❌ Table ${table} DOES NOT EXIST`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${table}:`, err.message);
      }
      console.log('');
    }

    // Try some test queries
    console.log('=== TESTING QUERIES ===\n');

    try {
      console.log('Test 1: SELECT from portal_messages with user join');
      const result = await client.query(
        `SELECT m.id, m.sender_user_id, m.recipient_user_id FROM portal_messages m 
         LEFT JOIN users s ON m.sender_user_id = s.id LIMIT 1`,
      );
      console.log(`✅ Query succeeded, rows:`, result.rows.length);
    } catch (err) {
      console.log(`❌ Query failed:`, err.message);
    }

    try {
      console.log('\nTest 2: SELECT from moderation_messages with user join');
      const result = await client.query(
        `SELECT mm.id, mm.sender_user_id, mm.recipient_user_id FROM moderation_messages mm
         LEFT JOIN users s ON mm.sender_user_id = s.id LIMIT 1`,
      );
      console.log(`✅ Query succeeded, rows:`, result.rows.length);
    } catch (err) {
      console.log(`❌ Query failed:`, err.message);
    }

    try {
      console.log('\nTest 3: SELECT from bad_conduct_alerts with user join');
      const result = await client.query(
        `SELECT bca.id, bca.user_id FROM bad_conduct_alerts bca
         LEFT JOIN users u ON bca.user_id = u.id LIMIT 1`,
      );
      console.log(`✅ Query succeeded, rows:`, result.rows.length);
    } catch (err) {
      console.log(`❌ Query failed:`, err.message);
    }

    try {
      console.log('\nTest 4: SELECT from user_moderation table');
      const result = await client.query(
        `SELECT id FROM user_moderation LIMIT 1`,
      );
      console.log(`✅ Query succeeded, rows:`, result.rows.length);
    } catch (err) {
      console.log(`❌ Query failed:`, err.message);
    }

  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
