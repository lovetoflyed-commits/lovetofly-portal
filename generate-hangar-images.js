#!/usr/bin/env node
/**
 * Generate realistic hangar images using unsplash API and link to listings
 * Creates beautiful, real hangar photos from stock photography
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo';
const HANGARS_DIR = path.join(__dirname, 'public', 'hangars');

const HANGAR_SEARCHES = [
  'aircraft hangar',
  'airplane hangar storage',
  'aviation hangar',
  'hangar airport',
  'aviation facility',
  'aircraft storage',
  'hangar building',
  'large warehouse industrial',
  'aircraft maintenance facility',
  'airport infrastructure'
];

async function fetchImage(query, retries = 3) {
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.urls && json.urls.regular) {
            resolve(json.urls.regular);
          } else if (retries > 0) {
            fetchImage(query, retries - 1).then(resolve).catch(reject);
          } else {
            reject(new Error('No image URL found'));
          }
        } catch (e) {
          if (retries > 0) {
            fetchImage(query, retries - 1).then(resolve).catch(reject);
          } else {
            reject(e);
          }
        }
      });
    }).on('error', reject);
  });
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filename).then(resolve).catch(reject);
        return;
      }
      
      const file = fs.createWriteStream(filename);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function generateImages() {
  console.log('🖼️  Generating hangar images...\n');
  
  if (!fs.existsSync(HANGARS_DIR)) {
    fs.mkdirSync(HANGARS_DIR, { recursive: true });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get all hangars
    const result = await pool.query(`
      SELECT id, hangar_number, aerodrome_name 
      FROM hangar_listings 
      ORDER BY id ASC
      LIMIT 20
    `);

    const listings = result.rows;
    console.log(`Found ${listings.length} listings to image\n`);

    // Check if image_url column exists, if not add it
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hangar_listings' AND column_name = 'image_url'
    `);

    if (colCheck.rows.length === 0) {
      console.log('📌 Adding image_url column...');
      await pool.query(`
        ALTER TABLE hangar_listings 
        ADD COLUMN image_url VARCHAR(500)
      `);
      console.log('✅ Column added\n');
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < listings.length; i++) {
      const { id, hangar_number, aerodrome_name } = listings[i];
      const searchQuery = HANGAR_SEARCHES[i % HANGAR_SEARCHES.length];
      const filename = path.join(HANGARS_DIR, `hangar-${id}.jpg`);

      try {
        // Skip if already exists
        if (fs.existsSync(filename)) {
          console.log(`⏭️  Hangar ${id} (${hangar_number}) - Image exists, skipping`);
          successCount++;
          continue;
        }

        console.log(`📥 Hangar ${id} (${hangar_number}) - Fetching from: "${searchQuery}"`);
        
        const imageUrl = await fetchImage(searchQuery);
        await downloadImage(imageUrl, filename);

        // Update DB
        await pool.query(
          'UPDATE hangar_listings SET image_url = $1 WHERE id = $2',
          [`/hangars/hangar-${id}.jpg`, id]
        );

        console.log(`✅ Hangar ${id} (${hangar_number}) - Downloaded & linked`);
        successCount++;

        // Rate limiting - 1 request per second for Unsplash free tier
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } catch (error) {
        console.error(`❌ Hangar ${id} (${hangar_number}) - Failed:`, error.message);
        failCount++;
        
        // Set placeholder
        await pool.query(
          'UPDATE hangar_listings SET image_url = $1 WHERE id = $2',
          [`/hangars/placeholder-hangar.jpg`, id]
        );
      }
    }

    console.log(`\n📊 Results: ✅ ${successCount} Success | ❌ ${failCount} Failed`);
    console.log('💾 All listings linked to images in database');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Alternative: Use static placeholder images if no API key
async function generatePlaceholders() {
  console.log('🎨 Generating placeholder hangar images...\n');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(`
      SELECT id, hangar_number 
      FROM hangar_listings 
      ORDER BY id ASC
      LIMIT 20
    `);

    // Check if image_url column exists
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hangar_listings' AND column_name = 'image_url'
    `);

    if (colCheck.rows.length === 0) {
      console.log('📌 Adding image_url column...');
      await pool.query(`
        ALTER TABLE hangar_listings 
        ADD COLUMN image_url VARCHAR(500)
      `);
    }

    // Update all with placeholder - can be replaced later
    for (const { id, hangar_number } of result.rows) {
      const variants = ['aircraft-01', 'hangar-02', 'storage-03', 'facility-04', 'aerospace-05'];
      const variant = variants[id % variants.length];
      const imageUrl = `https://images.unsplash.com/photo-1576766381280-ce653a87fe8f?auto=format&fit=crop&w=800&q=60&ixlib=rb-4.0.3`;
      
      await pool.query(
        'UPDATE hangar_listings SET image_url = $1 WHERE id = $2',
        [imageUrl, id]
      );
      
      console.log(`✅ Hangar ${id} (${hangar_number}) - Linked to stock image`);
    }

    console.log('\n📊 All 20 listings linked to professional hangar photos');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

// Check API key and choose strategy
if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'demo') {
  console.log('ℹ️  No Unsplash API key found. Using stock photo links instead.\n');
  console.log('To enable local image download, set UNSPLASH_ACCESS_KEY in .env.local\n');
  generatePlaceholders();
} else {
  generateImages();
}
