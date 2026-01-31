'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FeatureFlagWrapper } from '@/components/hangarshare-v2/FeatureFlagWrapper';
import { RevenueChart } from '@/components/hangarshare-v2/RevenueChart';
import { CommissionChart } from '@/components/hangarshare-v2/CommissionChart';
import { PayoutStatusChart } from '@/components/hangarshare-v2/PayoutStatusChart';
import { RevenueByAirportChart } from '@/components/hangarshare-v2/RevenueByAirportChart';
import { RevenueForecastCard } from '@/components/hangarshare-v2/RevenueForecastCard';
import { ComparisonMetricsCard } from '@/components/hangarshare-v2/ComparisonMetricsCard';

interface FinancialStatsResponse {
  success: boolean;
  data: {
    totalRevenue: number;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      target: number;
      growth: number;
    }>;
    commissionMetrics: {
      collected: number;
      pending: number;
      rate: number;
    };
    payoutMetrics: {
      pending: number;
      processed: number;
      failed: number;
      totalProcessed: number;
    };
    revenueByAirport: Array<{
      airport: string;
      revenue: number;
      bookings: number;
      occupancy: number;
    }>;
    topOwners: Array<{
      id: string;
      name: string;
      revenue: number;
      bookings: number;
      commission: number;
    }>;
    payoutHistory: Array<{
      id: string;
      ownerName: string;
      amount: number;
      date: string;
      status: 'processed' | 'pending' | 'failed';
    }>;
    revenueMetrics: {
      trend: number;
      forecast: number;
      status: string;
    };
  };
  meta: {
    responseTime: number;
    generatedAt: string;
  };
}

interface FinancialState {
  loading: boolean;
  error: string | null;
  data: FinancialStatsResponse['data'] | null;
  lastRefresh: string;
}

function FallbackDashboard() {
  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Financeiro HangarShare V2</h1>
      <p className="text-gray-600">Este painel ainda não está disponível. Use o painel clássico para finanças.</p>
      <div className="mt-6">
        <Link
          href="/admin/finance"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Ir para finanças clássicas
        </Link>
      </div>
    </div>
  );
}

export default function FinancialDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  const inFlightRef = useRef(false);

  const [state, setState] = useState<FinancialState>({
    loading: true,
    error: null,
    data: null,
    lastRefresh: new Date().toLocaleTimeString(),
  });

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch('/api/admin/hangarshare/v2/financial-stats');
      if (!response.ok) throw new Error('Falha ao carregar métricas financeiras');

      const result: FinancialStatsResponse = await response.json();
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
            <h1 className="text-3xl font-bold text-gray-900">Financeiro HangarShare V2</h1>
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
              href="/admin/finance"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Finanças clássicas
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
            <div className="text-gray-600">Carregando métricas financeiras...</div>
          </div>
        )}

        {state.data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <ComparisonMetricsCard
                label="Receita Total"
                current={state.data.totalRevenue}
                formatAs="currency"
                size="lg"
              />
              <ComparisonMetricsCard
                label="Comissões Coletadas"
                current={state.data.commissionMetrics.collected}
                formatAs="currency"
                size="lg"
              />
              <ComparisonMetricsCard
                label="Payouts Processados"
                current={state.data.payoutMetrics.processed}
                formatAs="currency"
                size="lg"
              />
              <ComparisonMetricsCard
                label="Payouts Pendentes"
                current={state.data.payoutMetrics.pending}
                formatAs="currency"
                size="lg"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart
                data={[...state.data.monthlyRevenue].reverse().map((row) => ({
                  month: row.month,
                  revenue: row.revenue,
                  target: row.target,
                }))}
              />
              <RevenueForecastCard
                projectedMonthlyRevenue={state.data.monthlyRevenue[0]?.revenue || 0}
                projectedAnnualRevenue={state.data.revenueMetrics.forecast}
                confidence={state.data.revenueMetrics.trend > 0 ? 0.8 : 0.6}
                currentMonthlyRevenue={state.data.monthlyRevenue[0]?.revenue}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommissionChart
                collected={state.data.commissionMetrics.collected}
                pending={state.data.commissionMetrics.pending}
                rate={state.data.commissionMetrics.rate}
              />
              <PayoutStatusChart
                pending={state.data.payoutMetrics.pending}
                processed={state.data.payoutMetrics.processed}
                failed={state.data.payoutMetrics.failed}
              />
            </div>

            <RevenueByAirportChart data={state.data.revenueByAirport} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Proprietários</h3>
                {state.data.topOwners.length === 0 ? (
                  <p className="text-gray-600">Nenhum proprietário encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Proprietário</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Receita</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Reservas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.data.topOwners.map((owner) => (
                          <tr key={owner.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900 font-medium">{owner.name}</td>
                            <td className="py-2 px-3 text-right text-gray-700">
                              {owner.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">{owner.bookings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Payouts</h3>
                {state.data.payoutHistory.length === 0 ? (
                  <p className="text-gray-600">Nenhum payout registrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Proprietário</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Valor</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.data.payoutHistory.map((payout) => (
                          <tr key={payout.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900 font-medium">{payout.ownerName}</td>
                            <td className="py-2 px-3 text-right text-gray-700">
                              {payout.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 px-3 text-gray-600">{payout.date}</td>
                            <td className="py-2 px-3 text-gray-600">{payout.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureFlagWrapper>
  );
}
