// Page: HangarShare V2 Dashboard - Overview Tab
// File: src/app/admin/hangarshare-v2/page.tsx
// Purpose: Main overview dashboard for HangarShare V2

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { MetricCard, MetricsGrid } from '@/components/hangarshare-v2/MetricCard';
import { RevenueChart } from '@/components/hangarshare-v2/RevenueChart';
import { OccupancyChart } from '@/components/hangarshare-v2/OccupancyChart';
import { FeatureFlagWrapper } from '@/components/FeatureFlagWrapper';

interface OverviewStats {
  heroMetrics: Array<{
    title: string;
    value: number | string;
    icon: string;
    status?: 'healthy' | 'warning' | 'critical';
  }>;
  financialMetrics: {
    monthlyRevenue: number;
    totalRevenue: number;
    trend: number;
    status: string;
  };
  occupancyMetrics: {
    current: number;
    trend: number;
    status: string;
  };
  bookingMetrics: {
    active: number;
    pending: number;
    completed: number;
  };
  alerts: {
    count: number;
    items: Array<{
      id: string;
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
      createdAt: string;
    }>;
  };
  topListings: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    listingName: string;
    ownerName: string;
    status: string;
    checkIn: string;
  }>;
}

export default function HangarShareV2DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Sample data for charts (in production, this comes from the API)
  const sampleRevenueData = [
    { month: 'Jan', revenue: 8000, target: 9000 },
    { month: 'Feb', revenue: 9500, target: 9000 },
    { month: 'Mar', revenue: 7200, target: 9000 },
    { month: 'Apr', revenue: 11800, target: 9000 },
    { month: 'May', revenue: 12500, target: 9000 },
  ];

  const sampleOccupancyData = [
    { date: 'Jan 1', occupancy: 65 },
    { date: 'Jan 8', occupancy: 72 },
    { date: 'Jan 15', occupancy: 68 },
    { date: 'Jan 22', occupancy: 78 },
    { date: 'Jan 29', occupancy: 82 },
  ];

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/hangarshare/v2/overview-stats');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch statistics');
      }

      setStats(data.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[Dashboard] Error fetching stats:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [user, router]);


  // Fallback to old dashboard
  const FallbackDashboard = () => (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-yellow-900 mb-2">Old Dashboard</h3>
      <p className="text-yellow-800">V2 Dashboard feature flag is disabled. This is the fallback view.</p>
    </div>
  );

  return (
    <FeatureFlagWrapper
      flag="hangarshare_new_dashboard"
      fallback={<FallbackDashboard />}
    >
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                HangarShare Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time overview of your hangar operations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔄 Refresh
              </button>
              <span className="text-sm text-gray-500 self-center">
                Updated: {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-900 font-medium">⚠️ Error loading dashboard</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !stats ? (
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Hero Metrics - 4 Column Grid */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
              <MetricsGrid metrics={stats.heroMetrics} columns={4} />
            </section>

            {/* Financial Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <RevenueChart data={sampleRevenueData} />
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg border-2 border-green-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {stats.financialMetrics.monthlyRevenue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    📈 {stats.financialMetrics.trend}% from average
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    R$ {stats.financialMetrics.totalRevenue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Lifetime total</p>
                </div>
              </div>
            </section>

            {/* Occupancy Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <OccupancyChart data={sampleOccupancyData} />
              </div>
              <div className="bg-white rounded-lg border-2 border-purple-200 p-6 h-fit">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Booking Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Bookings</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.bookingMetrics.active}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Approvals</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {stats.bookingMetrics.pending}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="text-2xl font-bold text-green-600">
                      {stats.bookingMetrics.completed}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Alerts Section */}
            {stats.alerts.count > 0 && (
              <section className="bg-white rounded-lg border-2 border-red-200 p-6">
                <h3 className="text-lg font-bold text-red-900 mb-4">
                  ⚠️ Alerts ({stats.alerts.count})
                </h3>
                <div className="space-y-3">
                  {stats.alerts.items.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg ${
                        alert.severity === 'high'
                          ? 'bg-red-50 border border-red-200'
                          : alert.severity === 'medium'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{alert.type}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top Listings Section */}
            {stats.topListings.length > 0 && (
              <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🏆 Top Performing Listings
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-gray-700">Listing</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Bookings</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topListings.map((listing) => (
                        <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{listing.name}</td>
                          <td className="text-right py-3 px-4">
                            {listing.bookings} bookings
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">
                            R$ {listing.revenue.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Recent Bookings */}
            {stats.recentBookings.length > 0 && (
              <section className="bg-white rounded-lg border-2 border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  📅 Recent Bookings
                </h3>
                <div className="space-y-2">
                  {stats.recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{booking.listingName}</p>
                        <p className="text-sm text-gray-600">{booking.ownerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.checkIn}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            booking.status === 'completed'
                              ? 'text-green-600'
                              : booking.status === 'active'
                                ? 'text-blue-600'
                                : 'text-yellow-600'
                          }`}
                        >
                          {booking.status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </FeatureFlagWrapper>
  );
}
