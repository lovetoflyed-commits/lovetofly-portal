/**
 * Storage Abstraction Layer
 * Handles file uploads, deletions, and URL generation
 * 
 * Supports:
 * - Vercel Blob (production)
 * - Local file system (development)
 */

import { put, del, head } from '@vercel/blob';
import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';

const STORAGE_TYPE = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'vercel-blob';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
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
export async function uploadFile(
  file: File,
  folder: string,
  options?: { maxSize?: number; allowedTypes?: string[] }
): Promise<StorageResult> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
    const allowedTypes = options?.allowedTypes ?? ALLOWED_TYPES;

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    if (STORAGE_TYPE === 'vercel-blob') {
      if (!BLOB_TOKEN) {
        console.warn('BLOB_READ_WRITE_TOKEN not set; falling back to local storage');
        return await uploadToLocal(file, filePath);
      }
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
      const cleanUrl = url.split('?')[0].split('#')[0];
      const localPath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
      const diskPath = path.join(process.cwd(), 'public', localPath);
      await unlink(diskPath);
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
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicRoot = path.join(process.cwd(), 'public');
  const diskPath = path.join(publicRoot, filePath);
  const folder = path.dirname(diskPath);
  await mkdir(folder, { recursive: true });
  await writeFile(diskPath, buffer);
  const url = `/${filePath}`;

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
