'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  bookingsByHangar: Array<{ hangar: string; bookings: number; revenue: number }>;
  topClients: Array<{ name: string; bookings: number; spent: number }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAnalytics();
  }, [user, router, period]);

  const loadAnalytics = async () => {
    try {
      // TODO: Replace with API call when available
      // const res = await fetch(`/api/hangarshare/owner/analytics?period=${period}`);
      // const data = await res.json();
      // setAnalytics(data);

      // Mock data for demonstration
      setAnalytics({
        totalRevenue: 156400,
        totalBookings: 42,
        averageRating: 4.85,
        occupancyRate: 78,
        monthlyRevenue: [
          { month: 'Jan', revenue: 18500 },
          { month: 'Fev', revenue: 22300 },
          { month: 'Mar', revenue: 19800 },
          { month: 'Abr', revenue: 25600 },
          { month: 'Mai', revenue: 28700 },
          { month: 'Jun', revenue: 30500 },
          { month: 'Jul', revenue: 32400 },
          { month: 'Ago', revenue: 29600 },
          { month: 'Set', revenue: 24300 },
          { month: 'Out', revenue: 26800 },
          { month: 'Nov', revenue: 31400 },
          { month: 'Dez', revenue: 27500 },
        ],
        bookingsByHangar: [
          { hangar: 'SBSP - Hangar 5', bookings: 18, revenue: 72000 },
          { hangar: 'SBCF - Hangar A-12', bookings: 12, revenue: 54400 },
          { hangar: 'SBRJ - Hangar 3', bookings: 8, revenue: 28000 },
          { hangar: 'SBGP - Hangar 7', bookings: 4, revenue: 2000 },
        ],
        topClients: [
          { name: 'João Silva', bookings: 5, spent: 18000 },
          { name: 'Maria Santos', bookings: 4, spent: 16000 },
          { name: 'Carlos Oliveira', bookings: 3, spent: 12000 },
          { name: 'Ana Costa', bookings: 3, spent: 10800 },
          { name: 'Pedro Martins', bookings: 2, spent: 7200 },
        ],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxRevenue = () => {
    if (!analytics?.monthlyRevenue) return 0;
    return Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-700">Carregando...</h1>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-700">Carregando análises...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar ao Painel
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-blue-900">Análises e Relatórios</h1>
              <p className="text-slate-600 mt-2">Visualize suas métricas de desempenho</p>
            </div>
            <div className="flex gap-2">
              {(['month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Ano'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">RECEITA TOTAL</p>
            <p className="text-3xl font-black text-green-600 mt-2">
              R$ {analytics.totalRevenue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">TOTAL DE RESERVAS</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{analytics.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">AVALIAÇÃO MÉDIA</p>
            <p className="text-3xl font-black text-amber-600 mt-2">
              ⭐ {analytics.averageRating.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">TAXA DE OCUPAÇÃO</p>
            <p className="text-3xl font-black text-purple-600 mt-2">{analytics.occupancyRate}%</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-6">Receita Mensal</h2>
            <div className="h-64 flex items-end gap-2">
              {analytics.monthlyRevenue.map((data, idx) => {
                const height = (data.revenue / getMaxRevenue()) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition cursor-pointer relative"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${data.month}: R$ ${data.revenue.toLocaleString('pt-BR')}`}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        R$ {(data.revenue / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bookings by Hangar */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-6">Reservas por Hangar</h2>
            <div className="space-y-4">
              {analytics.bookingsByHangar.map((data, idx) => {
                const maxBookings = Math.max(...analytics.bookingsByHangar.map(h => h.bookings));
                const width = (data.bookings / maxBookings) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <p className="font-bold text-slate-900">{data.hangar}</p>
                      <p className="text-sm font-bold text-slate-600">{data.bookings} reservas</p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      R$ {data.revenue.toLocaleString('pt-BR')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Melhores Clientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">#</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Cliente</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Reservas</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Total Gasto</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topClients.map((client, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 font-bold text-blue-600">#{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{client.name}</td>
                    <td className="px-6 py-4 text-slate-900">{client.bookings}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">
                      R$ {client.spent.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      R$ {(client.spent / client.bookings).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 flex gap-3">
          <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
            📥 Exportar Relatório
          </button>
          <button className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
