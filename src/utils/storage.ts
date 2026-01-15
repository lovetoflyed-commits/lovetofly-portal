/**
 * Storage Abstraction Layer
 * Handles file uploads, deletions, and URL generation
 * 
 * Supports:
 * - Vercel Blob (production)
 * - Local file system (development)
 */

import { put, del, head } from '@vercel/blob';

const STORAGE_TYPE = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'vercel-blob';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface StorageResult {
  url: string;
  fileName: string;
  size: number;
}

/**
 * Upload a file to storage
 * @param file - File to upload
 * @param folder - Folder path (e.g., 'hangar-photos', 'user-avatars')
 * @returns Storage result with URL
 */
export async function uploadFile(file: File, folder: string): Promise<StorageResult> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    if (STORAGE_TYPE === 'vercel-blob') {
      return await uploadToVercelBlob(file, filePath);
    } else if (STORAGE_TYPE === 'local') {
      return await uploadToLocal(file, filePath);
    } else {
      throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from storage
 * @param url - URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    if (!url) {
      throw new Error('No URL provided');
    }

    if (STORAGE_TYPE === 'vercel-blob') {
      await del(url);
    } else if (STORAGE_TYPE === 'local') {
      // Local deletion would require file system access
      // For now, just log it
      console.log('Local file deletion not implemented:', url);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file info from storage
 * @param url - URL of the file
 */
export async function getFileInfo(url: string): Promise<{ size: number; type: string }> {
  try {
    if (STORAGE_TYPE === 'vercel-blob') {
      const blob = await head(url);
      return {
        size: blob.size,
        type: blob.contentType || 'application/octet-stream',
      };
    }
    return { size: 0, type: 'unknown' };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Upload to Vercel Blob storage
 */
async function uploadToVercelBlob(file: File, filePath: string): Promise<StorageResult> {
  const blob = await put(filePath, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    fileName: filePath,
    size: file.size,
  };
}

/**
 * Upload to local file system (development)
 */
async function uploadToLocal(file: File, filePath: string): Promise<StorageResult> {
  // For development, we simulate storage by returning a data URL
  // In production, use Vercel Blob
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const url = `data:${file.type};base64,${base64}`;

  return {
    url,
    fileName: filePath,
    size: file.size,
  };
}

/**
 * Validate image dimensions
 * @param file - File to validate
 * @param minWidth - Minimum width in pixels
 * @param minHeight - Minimum height in pixels
 */
export async function validateImageDimensions(
  file: File,
  minWidth: number = 400,
  minHeight: number = 300
): Promise<{ valid: boolean; width: number; height: number; message?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          resolve({
            valid: false,
            width: img.width,
            height: img.height,
            message: `Image must be at least ${minWidth}x${minHeight} pixels`,
          });
        } else {
          resolve({
            valid: true,
            width: img.width,
            height: img.height,
          });
        }
      };
      img.onerror = () => {
        resolve({
          valid: false,
          width: 0,
          height: 0,
          message: 'Invalid image file',
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
