#!/usr/bin/env node

/**
 * Migration runner for Netlify deployment
 * This script runs all pending database migrations before the app starts
 * It's called from netlify.toml before the build process
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_applied (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${files.length} migration files`);
    
    // Apply each migration
    for (const file of files) {
      // Check if already applied
      const result = await client.query(
        'SELECT * FROM migrations_applied WHERE migration_name = $1',
        [file]
      );
      
      if (result.rows.length > 0) {
        console.log(`✓ ${file} (already applied)`);
        continue;
      }
      
      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await client.query(sql);
        // Record that migration was applied
        await client.query(
          'INSERT INTO migrations_applied (migration_name) VALUES ($1)',
          [file]
        );
        console.log(`✅ ${file}`);
      } catch (error) {
        console.error(`❌ ${file}:`, error.message);
        throw error;
      }
    }
    
    console.log('✨ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations();
