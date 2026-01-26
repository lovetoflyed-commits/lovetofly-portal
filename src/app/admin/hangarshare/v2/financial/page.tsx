// Page: Financial Dashboard V2
// File: src/app/admin/hangarshare/v2/financial/page.tsx
// Purpose: Complete financial analytics dashboard with all metrics

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FeatureFlagWrapper } from '@/components/hangarshare-v2/FeatureFlagWrapper';
import { MetricCard, MetricsGrid } from '@/components/hangarshare-v2/MetricCard';
import { RevenueChart } from '@/components/hangarshare-v2/RevenueChart';
import { CommissionChart } from '@/components/hangarshare-v2/CommissionChart';
import { RevenueByAirportChart } from '@/components/hangarshare-v2/RevenueByAirportChart';
import { PayoutStatusChart } from '@/components/hangarshare-v2/PayoutStatusChart';

interface FinancialData {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number; target: number; growth: number }>;
  commissionMetrics: { collected: number; pending: number; rate: number };
  payoutMetrics: { pending: number; processed: number; failed: number; totalProcessed: number };
  revenueByAirport: Array<{ airport: string; revenue: number; bookings: number; occupancy: number }>;
  topOwners: Array<{ id: string; name: string; revenue: number; bookings: number; commission: number }>;
  payoutHistory: Array<{ id: string; ownerName: string; amount: number; date: string; status: string }>;
  revenueMetrics: { trend: number; forecast: number; status: string };
}

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: FinancialData | null;
  lastRefresh: string;
}

function FallbackDashboard() {
  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Financial Dashboard</h1>
      <p className="text-gray-600">This feature is not yet available. Please enable the feature flag to access it.</p>
    </div>
  );
}

export default function FinancialDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    data: null,
    lastRefresh: new Date().toLocaleTimeString(),
  });

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/admin/hangarshare/v2/financial-stats', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch financial data');

      const result = await response.json();

      setState({
        loading: false,
        error: null,
        data: result.data,
        lastRefresh: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Financial dashboard error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!user) return <FallbackDashboard />;

  return (
    <FeatureFlagWrapper
      flag="hangarshare_financial_dashboard"
      fallback={<FallbackDashboard />}
    >
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {state.lastRefresh}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={state.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {state.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error State */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Loading State */}
        {state.loading && !state.data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading financial data...</div>
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
                    title: 'Total Revenue',
                    value: state.data.totalRevenue,
                    icon: 'dollar',
                    status: state.data.revenueMetrics.status === 'healthy' ? 'healthy' : 'warning',
                    unit: 'USD',
                  },
                  {
                    title: 'Commission Collected',
                    value: state.data.commissionMetrics.collected,
                    icon: 'dollar',
                    status: 'healthy',
                  },
                  {
                    title: 'Pending Payouts',
                    value: state.data.payoutMetrics.pending,
                    icon: 'clock',
                    status: state.data.payoutMetrics.pending > 0 ? 'warning' : 'healthy',
                  },
                  {
                    title: 'Growth Rate',
                    value: `${state.data.revenueMetrics.trend}%`,
                    icon: 'trending',
                    status: state.data.revenueMetrics.trend > 0 ? 'healthy' : 'critical',
                  },
                ]}
              />
            </div>

            {/* Financial Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Chart */}
              <div>
                <RevenueChart
                  data={state.data.monthlyRevenue}
                  showLegend={true}
                />
              </div>

              {/* Commission Chart */}
              <div>
                <CommissionChart
                  collected={state.data.commissionMetrics.collected}
                  pending={state.data.commissionMetrics.pending}
                  rate={state.data.commissionMetrics.rate}
                />
              </div>
            </div>

            {/* Revenue by Airport & Payout Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <RevenueByAirportChart data={state.data.revenueByAirport} />
              </div>
              <div>
                <PayoutStatusChart
                  pending={state.data.payoutMetrics.pending}
                  processed={state.data.payoutMetrics.processed}
                  failed={state.data.payoutMetrics.failed}
                />
              </div>
            </div>

            {/* Top Owners Table */}
            <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Owners by Revenue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Bookings</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.data.topOwners.map((owner) => (
                      <tr key={owner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{owner.name}</td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          ${owner.revenue.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600">{owner.bookings}</td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          ${owner.commission.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</h3>
              <div className="space-y-3">
                {state.data.payoutHistory.length > 0 ? (
                  state.data.payoutHistory.map((payout) => (
                    <div key={payout.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{payout.ownerName}</p>
                        <p className="text-xs text-gray-600">{payout.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-gray-900">${payout.amount.toLocaleString()}</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payout.status === 'processed'
                              ? 'bg-green-200 text-green-800'
                              : payout.status === 'pending'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No payout history available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureFlagWrapper>
  );
}
