const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Testing UUID casting in queries:\n');

    // Test 1: portal_messages with cast
    try {
      await client.query(`
        SELECT m.id, m.sender_user_id::uuid, s.id as user_id
        FROM portal_messages m 
        LEFT JOIN users s ON m.sender_user_id::uuid = s.id 
        LIMIT 1
      `);
      console.log('✅ portal_messages query with cast works!');
    } catch (err) {
      console.log('❌ portal_messages:', err.message.split('\n')[0]);
    }

    // Test 2: moderation_messages with cast
    try {
      await client.query(`
        SELECT mm.id, mm.sender_user_id::uuid
        FROM moderation_messages mm
        LEFT JOIN users s ON mm.sender_user_id::uuid = s.id 
        LIMIT 1
      `);
      console.log('✅ moderation_messages query with cast works!');
    } catch (err) {
      console.log('❌ moderation_messages:', err.message.split('\n')[0]);
    }

    // Test 3: bad_conduct_alerts with cast
    try {
      await client.query(`
        SELECT bca.id, bca.user_id::uuid
        FROM bad_conduct_alerts bca
        LEFT JOIN users u ON bca.user_id::uuid = u.id 
        LIMIT 1
      `);
      console.log('✅ bad_conduct_alerts query with cast works!');
    } catch (err) {
      console.log('❌ bad_conduct_alerts:', err.message.split('\n')[0]);
    }

    // Test 4: users with user_access_status
    try {
      await client.query(`
        SELECT u.id
        FROM users u
        LEFT JOIN user_access_status uas ON u.id = uas.user_id 
        LIMIT 1
      `);
      console.log('✅ users with user_access_status works!');
    } catch (err) {
      console.log('❌ users join:', err.message.split('\n')[0]);
    }

  } finally {
    client.release();
    await pool.end();
  }
})();
