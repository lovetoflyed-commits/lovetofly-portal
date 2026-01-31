'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

type Summary = {
  owners: number;
  listings: number;
  bookings: number;
  revenue: number;
};

type Row = {
  owner_id: string;
  company_name: string;
  is_verified: boolean;
  listings_count: number;
  bookings_count: number;
  revenue: number;
  avg_daily_rate: number;
  booked_nights: number;
  active_listings: number;
};

type Trend = {
  day: string;
  bookings: number;
  revenue: number;
};

type ReportResponse = {
  summary: Summary;
  rows: Row[];
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
  days: '30',
  q: '',
  city: '',
  state: '',
  status: 'all',
  minBookings: '0',
  minRevenue: '0',
};

export default function OwnersRevenueReport() {
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
          params.set('days', '30');
        }

        const res = await fetch(`/api/admin/hangarshare/reports/owners-revenue?${params.toString()}`);
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

  const topOwners = useMemo(() => {
    return (data?.rows || []).slice(0, 8).map((row) => ({
      ...row,
      label: row.company_name || '—',
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
    lines.push(`Anunciantes,${data.summary.owners}`);
    lines.push(`Anúncios,${data.summary.listings}`);
    lines.push(`Reservas,${data.summary.bookings}`);
    lines.push(`Receita,${Number(data.summary.revenue || 0)}`);
    lines.push('');
    lines.push('Detalhamento');
    lines.push(
      [
        'Anunciante',
        'Verificado',
        'Anúncios',
        'Ativos',
        'Reservas',
        'Receita',
        'Diária média',
        'Noites reservadas',
      ].join(',')
    );

    data.rows.forEach((row) => {
      lines.push(
        [
          row.company_name,
          row.is_verified ? 'Sim' : 'Não',
          row.listings_count,
          row.active_listings,
          row.bookings_count,
          Number(row.revenue || 0),
          Number(row.avg_daily_rate || 0),
          row.booked_nights,
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
    link.download = `hangarshare-owners-${applied.days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!data) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const marginX = 40;
    let cursorY = 48;

    doc.setFontSize(16);
    doc.text('Relatório: Receita por Anunciante', marginX, cursorY);
    cursorY += 18;
    doc.setFontSize(10);
    doc.text(`Período: últimos ${applied.days} dias`, marginX, cursorY);
    cursorY += 14;
    doc.text(
      `Anunciantes: ${data.summary.owners}  |  Anúncios: ${data.summary.listings}  |  Reservas: ${data.summary.bookings}  |  Receita: R$ ${Number(
        data.summary.revenue || 0
      ).toLocaleString('pt-BR')}`,
      marginX,
      cursorY
    );
    cursorY += 16;

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          'Anunciante',
          'Verificado',
          'Anúncios',
          'Ativos',
          'Reservas',
          'Receita',
          'Diária média',
          'Noites reservadas',
        ],
      ],
      body: data.rows.map((row) => [
        row.company_name,
        row.is_verified ? 'Sim' : 'Não',
        String(row.listings_count),
        String(row.active_listings),
        String(row.bookings_count),
        `R$ ${Number(row.revenue || 0).toLocaleString('pt-BR')}`,
        `R$ ${Number(row.avg_daily_rate || 0).toLocaleString('pt-BR')}`,
        String(row.booked_nights),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: marginX, right: marginX },
    });

    doc.save(`hangarshare-owners-${applied.days}d.pdf`);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <Link href="/admin/hangarshare/reports" className="text-blue-600 hover:underline">
        ← Voltar
      </Link>
      <h1 className="text-3xl font-bold text-slate-900 mt-3">Receita por Anunciante</h1>
      <p className="text-slate-600 mt-1">
        Ranking de anunciantes com filtros e comparativos por período.
      </p>

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
              placeholder="Anunciante, ICAO, cidade"
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
            disabled={!data?.rows?.length}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-white"
            disabled={!data?.rows?.length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Anunciantes</p>
              <p className="text-lg font-semibold text-slate-900">{data?.summary.owners ?? 0}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4">
              <p className="text-slate-500">Anúncios</p>
              <p className="text-lg font-semibold text-slate-900">{data?.summary.listings ?? 0}</p>
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Tendência de reservas</h2>
                <span className="text-xs text-slate-500">últimos {applied.days} dias</span>
              </div>
              <div className="h-72 mt-4">
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

            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Top anunciantes</h2>
                <span className="text-xs text-slate-500">por receita</span>
              </div>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topOwners} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="label" width={160} />
                    <Tooltip
                      formatter={(value, name) => {
                        const numericValue = Number(value ?? 0);
                        return name === 'revenue'
                          ? [`R$ ${numericValue.toLocaleString('pt-BR')}`, 'Receita']
                          : [numericValue, 'Reservas'];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Receita" fill="#10b981" />
                    <Bar dataKey="bookings_count" name="Reservas" fill="#1d4ed8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-900">Detalhamento por anunciante</h2>
            <table className="min-w-full text-sm mt-4">
              <thead>
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="py-2 pr-4">Anunciante</th>
                  <th className="py-2 pr-4">Verificado</th>
                  <th className="py-2 pr-4">Anúncios</th>
                  <th className="py-2 pr-4">Ativos</th>
                  <th className="py-2 pr-4">Reservas</th>
                  <th className="py-2 pr-4">Receita</th>
                  <th className="py-2 pr-4">Diária média</th>
                  <th className="py-2 pr-4">Noites reservadas</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows || []).map((row) => (
                  <tr key={row.owner_id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">{row.company_name}</td>
                    <td className="py-2 pr-4">{row.is_verified ? 'Verificado' : 'Pendente'}</td>
                    <td className="py-2 pr-4">{row.listings_count}</td>
                    <td className="py-2 pr-4">{row.active_listings}</td>
                    <td className="py-2 pr-4">{row.bookings_count}</td>
                    <td className="py-2 pr-4">R$ {Number(row.revenue || 0).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-4">R$ {Number(row.avg_daily_rate || 0).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-4">{row.booked_nights}</td>
                  </tr>
                ))}
                {!data?.rows?.length && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
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
