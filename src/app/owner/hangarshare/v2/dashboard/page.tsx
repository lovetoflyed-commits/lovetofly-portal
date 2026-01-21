// Page: Owner Dashboard V2
// File: src/app/owner/hangarshare/v2/dashboard/page.tsx
// Purpose: Personal dashboard for hangar owners

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FeatureFlagWrapper } from '@/components/hangarshare-v2/FeatureFlagWrapper';
import { MetricsGrid } from '@/components/hangarshare-v2/MetricCard';
import { RevenueChart } from '@/components/hangarshare-v2/RevenueChart';
import { OccupancyChart } from '@/components/hangarshare-v2/OccupancyChart';
import { ListingPerformanceCard } from '@/components/hangarshare-v2/ListingPerformanceCard';
import { RecentBookingsTable } from '@/components/hangarshare-v2/RecentBookingsTable';

interface OwnerDashboardData {
  ownerId: string;
  ownerInfo: {
    companyName: string;
    activeListings: number;
    totalListings: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingPayouts: number;
    lastPayoutDate: string | null;
  };
  bookingMetrics: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  };
  occupancyMetrics: {
    averageOccupancy: number;
    totalCapacity: number;
    occupiedSpots: number;
  };
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>;
  topListings: Array<{
    id: string;
    title: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>;
  recentBookings: Array<{
    id: string;
    hangarTitle: string;
    guestName: string;
    startDate: string;
    endDate: string;
    amount: number;
    status: string;
  }>;
}

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: OwnerDashboardData | null;
  lastRefresh: string;
}

function FallbackDashboard() {
  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Meu Dashboard</h1>
      <p className="text-gray-600">Este recurso ainda não está disponível. Ative o feature flag para acessá-lo.</p>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    data: null,
    lastRefresh: new Date().toLocaleTimeString(),
  });

  // TODO: Get actual owner ID from authenticated user
  const ownerId = '1'; // Placeholder - should come from auth context

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/owner/hangarshare/v2/stats?ownerId=${ownerId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch owner statistics');

      const result = await response.json();

      setState({
        loading: false,
        error: null,
        data: result.data,
        lastRefresh: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Owner dashboard error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Ocorreu um erro',
      }));
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [ownerId]);

  if (!user) return <FallbackDashboard />;

  return (
    <FeatureFlagWrapper
      flag="hangarshare_owner_dashboard"
      fallback={<FallbackDashboard />}
    >
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {state.data?.ownerInfo.companyName || 'Meu Dashboard'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Última atualização: {state.lastRefresh}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={state.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {state.loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Error State */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Loading State */}
        {state.loading && !state.data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Carregando seus dados...</div>
          </div>
        )}

        {/* Main Content */}
        {state.data && (
          <>
            {/* Hero Metrics Grid */}
            <div className="mb-8">
              <MetricsGrid
                metrics={[
                  {
                    title: 'Receita Total',
                    value: state.data.revenueMetrics.totalRevenue,
                    icon: 'dollar',
                    status: 'healthy',
                    unit: 'BRL',
                  },
                  {
                    title: 'Receita Mensal',
                    value: state.data.revenueMetrics.monthlyRevenue,
                    icon: 'trending',
                    status: state.data.revenueMetrics.monthlyRevenue > 0 ? 'healthy' : 'warning',
                    unit: 'BRL',
                  },
                  {
                    title: 'Reservas Ativas',
                    value: state.data.bookingMetrics.activeBookings,
                    icon: 'calendar',
                    status: state.data.bookingMetrics.activeBookings > 0 ? 'healthy' : 'default',
                  },
                  {
                    title: 'Taxa de Ocupação',
                    value: `${state.data.occupancyMetrics.averageOccupancy.toFixed(1)}%`,
                    icon: 'trending',
                    status: state.data.occupancyMetrics.averageOccupancy > 70 ? 'healthy' : 'warning',
                  },
                ]}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Trend */}
              <div>
                <RevenueChart
                  data={state.data.monthlyTrend.map(item => ({
                    month: item.month,
                    revenue: item.revenue,
                    target: item.revenue * 1.1, // 10% growth target
                    growth: 10,
                  }))}
                  showLegend={true}
                />
              </div>

              {/* Occupancy Trend */}
              <div>
                <OccupancyChart
                  data={state.data.monthlyTrend.map(item => ({
                    date: item.month,
                    occupancy: item.occupancy,
                    capacity: 100,
                  }))}
                />
              </div>
            </div>

            {/* Listings & Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <ListingPerformanceCard listings={state.data.topListings} />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Hangares Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {state.data.ownerInfo.activeListings}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Hangares</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {state.data.ownerInfo.totalListings}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reservas Totais</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {state.data.bookingMetrics.totalBookings}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pagamento Pendente</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {state.data.revenueMetrics.pendingPayouts.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <RecentBookingsTable bookings={state.data.recentBookings} />
          </>
        )}
      </div>
    </FeatureFlagWrapper>
  );
}
