import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // ============ Authentication ============
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded?.id && !decoded?.userId) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Use id (primary) or userId (fallback) from token payload
    const userIdFromToken = decoded.id || decoded.userId;

    // Check if user has admin/staff privileges
    const adminCheck = await pool.query(
      'SELECT role, email FROM users WHERE id = $1',
      [userIdFromToken]
    );

    if (adminCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userRole = adminCheck.rows[0].role;
    const userEmail = adminCheck.rows[0].email;
    
    const hasAdminAccess = 
      userRole === 'master' || 
      userRole === 'admin' || 
      userRole === 'staff' || 
      userEmail === 'lovetofly.ed@gmail.com';

    if (!hasAdminAccess) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      );
    }

    console.log('[ADMIN STATS] Starting query...');
    const getCount = async (query: string, params: Array<string | number | Date> = []) => {
      const result = await pool.query(query, params);
      const row = result.rows[0] ?? {};
      return Number(row.count ?? row.total ?? 0);
    };

    const safeCount = async (
      primary: { query: string; params?: Array<string | number | Date> },
      fallback?: { query: string; params?: Array<string | number | Date> },
      label?: string
    ) => {
      try {
        return await getCount(primary.query, primary.params);
      } catch (error) {
        console.error(`[ADMIN STATS] Failed ${label ?? 'primary'} query`, error);
        if (!fallback) {
          return 0;
        }
        try {
          return await getCount(fallback.query, fallback.params);
        } catch (fallbackError) {
          console.error(`[ADMIN STATS] Failed ${label ?? 'fallback'} fallback query`, fallbackError);
          return 0;
        }
      }
    };
    // Query counts for dashboard stats (real data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingVerifications,
      pendingListings,
      totalHangars,
      activeBookings,
      bookingsToday,
      totalUsers,
      newUsersToday,
      totalRevenue,
      pendingTraslados,
      pendingTrasladosPilots,
      moderationOpen,
      moderationEscalations,
      pendingInvoices,
      compliancePending,
      complianceAudits,
      marketingActive,
      marketingTotal,
      marketingLeads,
      marketingLeadsToday,
      totalVisits,
      visitsToday,
      totalMessages,
      unreadMessages,
      pendingReports,
      messagesToday,
      inviteCodesGenerated,
      promoCodesGenerated
    ] = await Promise.all([
      // Pending verifications (unverified hangar owners)
      safeCount(
        {
          query: 'SELECT COUNT(*) FROM hangar_owners WHERE verification_status = $1',
          params: ['pending']
        },
        {
          query: 'SELECT COUNT(*) FROM hangar_owners WHERE verification_status = $1',
          params: ['pending']
        },
        'pending verifications'
      ),
      // Pending hangar listings
      safeCount(
        {
          query: 'SELECT COUNT(*) as count FROM hangar_listings WHERE status = $1',
          params: ['pending']
        },
        {
          query: 'SELECT COUNT(*) as count FROM hangar_listings WHERE approval_status = $1',
          params: ['pending_approval']
        },
        'pending listings'
      ),
      // Active/Published hangar listings
      safeCount(
        {
          query: "SELECT COUNT(*) as count FROM hangar_listings WHERE status IN ('active', 'published')"
        },
        {
          query: "SELECT COUNT(*) as count FROM hangar_listings WHERE approval_status = 'approved'"
        },
        'active listings'
      ),
      // Active bookings (pending + confirmed)
      safeCount(
        {
          query: "SELECT COUNT(*) as count FROM hangar_bookings WHERE status IN ('pending', 'confirmed')"
        },
        {
          query: "SELECT COUNT(*) as count FROM hangar_bookings WHERE booking_status IN ('pending', 'confirmed')"
        },
        'active bookings'
      ),
      // Bookings created today
      safeCount(
        {
          query: "SELECT COUNT(*) as count FROM hangar_bookings WHERE created_at >= $1",
          params: [today]
        },
        {
          query: "SELECT COUNT(*) as count FROM bookings WHERE created_at >= $1",
          params: [today]
        },
        'bookings today'
      ),
      // Total users
      safeCount({ query: 'SELECT COUNT(*) as count FROM users' }, { query: 'SELECT 0 as count', params: [] }, 'total users'),
      // New users today
      safeCount({ query: 'SELECT COUNT(*) as count FROM users WHERE created_at >= $1', params: [today] }, { query: 'SELECT 0 as count', params: [] }, 'new users today'),
      // Total revenue from completed bookings
      safeCount(
        { query: "SELECT COALESCE(SUM(total_price), 0) as total FROM hangar_bookings WHERE status = 'completed'" },
        { query: "SELECT COALESCE(SUM(total), 0) as total FROM bookings WHERE booking_status = 'completed'" },
        'total revenue'
      ),
      // Pending traslados requests
      safeCount(
        { query: "SELECT COUNT(*) as count FROM traslados_requests WHERE status = 'new'" },
        { query: "SELECT 0 as count", params: [] },
        'pending traslados'
      ),
      // Pending traslados pilots
      safeCount(
        { query: "SELECT COUNT(*) as count FROM traslados_pilots WHERE status = 'pending'" },
        { query: "SELECT 0 as count", params: [] },
        'pending traslados pilots'
      ),
      // Moderation open cases
      safeCount(
        { query: "SELECT COUNT(*) as count FROM content_reports WHERE status = 'pending'" },
        { query: "SELECT 0 as count", params: [] },
        'moderation open'
      ),
      // Moderation escalations
      safeCount(
        { query: "SELECT COUNT(*) as count FROM user_moderation WHERE is_active = true AND severity IN ('high', 'critical')" },
        { query: "SELECT 0 as count", params: [] },
        'moderation escalations'
      ),
      // Pending invoices
      safeCount(
        { query: "SELECT COUNT(*) as count FROM invoices WHERE status IN ('issued', 'sent', 'received')" },
        { query: "SELECT 0 as count", params: [] },
        'pending invoices'
      ),
      // Compliance pending
      safeCount(
        { query: "SELECT COUNT(*) as count FROM compliance_records WHERE status = 'pending'" },
        { query: "SELECT 0 as count", params: [] },
        'compliance pending'
      ),
      // Compliance audits
      safeCount(
        { query: "SELECT COUNT(*) as count FROM compliance_records WHERE type ILIKE '%audit%'" },
        { query: "SELECT 0 as count", params: [] },
        'compliance audits'
      ),
      // Marketing campaigns active
      safeCount(
        { query: "SELECT COUNT(*) as count FROM marketing_campaigns WHERE status = 'active'" },
        { query: "SELECT 0 as count", params: [] },
        'marketing active'
      ),
      // Marketing campaigns total
      safeCount(
        { query: 'SELECT COUNT(*) as count FROM marketing_campaigns' },
        { query: "SELECT 0 as count", params: [] },
        'marketing total'
      ),
      // Marketing leads total
      safeCount(
        { query: 'SELECT COUNT(*) as count FROM marketing_leads' },
        { query: "SELECT 0 as count", params: [] },
        'marketing leads'
      ),
      // Marketing leads today
      safeCount(
        { query: 'SELECT COUNT(*) as count FROM marketing_leads WHERE created_at >= $1', params: [today] },
        { query: "SELECT 0 as count", params: [] },
        'marketing leads today'
      ),
      // Total portal visits
      safeCount(
        { query: 'SELECT COALESCE(SUM(visit_count), 0) as total FROM portal_analytics' },
        undefined,
        'total visits'
      ),
      // Visits today
      safeCount(
        { query: 'SELECT COALESCE(SUM(visit_count), 0) as total FROM portal_analytics WHERE date = $1', params: [today] },
        undefined,
        'visits today'
      ),
      // Total messages
      safeCount(
        { query: 'SELECT COUNT(*) FROM portal_messages' },
        undefined,
        'total messages'
      ),
      // Unread messages (admin context)
      safeCount(
        { query: "SELECT COUNT(*) as count FROM portal_messages WHERE is_read = false AND sender_type != 'admin'" },
        { query: "SELECT 0 as count", params: [] },
        'unread messages'
      ),
      // Pending reports
      safeCount(
        { query: "SELECT COUNT(*) as count FROM portal_message_reports WHERE status = 'pending'" },
        { query: "SELECT 0 as count", params: [] },
        'pending reports'
      ),
      // Messages sent today
      safeCount(
        { query: 'SELECT COUNT(*) as count FROM portal_messages WHERE created_at >= $1', params: [today] },
        { query: "SELECT 0 as count", params: [] },
        'messages today'
      ),
      // Invite codes generated
      safeCount(
        { query: "SELECT COUNT(*) as count FROM codes WHERE code_type = 'invite' AND is_active = true" },
        { query: "SELECT 0 as count", params: [] },
        'invite codes generated'
      ),
      // Promo codes generated
      safeCount(
        { query: "SELECT COUNT(*) as count FROM codes WHERE code_type = 'promo' AND is_active = true" },
        { query: "SELECT 0 as count", params: [] },
        'promo codes generated'
      )
    ]);

    console.log('[ADMIN STATS] Query results:', {
      pendingVerifications,
      pendingListings,
      totalHangars,
      activeBookings
    });

    return NextResponse.json({
      pendingVerifications,
      pendingListings,
      totalHangars,
      activeBookings,
      totalUsers,
      newUsersToday,
      totalRevenue,
      pendingTraslados,
      pendingTrasladosPilots,
      bookingsToday,
      moderationOpen,
      moderationEscalations,
      pendingInvoices,
      compliancePending,
      complianceAudits,
      marketingActive,
      marketingTotal,
      marketingLeads,
      marketingLeadsToday,
      totalVisits,
      visitsToday,
      totalMessages,
      unreadMessages,
      pendingReports,
      messagesToday,
      inviteCodesGenerated,
      promoCodesGenerated
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json({ message: 'Erro ao buscar stats' }, { status: 500 });
  }
}
