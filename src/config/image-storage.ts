/**
 * Image Storage Configuration
 * 
 * Supports:
 * 1. Local storage (development) - public/hangars/
 * 2. AWS S3 (production) - install: npm install @aws-sdk/client-s3
 * 3. Cloudinary (alternative) - install: npm install cloudinary
 */

let S3Client: any;
let PutObjectCommand: any;
let cloudinary: any;

try {
  ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
} catch {
  // S3 not installed - will be initialized on demand
}

try {
  cloudinary = require('cloudinary');
} catch {
  // Cloudinary not installed - will be initialized on demand
}

export type StorageProvider = 'local' | 's3' | 'cloudinary';

export class ImageStorage {
  private provider: StorageProvider;
  private s3Client?: any;

  constructor(provider: StorageProvider = 'local') {
    this.provider = provider;

    if (provider === 's3') {
      if (!S3Client) {
        throw new Error(
          'AWS SDK not installed. Run: npm install @aws-sdk/client-s3'
        );
      }
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }

    if (provider === 'cloudinary') {
      if (!cloudinary) {
        throw new Error('Cloudinary not installed. Run: npm install cloudinary');
      }
      cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  /**
   * Upload hangar image
   */
  async uploadHangarImage(
    file: Buffer,
    listingId: number,
    filename: string
  ): Promise<{ url: string; key: string }> {
    switch (this.provider) {
      case 's3':
        return this.uploadToS3(file, listingId, filename);
      case 'cloudinary':
        return this.uploadToCloudinary(file, listingId, filename);
      case 'local':
      default:
        return this.uploadLocal(file, listingId, filename);
    }
  }

  /**
   * Local storage (development)
   */
  private uploadLocal(
    file: Buffer,
    listingId: number,
    filename: string
  ): { url: string; key: string } {
    const fs = require('fs');
    const path = require('path');

    const uploadDir = path.join(process.cwd(), 'public', 'hangars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, file);

    const url = `/hangars/${filename}`;
    return { url, key: filename };
  }

  /**
   * AWS S3 storage (production)
   */
  private async uploadToS3(
    file: Buffer,
    listingId: number,
    filename: string
  ): Promise<{ url: string; key: string }> {
    if (!this.s3Client || !PutObjectCommand) {
      throw new Error('S3 client not initialized');
    }

    const bucket = process.env.AWS_S3_BUCKET || 'lovetofly-hangars';
    const key = `hangars/${listingId}/${filename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      })
    );

    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Cloudinary storage (alternative)
   */
  private async uploadToCloudinary(
    file: Buffer,
    listingId: number,
    filename: string
  ): Promise<{ url: string; key: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `hangars/${listingId}`,
          public_id: filename.replace(/\.[^.]+$/, ''), // Remove extension
          resource_type: 'auto',
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else
            resolve({
              url: result.secure_url,
              key: result.public_id,
            });
        }
      );

      stream.end(file);
    });
  }
}

export function getImageStorage(): ImageStorage {
  const provider = (process.env.IMAGE_STORAGE_PROVIDER ||
    'local') as StorageProvider;
  return new ImageStorage(provider);
}
