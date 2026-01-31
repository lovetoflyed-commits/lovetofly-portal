'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FeatureFlagWrapper } from '@/components/hangarshare-v2/FeatureFlagWrapper';
import { MetricsGrid } from '@/components/hangarshare-v2/MetricCard';
import { RevenueChart } from '@/components/hangarshare-v2/RevenueChart';
import { OccupancyChart } from '@/components/hangarshare-v2/OccupancyChart';
import { ListingPerformanceCard } from '@/components/hangarshare-v2/ListingPerformanceCard';

interface OverviewStatsResponse {
  success: boolean;
  data: {
    heroMetrics: Array<{
      title: string;
      value: number | string;
      icon: string;
      change?: number;
      status?: 'healthy' | 'warning' | 'critical' | 'default';
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
  };
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: OverviewStatsResponse['data'] | null;
  lastRefresh: string;
}

function FallbackDashboard() {
  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">HangarShare V2</h1>
      <p className="text-gray-600">
        Este painel ainda não está disponível. Use o painel clássico enquanto o rollout é finalizado.
      </p>
      <div className="mt-6">
        <Link
          href="/admin/hangarshare"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Ir para painel clássico
        </Link>
      </div>
    </div>
  );
}

export default function HangarShareV2DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  const inFlightRef = useRef(false);

  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    data: null,
    lastRefresh: new Date().toLocaleTimeString(),
  });

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/admin/hangarshare/v2/overview-stats');
      if (!response.ok) throw new Error('Falha ao carregar métricas do dashboard');

      const result: OverviewStatsResponse = await response.json();
      if (!result.success) throw new Error('Resposta inválida do servidor');

      setState({
        loading: false,
        error: null,
        data: result.data,
        lastRefresh: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados',
      }));
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'master' && user.role !== 'admin' && user.email !== 'lovetofly.ed@gmail.com')) {
      router.push('/');
      return;
    }

    if (hasFetchedRef.current || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    fetchData().finally(() => {
      inFlightRef.current = false;
      hasFetchedRef.current = true;
    });
  }, [user, router]);

  return (
    <FeatureFlagWrapper flag="hangarshare_new_dashboard" fallback={<FallbackDashboard />}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HangarShare V2 - Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Última atualização: {state.lastRefresh}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={state.loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {state.loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <Link
              href="/admin/hangarshare"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Painel clássico
            </Link>
          </div>
        </div>

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {state.loading && !state.data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Carregando métricas...</div>
          </div>
        )}

        {state.data && (
          <div className="space-y-8">
            <MetricsGrid metrics={state.data.heroMetrics.map((metric) => ({
              ...metric,
              status: metric.status || 'default',
            }))} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                data={[
                  {
                    month: 'Últimos 30 dias',
                    revenue: state.data.financialMetrics.monthlyRevenue,
                    target: state.data.financialMetrics.monthlyRevenue * 1.1,
                  },
                ]}
              />
              <OccupancyChart
                data={[
                  {
                    date: 'Hoje',
                    occupancy: state.data.occupancyMetrics.current,
                  },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ListingPerformanceCard
                listings={state.data.topListings.map((listing) => ({
                  id: listing.id,
                  title: listing.name,
                  revenue: listing.revenue,
                  bookings: listing.bookings,
                  occupancy: 0,
                }))}
              />
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservas Recentes</h3>
                {state.data.recentBookings.length === 0 ? (
                  <p className="text-gray-600">Nenhuma reserva encontrada</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Hangar</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Proprietário</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Check-in</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.data.recentBookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900 font-medium">{booking.listingName}</td>
                            <td className="py-2 px-3 text-gray-700">{booking.ownerName}</td>
                            <td className="py-2 px-3 text-gray-600">{booking.checkIn}</td>
                            <td className="py-2 px-3 text-gray-600">{booking.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h3>
              {state.data.alerts.items.length === 0 ? (
                <p className="text-gray-600">Nenhum alerta pendente</p>
              ) : (
                <ul className="space-y-3">
                  {state.data.alerts.items.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm font-semibold uppercase text-gray-600">{alert.severity}</span>
                      <div>
                        <p className="text-gray-900 font-medium">{alert.message}</p>
                        <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </FeatureFlagWrapper>
  );
}
