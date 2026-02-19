import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { getAdminUser } from '@/utils/adminAuth';

/**
 * GET /api/admin/pix/stats
 * Get PIX payment statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await getAdminUser(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[PIX Stats] Fetching stats for admin:', adminUser.id);

    // Get payment statistics using safe fallback queries
    const stats: any = {};

    // Total pending payments
    try {
      const pendingResult = await pool.query(
        `SELECT COUNT(*) as count FROM pix_payments 
         WHERE status = 'pending' AND expires_at > NOW()`
      );
      stats.pendingPayments = Number(pendingResult.rows[0]?.count ?? 0);
    } catch (e) {
      console.log('[PIX Stats] Pending payments query failed, using 0');
      stats.pendingPayments = 0;
    }

    // Total completed payments (today)
    try {
      const completedResult = await pool.query(
        `SELECT COUNT(*) as count FROM pix_payments 
         WHERE status = 'completed' AND payment_date >= CURRENT_DATE`
      );
      stats.completedToday = Number(completedResult.rows[0]?.count ?? 0);
    } catch (e) {
      console.log('[PIX Stats] Completed today query failed, using 0');
      stats.completedToday = 0;
    }

    // Total revenue from PIX (today)
    try {
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments 
         WHERE status = 'completed' AND payment_date >= CURRENT_DATE`
      );
      const centAmount = Number(revenueResult.rows[0]?.total ?? 0);
      stats.revenueToday = (centAmount / 100).toFixed(2);
    } catch (e) {
      console.log('[PIX Stats] Revenue today query failed, using 0');
      stats.revenueToday = '0.00';
    }

    // Total revenue from PIX (all time)
    try {
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments 
         WHERE status = 'completed'`
      );
      const centAmount = Number(totalRevenueResult.rows[0]?.total ?? 0);
      stats.totalRevenue = (centAmount / 100).toFixed(2);
    } catch (e) {
      console.log('[PIX Stats] Total revenue query failed, using 0');
      stats.totalRevenue = '0.00';
    }

    // Expired payments (potential losses)
    try {
      const expiredResult = await pool.query(
        `SELECT COUNT(*) as count FROM pix_payments 
         WHERE status = 'pending' AND expires_at <= NOW()`
      );
      stats.expiredPayments = Number(expiredResult.rows[0]?.count ?? 0);
    } catch (e) {
      console.log('[PIX Stats] Expired payments query failed, using 0');
      stats.expiredPayments = 0;
    }

    // Payment methods breakdown (for context)
    try {
      const methodsResult = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN payment_type = 'membership' THEN 1 ELSE 0 END), 0) as membership_count,
          COALESCE(SUM(CASE WHEN payment_type = 'booking' THEN 1 ELSE 0 END), 0) as booking_count
         FROM pix_payments WHERE status = 'completed' AND payment_date >= CURRENT_DATE`
      );
      stats.completedByType = {
        membership: Number(methodsResult.rows[0]?.membership_count ?? 0),
        booking: Number(methodsResult.rows[0]?.booking_count ?? 0)
      };
    } catch (e) {
      console.log('[PIX Stats] Payment methods breakdown failed');
      stats.completedByType = { membership: 0, booking: 0 };
    }

    // Recent transactions (last 10)
    try {
      const recentResult = await pool.query(
        `SELECT 
          id, user_id, amount, status, payment_type, payment_date, created_at
         FROM pix_payments 
         ORDER BY created_at DESC 
         LIMIT 10`
      );
      stats.recentTransactions = recentResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        amount: (row.amount / 100).toFixed(2),
        status: row.status,
        type: row.payment_type,
        completedAt: row.payment_date,
        createdAt: row.created_at
      }));
    } catch (e) {
      console.log('[PIX Stats] Recent transactions query failed');
      stats.recentTransactions = [];
    }

    console.log('[PIX Stats] Stats compiled:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PIX Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PIX statistics' },
      { status: 500 }
    );
  }
}
