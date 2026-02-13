const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    const migration = fs.readFileSync(
      path.join(__dirname, 'src/migrations/105_create_messaging_tables_integer_fix.sql'),
      'utf8'
    );

    console.log('Applying migration 105_create_messaging_tables_integer_fix.sql...');
    
    // Split by ; and execute each statement separately
    const statements = migration.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement + ';');
      }
    }
    
    console.log('✅ Migration applied success    console.log('✅ Migration applied success    console.log('✅ Migration applied succeSELECT table_name 
      FROM info      FROM info    es 
      WHERE table_schema = 'public' 
      AND table_name IN ('moderation_messages',      AND table_name I '      AND table_name IN ('moderation_mess')
                                                                                      ch  k.rows.forEach(row => {
      console      console      console      cons })      
    // Verify column types
    const col    const col    const col    const col    const col    const col    const col    co   FRO    const con    cma.columns 
      WHERE table_name IN ('portal_messages', 'moderation_messages', 'bad_conduct_      WHERE table_name IN ('portal_messages', 'modera OR      WHERE table_ column_name
    `);
    
    console.log('\n📊   er    console.log('\n📊   er    cons.forEa    console.log('\n📊le.log(    console.log('\n📊   er    console.log $    coata_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
