'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type Summary = {
  listings: number;
  active_listings: number;
  bookings: number;
  revenue: number;
  avg_daily_rate: number;
};

type Trend = {
  day: string;
  bookings: number;
  revenue: number;
};

type ReportResponse = {
  summary: Summary;
  trends: Trend[];
  range: { days: number; startDate: string; endDate: string };
};

type Filters = {
  days: string;
  q: string;
  city: string;
  state: string;
  status: string;
  minBookings: string;
  minRevenue: string;
};

const defaultFilters: Filters = {
  days: '90',
  q: '',
  city: '',
  state: '',
  status: 'all',
  minBookings: '0',
  minRevenue: '0',
};

export default function TrendsReport() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        Object.entries(applied).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params.set(key, value);
          }
        });
        if (!params.get('days')) {
          params.set('days', '90');
        }

        const res = await fetch(`/api/admin/hangarshare/reports/trends?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar relatório');
        }
        const payload = (await res.json()) as ReportResponse;
        setData(payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar relatório';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applied]);

  const trendChartData = useMemo(() => {
    return (data?.trends || []).map((item) => ({
      ...item,
      dayLabel: new Date(item.day).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    }));
  }, [data]);

  const handleChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    setApplied(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setApplied(defaultFilters);
  };

  const handleExport = () => {
    if (!data) return;

    const lines: string[] = [];
    lines.push(`Resumo (últimos ${applied.days} dias)`);
    lines.push(`Anúncios,${data.summary.listings}`);
    lines.push(`Anúncios ativos,${data.summary.active_listings}`);
    lines.push(`Reservas,${data.summary.bookings}`);
    lines.push(`Receita,${Number(data.summary.revenue || 0)}`);
    lines.push(`Diária média,${Number(data.summary.avg_daily_rate || 0)}`);
    lines.push('');
    lines.push('Tendências');
    lines.push(['Dia', 'Reservas', 'Receita'].join(','));

    data.trends.forEach((row) => {
      lines.push(
        [
          new Date(row.day).toLocaleDateString('pt-BR'),
          row.bookings,
          Number(row.revenue || 0),
        ]
          .map((value) => String(value ?? '').replace(/"/g, '""'))
          .map((value) => `"${value}"`)
          .join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hangarshare-tendencias-${applied.days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!data) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const marginX = 40;
    let cursorY = 48;

    doc.setFontSize(16);
    doc.text('Relatório: Tendências Temporais', marginX, cursorY);
    cursorY += 18;
    doc.setFontSize(10);
    doc.text(`Período: últimos ${applied.days} dias`, marginX, cursorY);
    cursorY += 14;
    doc.text(
      `Anúncios: ${data.summary.listings}  |  Ativos: ${data.summary.active_listings}  |  Reservas: ${data.summary.bookings}  |  Receita: R$ ${Number(
        data.summary.revenue || 0
      ).toLocaleString('pt-BR')}`,
      marginX,
      cursorY
    );
    cursorY += 16;

    autoTable(doc, {
      startY: cursorY,
      head: [['Dia', 'Reservas', 'Receita']],
      body: data.trends.map((row) => [
        new Date(row.day).toLocaleDateString('pt-BR'),
        String(row.bookings),
        `R$ ${Number(row.revenue || 0).toLocaleString('pt-BR')}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: marginX, right: marginX },
    });

    doc.save(`hangarshare-tendencias-${applied.days}d.pdf`);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <Link href="/admin/hangarshare/reports" className="text-blue-600 hover:underline">
        ← Voltar
      </Link>
      <h1 className="text-3xl font-bold text-slate-900 mt-3">Tendências Temporais</h1>
      <p className="text-slate-600 mt-1">Evolução de reservas e receita ao longo do tempo.</p>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="text-slate-600">Período (dias)</label>
            <input
              type="number"
              min={1}
              value={filters.days}
              onChange={(e) => handleChange('days', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-600">Busca geral</label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleChange('q', e.target.value)}
              placeholder="ICAO, aeródromo, cidade"
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-600">Cidade</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-600">UF</label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-600">Status do anúncio</label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="draft">Rascunho</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600">Mín. reservas</label>
            <input
              type="number"
              min={0}
              value={filters.minBookings}
              onChange={(e) => handleChange('minBookings', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-slate-600">Mín. receita (R$)</label>
            <input
              type="number"
              min={0}
              value={filters.minRevenue}
              onChange={(e) => handleChange('minRevenue', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-white"
            disabled={!data?.trends?.length}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-white"
            disabled={!data?.trends?.length}
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-white"
          >
            Limpar
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-slate-600">Carregando…</p>
      ) : error ? (
        <p className="mt-6 text-red-600">{error}</p>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Anúncios</p>
              <p className="text-lg font-semibold text-slate-900">{data?.summary.listings ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Ativos</p>
              <p className="text-lg font-semibold text-slate-900">{data?.summary.active_listings ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Reservas</p>
              <p className="text-lg font-semibold text-slate-900">{data?.summary.bookings ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Receita</p>
              <p className="text-lg font-semibold text-slate-900">
                R$ {Number(data?.summary.revenue || 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Diária média</p>
              <p className="text-lg font-semibold text-slate-900">
                R$ {Number(data?.summary.avg_daily_rate || 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Tendência de reservas</h2>
              <span className="text-xs text-slate-500">últimos {applied.days} dias</span>
            </div>
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayLabel" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const numericValue = Number(value ?? 0);
                      return name === 'revenue'
                        ? [`R$ ${numericValue.toLocaleString('pt-BR')}`, 'Receita']
                        : [numericValue, 'Reservas'];
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#1d4ed8" name="Reservas" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Receita" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-900">Detalhamento por dia</h2>
            <table className="min-w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="py-2 pr-4">Dia</th>
                  <th className="py-2 pr-4">Reservas</th>
                  <th className="py-2 pr-4">Receita</th>
                </tr>
              </thead>
              <tbody>
                {(data?.trends || []).map((row) => (
                  <tr key={row.day} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">
                      {new Date(row.day).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 pr-4">{row.bookings}</td>
                    <td className="py-2 pr-4">R$ {Number(row.revenue || 0).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                {!data?.trends?.length && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      Nenhum dado encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
