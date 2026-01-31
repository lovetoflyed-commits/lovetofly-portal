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

interface UtilizationSummary {
  averageOccupancy: number;
  totalRevenue: number;
  totalDays: number;
  listingsCount: number;
}

interface UtilizationDaily {
  date: string;
  occupancyRate: number;
  revenue: number;
}

interface UtilizationListing {
  listingId: number;
  icaoCode: string | null;
  hangarNumber: string | null;
  averageOccupancy: number;
  totalRevenue: number;
}

interface UtilizationResponse {
  summary: UtilizationSummary;
  daily: UtilizationDaily[];
  byListing: UtilizationListing[];
  range?: { startDate: string; endDate: string };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [utilization, setUtilization] = useState<UtilizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [utilizationLoading, setUtilizationLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAnalytics();
    loadUtilization();
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

  const loadUtilization = async () => {
    try {
      setUtilizationLoading(true);
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setUtilization(null);
        return;
      }

      const res = await fetch(`/api/hangarshare/owner/utilization?period=${period}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar utilização');
      }

      const data = await res.json();
      setUtilization(data);
    } catch (error) {
      console.error('Error loading utilization:', error);
      setUtilization(null);
    } finally {
      setUtilizationLoading(false);
    }
  };

  const getMaxRevenue = () => {
    if (!analytics?.monthlyRevenue) return 0;
    return Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
  };

  const getMaxUtilizationRevenue = () => {
    if (!utilization?.daily?.length) return 0;
    return Math.max(...utilization.daily.map(item => item.revenue));
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!analytics) return;

    const rows: string[] = [];
    rows.push('Resumo,Valor');
    rows.push(`Receita Total,R$ ${analytics.totalRevenue}`);
    rows.push(`Total de Reservas,${analytics.totalBookings}`);
    rows.push(`Avaliação Média,${analytics.averageRating}`);
    rows.push(`Taxa de Ocupação,${occupancyDisplay}`);
    rows.push('');

    rows.push('Receita Mensal');
    rows.push('Mês,Receita');
    analytics.monthlyRevenue.forEach((item) => {
      rows.push(`${item.month},${item.revenue}`);
    });
    rows.push('');

    rows.push('Reservas por Hangar');
    rows.push('Hangar,Reservas,Receita');
    analytics.bookingsByHangar.forEach((item) => {
      rows.push(`${item.hangar},${item.bookings},${item.revenue}`);
    });
    rows.push('');

    rows.push('Top Clientes');
    rows.push('Cliente,Reservas,Gasto');
    analytics.topClients.forEach((item) => {
      rows.push(`${item.name},${item.bookings},${item.spent}`);
    });

    if (utilization?.daily?.length) {
      rows.push('');
      rows.push('Utilização Diária');
      rows.push('Data,Ocupação,Receita');
      utilization.daily.forEach((item) => {
        rows.push(`${item.date},${item.occupancyRate},${item.revenue}`);
      });
    }

    downloadFile(`hangarshare-analytics-${period}.csv`, rows.join('\n'), 'text/csv;charset=utf-8;');
  };

  const exportPDF = () => {
    if (!analytics) return;

    const html = `
      <html>
        <head>
          <title>Relatório HangarShare</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { margin-bottom: 8px; }
            h2 { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Relatório HangarShare</h1>
          <p>Período: ${period}</p>
          <h2>Resumo</h2>
          <table>
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Receita Total</td><td>R$ ${analytics.totalRevenue}</td></tr>
            <tr><td>Total de Reservas</td><td>${analytics.totalBookings}</td></tr>
            <tr><td>Avaliação Média</td><td>${analytics.averageRating.toFixed(2)}</td></tr>
            <tr><td>Taxa de Ocupação</td><td>${occupancyDisplay}%</td></tr>
          </table>
          <h2>Receita Mensal</h2>
          <table>
            <tr><th>Mês</th><th>Receita</th></tr>
            ${analytics.monthlyRevenue.map(item => `<tr><td>${item.month}</td><td>R$ ${item.revenue}</td></tr>`).join('')}
          </table>
          <h2>Reservas por Hangar</h2>
          <table>
            <tr><th>Hangar</th><th>Reservas</th><th>Receita</th></tr>
            ${analytics.bookingsByHangar.map(item => `<tr><td>${item.hangar}</td><td>${item.bookings}</td><td>R$ ${item.revenue}</td></tr>`).join('')}
          </table>
          <h2>Top Clientes</h2>
          <table>
            <tr><th>Cliente</th><th>Reservas</th><th>Gasto</th></tr>
            ${analytics.topClients.map(item => `<tr><td>${item.name}</td><td>${item.bookings}</td><td>R$ ${item.spent}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
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

  const occupancyDisplay = utilization?.summary?.averageOccupancy ?? analytics.occupancyRate;

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
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportCSV}
                className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Exportar CSV
              </button>
              <button
                onClick={exportPDF}
                className="px-4 py-2 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-800"
              >
                Exportar PDF
              </button>
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
            <p className="text-3xl font-black text-purple-600 mt-2">{occupancyDisplay}%</p>
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

        {/* Utilization Analytics */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-900">Utilização dos Hangares</h2>
            {utilization?.range && (
              <p className="text-xs text-slate-500">
                {utilization.range.startDate} → {utilization.range.endDate}
              </p>
            )}
          </div>

          {utilizationLoading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-slate-600">Carregando utilização...</p>
            </div>
          ) : utilization ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-5">
                  <p className="text-xs font-bold text-slate-500">OCUPAÇÃO MÉDIA</p>
                  <p className="text-2xl font-black text-purple-600 mt-2">
                    {utilization.summary.averageOccupancy}%
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <p className="text-xs font-bold text-slate-500">RECEITA NO PERÍODO</p>
                  <p className="text-2xl font-black text-green-600 mt-2">
                    R$ {utilization.summary.totalRevenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <p className="text-xs font-bold text-slate-500">DIAS REGISTRADOS</p>
                  <p className="text-2xl font-black text-blue-600 mt-2">
                    {utilization.summary.totalDays}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <p className="text-xs font-bold text-slate-500">HANGARES MONITORADOS</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">
                    {utilization.summary.listingsCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Ocupação diária</h3>
                  {utilization.daily.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem dados de utilização no período.</p>
                  ) : (
                    <div className="h-48 flex items-end gap-2">
                      {utilization.daily.map((item) => (
                        <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                            style={{ height: `${Math.max(item.occupancyRate, 5)}%` }}
                            title={`${item.date}: ${item.occupancyRate.toFixed(1)}%`}
                          />
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Receita diária</h3>
                  {utilization.daily.length === 0 ? (
                    <p className="text-sm text-slate-500">Sem dados de receita no período.</p>
                  ) : (
                    <div className="h-48 flex items-end gap-2">
                      {utilization.daily.map((item) => {
                        const maxRevenue = getMaxUtilizationRevenue() || 1;
                        const height = (item.revenue / maxRevenue) * 100;
                        return (
                          <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${item.date}: R$ ${item.revenue.toLocaleString('pt-BR')}`}
                            />
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Utilização por hangar</h3>
                {utilization.byListing.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem dados por hangar no período.</p>
                ) : (
                  <div className="space-y-4">
                    {utilization.byListing.map((item) => (
                      <div key={item.listingId}>
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                          <span>
                            {item.icaoCode || 'ICAO'} - {item.hangarNumber || 'Hangar'}
                          </span>
                          <span>{item.averageOccupancy.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${Math.min(item.averageOccupancy, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Receita: R$ {item.totalRevenue.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-slate-600">Utilização indisponível no momento.</p>
            </div>
          )}
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
