#!/usr/bin/env node
/**
 * Migrate images from local storage to AWS S3
 * Usage: node scripts/migrate-images-to-s3.js
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Only works if migrating from local to S3
if (!process.env.AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
  console.error('❌ AWS credentials not found in .env.local');
  console.error('Set: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getListingsWithLocalImages() {
  const result = await pool.query(
    `SELECT id, image_url 
     FROM hangar_listings 
     WHERE image_url LIKE $1 AND image_url IS NOT NULL`,
    ['%/hangars/%']
  );
  return result.rows;
}

async function uploadToS3(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    })
  );

  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
}

async function migrateImages() {
  console.log('🔄 Starting image migration from local to S3...\n');

  const listings = await getListingsWithLocalImages();
  console.log(`Found ${listings.length} listings with local images\n`);

  let successCount = 0;
  let failCount = 0;

  for (const listing of listings) {
    try {
      // Extract filename from URL
      const filename = listing.image_url.split('/').pop();
      const localPath = path.join(process.cwd(), 'public', 'hangars', filename);

      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  File not found: ${filename} (skipping)`);
        failCount++;
        continue;
      }

      // Upload to S3
      const s3Key = `hangars/${listing.id}/${filename}`;
      const newUrl = await uploadToS3(localPath, s3Key);

      // Update database
      await pool.query(
        'UPDATE hangar_listings SET image_url = $1, image_key = $2 WHERE id = $3',
        [newUrl, s3Key, listing.id]
      );

      // Delete local file
      fs.unlinkSync(localPath);

      console.log(`✅ Listing ${listing.id}: Migrated to S3`);
      successCount++;
    } catch (error) {
      console.error(`❌ Listing ${listing.id}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Migration complete: ✅ ${successCount} | ❌ ${failCount}`);
  console.log('💾 Don\'t forget to update .env.local with IMAGE_STORAGE_PROVIDER=s3');

  await pool.end();
}

migrateImages().catch(console.error);
