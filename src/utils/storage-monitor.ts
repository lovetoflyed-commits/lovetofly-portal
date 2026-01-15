// Storage monitoring utility for hangar photos
// Monitors database storage usage and triggers alerts when thresholds are reached

import pool from '@/config/db';

// Storage limits and thresholds (in bytes)
const STORAGE_CONFIG = {
  MAX_PHOTO_SIZE: 200 * 1024, // 200KB per photo
  MAX_PHOTOS_PER_LISTING: 5,
  
  // Alert thresholds (percentage of estimated safe capacity)
  // Based on Neon free tier ~512MB, reserving ~300MB for photos
  SAFE_CAPACITY_BYTES: 300 * 1024 * 1024, // 300MB for photos
  
  THRESHOLDS: {
    WARNING: 70,   // 70% - Yellow alert
    CRITICAL: 85,  // 85% - Orange alert  
    EMERGENCY: 95, // 95% - Red alert, block uploads
  },
};

export interface StorageStats {
  totalPhotos: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  usagePercent: number;
  estimatedCapacity: number;
  remainingPhotos: number;
  alertLevel: 'ok' | 'warning' | 'critical' | 'emergency';
}

export interface AlertResult {
  shouldAlert: boolean;
  level: number;
  type: string;
  message: string;
}

/**
 * Get current storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as photo_count,
      COALESCE(SUM(file_size), 0) as total_bytes
    FROM hangar_photos 
    WHERE photo_data IS NOT NULL
  `);

  const totalPhotos = parseInt(result.rows[0].photo_count) || 0;
  const totalSizeBytes = parseInt(result.rows[0].total_bytes) || 0;
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  const usagePercent = (totalSizeBytes / STORAGE_CONFIG.SAFE_CAPACITY_BYTES) * 100;
  
  // Estimate remaining capacity
  const avgPhotoSize = totalPhotos > 0 ? totalSizeBytes / totalPhotos : STORAGE_CONFIG.MAX_PHOTO_SIZE;
  const remainingBytes = STORAGE_CONFIG.SAFE_CAPACITY_BYTES - totalSizeBytes;
  const remainingPhotos = Math.floor(remainingBytes / avgPhotoSize);

  // Determine alert level
  let alertLevel: StorageStats['alertLevel'] = 'ok';
  if (usagePercent >= STORAGE_CONFIG.THRESHOLDS.EMERGENCY) {
    alertLevel = 'emergency';
  } else if (usagePercent >= STORAGE_CONFIG.THRESHOLDS.CRITICAL) {
    alertLevel = 'critical';
  } else if (usagePercent >= STORAGE_CONFIG.THRESHOLDS.WARNING) {
    alertLevel = 'warning';
  }

  return {
    totalPhotos,
    totalSizeBytes,
    totalSizeMB: Math.round(totalSizeMB * 100) / 100,
    usagePercent: Math.round(usagePercent * 10) / 10,
    estimatedCapacity: Math.round(STORAGE_CONFIG.SAFE_CAPACITY_BYTES / (1024 * 1024)),
    remainingPhotos: Math.max(0, remainingPhotos),
    alertLevel,
  };
}

/**
 * Check if an alert should be triggered based on current usage
 */
export async function checkStorageAlerts(): Promise<AlertResult> {
  const stats = await getStorageStats();
  
  // Check if we already sent an alert for this level recently (within 24 hours)
  const recentAlert = await pool.query(`
    SELECT id FROM storage_alerts 
    WHERE alert_level = $1 
    AND created_at > NOW() - INTERVAL '24 hours'
    LIMIT 1
  `, [Math.floor(stats.usagePercent / 10) * 10]); // Round to nearest 10

  if (recentAlert.rows.length > 0) {
    return {
      shouldAlert: false,
      level: stats.usagePercent,
      type: stats.alertLevel,
      message: 'Alert already sent recently',
    };
  }

  // Determine if we should alert
  if (stats.alertLevel === 'emergency') {
    return {
      shouldAlert: true,
      level: 95,
      type: 'emergency',
      message: `🔴 URGENTE: Armazenamento em ${stats.usagePercent.toFixed(1)}%! Uploads bloqueados. ${stats.totalSizeMB}MB de ${stats.estimatedCapacity}MB usados. Migrar para armazenamento em nuvem imediatamente!`,
    };
  }

  if (stats.alertLevel === 'critical') {
    return {
      shouldAlert: true,
      level: 85,
      type: 'critical',
      message: `🟠 CRÍTICO: Armazenamento em ${stats.usagePercent.toFixed(1)}%. Restam aproximadamente ${stats.remainingPhotos} fotos. Iniciar migração para armazenamento em nuvem.`,
    };
  }

  if (stats.alertLevel === 'warning') {
    return {
      shouldAlert: true,
      level: 70,
      type: 'warning',
      message: `🟡 AVISO: Armazenamento em ${stats.usagePercent.toFixed(1)}%. Aproximadamente ${stats.remainingPhotos} fotos restantes antes de atingir o limite. Planejar migração.`,
    };
  }

  return {
    shouldAlert: false,
    level: stats.usagePercent,
    type: 'ok',
    message: `✅ Armazenamento OK: ${stats.usagePercent.toFixed(1)}% utilizado`,
  };
}

/**
 * Record an alert in the database
 */
export async function recordAlert(alert: AlertResult, stats: StorageStats): Promise<void> {
  await pool.query(`
    INSERT INTO storage_alerts (alert_type, alert_level, total_size_bytes, photo_count, message)
    VALUES ($1, $2, $3, $4, $5)
  `, [alert.type, alert.level, stats.totalSizeBytes, stats.totalPhotos, alert.message]);
}

/**
 * Check if uploads should be blocked (emergency level)
 */
export async function shouldBlockUploads(): Promise<boolean> {
  const stats = await getStorageStats();
  return stats.alertLevel === 'emergency';
}

/**
 * Validate photo file size before upload
 */
export function validatePhotoSize(fileSizeBytes: number): { valid: boolean; message?: string } {
  if (fileSizeBytes > STORAGE_CONFIG.MAX_PHOTO_SIZE) {
    return {
      valid: false,
      message: `Arquivo muito grande (${Math.round(fileSizeBytes / 1024)}KB). Tamanho máximo permitido: ${STORAGE_CONFIG.MAX_PHOTO_SIZE / 1024}KB`,
    };
  }
  return { valid: true };
}

/**
 * Get count of photos for a listing
 */
export async function getPhotoCount(listingId: string | number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) FROM hangar_photos WHERE listing_id = $1',
    [listingId]
  );
  return parseInt(result.rows[0].count) || 0;
}

/**
 * Check if listing can accept more photos
 */
export async function canAddPhoto(listingId: string | number): Promise<{ allowed: boolean; message?: string }> {
  const count = await getPhotoCount(listingId);
  
  if (count >= STORAGE_CONFIG.MAX_PHOTOS_PER_LISTING) {
    return {
      allowed: false,
      message: `Limite de ${STORAGE_CONFIG.MAX_PHOTOS_PER_LISTING} fotos por anúncio atingido`,
    };
  }

  const blocked = await shouldBlockUploads();
  if (blocked) {
    return {
      allowed: false,
      message: 'Uploads temporariamente suspensos. Capacidade máxima de armazenamento atingida. Entre em contato com o suporte.',
    };
  }

  return { allowed: true };
}

export { STORAGE_CONFIG };
