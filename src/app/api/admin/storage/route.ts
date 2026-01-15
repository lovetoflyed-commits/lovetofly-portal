import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';
import { getStorageStats, checkStorageAlerts } from '@/utils/storage-monitor';

// Admin API to monitor storage usage
// GET /api/admin/storage - Get storage statistics
// POST /api/admin/storage/acknowledge - Acknowledge an alert

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !['MASTER', 'ADMIN', 'STAFF'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get storage stats
    const stats = await getStorageStats();
    const alertCheck = await checkStorageAlerts();

    // Get unacknowledged alerts
    const alertsResult = await pool.query(`
      SELECT id, alert_type, alert_level, total_size_bytes, photo_count, message, created_at
      FROM storage_alerts
      WHERE acknowledged = FALSE
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get recent photo uploads (last 7 days)
    const recentUploads = await pool.query(`
      SELECT 
        DATE(created_at) as upload_date,
        COUNT(*) as photo_count,
        SUM(file_size) as total_bytes
      FROM hangar_photos
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND photo_data IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY upload_date DESC
    `);

    // Get photos per listing distribution
    const distribution = await pool.query(`
      SELECT 
        listing_id,
        COUNT(*) as photo_count,
        SUM(file_size) as total_bytes
      FROM hangar_photos
      WHERE photo_data IS NOT NULL
      GROUP BY listing_id
      ORDER BY total_bytes DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalPhotos: stats.totalPhotos,
        totalSizeMB: stats.totalSizeMB,
        usagePercent: stats.usagePercent,
        estimatedCapacityMB: stats.estimatedCapacity,
        remainingPhotos: stats.remainingPhotos,
        alertLevel: stats.alertLevel,
      },
      currentAlert: alertCheck,
      unacknowledgedAlerts: alertsResult.rows,
      recentUploads: recentUploads.rows.map(row => ({
        date: row.upload_date,
        photoCount: parseInt(row.photo_count),
        totalMB: Math.round((parseInt(row.total_bytes) || 0) / 1024 / 1024 * 100) / 100,
      })),
      topListings: distribution.rows.map(row => ({
        listingId: row.listing_id,
        photoCount: parseInt(row.photo_count),
        totalKB: Math.round((parseInt(row.total_bytes) || 0) / 1024),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage stats', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !['MASTER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { alertId, action } = body;

    if (action === 'acknowledge' && alertId) {
      await pool.query(`
        UPDATE storage_alerts 
        SET acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = NOW()
        WHERE id = $2
      `, [user.id, alertId]);

      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing storage action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error?.message },
      { status: 500 }
    );
  }
}
