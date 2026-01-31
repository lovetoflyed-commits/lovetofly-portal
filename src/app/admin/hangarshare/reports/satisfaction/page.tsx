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
  BarChart,
  Bar,
} from 'recharts';

    type Summary = {
      listings: number;
      listings_with_reviews: number;
      total_reviews: number;
      avg_rating: number;
      rating_5_count: number;
      rating_4_count: number;
      rating_3_count: number;
      rating_2_count: number;
      rating_1_count: number;
    };

    type Row = {
      icao_code: string;
      aerodrome_name: string;
      city: string;
      state: string;
      total_reviews: number;
      avg_rating: number;
      rating_5_count: number;
      rating_4_count: number;
      rating_3_count: number;
      rating_2_count: number;
      rating_1_count: number;
      last_review_at: string | null;
    };

    type Trend = {
      day: string;
      reviews: number;
      avg_rating: number;
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
      days: '90',
      q: '',
      city: '',
      state: '',
      status: 'all',
      minBookings: '0',
      minRevenue: '0',
    };

    export default function SatisfactionReport() {
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

            const res = await fetch(`/api/admin/hangarshare/reports/satisfaction?${params.toString()}`);
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

      const topListings = useMemo(() => {
        return (data?.rows || []).slice(0, 8).map((row) => ({
          ...row,
          label: `${row.icao_code || '—'} · ${row.city || '—'}`,
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
        lines.push(`Com avaliações,${data.summary.listings_with_reviews}`);
        lines.push(`Avaliações,${data.summary.total_reviews}`);
        lines.push(`Nota média,${Number(data.summary.avg_rating || 0)}`);
        lines.push(`5 estrelas,${data.summary.rating_5_count}`);
        lines.push(`4 estrelas,${data.summary.rating_4_count}`);
        lines.push(`3 estrelas,${data.summary.rating_3_count}`);
        lines.push(`2 estrelas,${data.summary.rating_2_count}`);
        lines.push(`1 estrela,${data.summary.rating_1_count}`);
        lines.push('');
        lines.push('Detalhamento');
        lines.push(
          [
            'ICAO',
            'Aeródromo',
            'Cidade',
            'UF',
            'Avaliações',
            'Nota média',
            '5',
            '4',
            '3',
            '2',
            '1',
            'Última avaliação',
          ].join(',')
        );

        data.rows.forEach((row) => {
          lines.push(
            [
              row.icao_code,
              row.aerodrome_name,
              row.city,
              row.state,
              row.total_reviews,
              Number(row.avg_rating || 0),
              row.rating_5_count,
              row.rating_4_count,
              row.rating_3_count,
              row.rating_2_count,
              row.rating_1_count,
              row.last_review_at ? new Date(row.last_review_at).toLocaleDateString('pt-BR') : '',
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
        link.download = `hangarshare-satisfacao-${applied.days}d.csv`;
        link.click();
        URL.revokeObjectURL(url);
      };

      const handleExportPdf = () => {
        if (!data) return;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const marginX = 40;
        let cursorY = 48;

        doc.setFontSize(16);
        doc.text('Relatório: Satisfação de Usuários', marginX, cursorY);
        cursorY += 18;
        doc.setFontSize(10);
        doc.text(`Período: últimos ${applied.days} dias`, marginX, cursorY);
        cursorY += 14;
        doc.text(
          `Anúncios: ${data.summary.listings}  |  Com avaliações: ${data.summary.listings_with_reviews}  |  Avaliações: ${data.summary.total_reviews}  |  Nota média: ${Number(
            data.summary.avg_rating || 0
          ).toLocaleString('pt-BR')}`,
          marginX,
          cursorY
        );
        cursorY += 16;

        autoTable(doc, {
          startY: cursorY,
          head: [
            [
              'ICAO',
              'Aeródromo',
              'Cidade',
              'UF',
              'Avaliações',
              'Nota média',
              '5',
              '4',
              '3',
              '2',
              '1',
              'Última avaliação',
            ],
          ],
          body: data.rows.map((row) => [
            row.icao_code,
            row.aerodrome_name,
            row.city,
            row.state,
            String(row.total_reviews),
            String(Number(row.avg_rating || 0).toFixed(2)),
            String(row.rating_5_count),
            String(row.rating_4_count),
            String(row.rating_3_count),
            String(row.rating_2_count),
            String(row.rating_1_count),
            row.last_review_at ? new Date(row.last_review_at).toLocaleDateString('pt-BR') : '—',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: marginX, right: marginX },
        });

        doc.save(`hangarshare-satisfacao-${applied.days}d.pdf`);
      };

      return (
        <div className="p-6 bg-white min-h-screen">
          <Link href="/admin/hangarshare/reports" className="text-blue-600 hover:underline">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-3">Satisfação de Usuários</h1>
          <p className="text-slate-600 mt-1">Avaliações, notas médias e tendências.</p>

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                <div className="bg-white border border-slate-200 rounded p-4">
                  <p className="text-slate-500">Anúncios</p>
                  <p className="text-lg font-semibold text-slate-900">{data?.summary.listings ?? 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded p-4">
                  <p className="text-slate-500">Com avaliações</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {data?.summary.listings_with_reviews ?? 0}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded p-4">
                  <p className="text-slate-500">Avaliações</p>
                  <p className="text-lg font-semibold text-slate-900">{data?.summary.total_reviews ?? 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded p-4">
                  <p className="text-slate-500">Nota média</p>
                  <p className="text-lg font-semibold text-slate-900">{data?.summary.avg_rating ?? 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded p-4">
                  <p className="text-slate-500">5 estrelas</p>
                  <p className="text-lg font-semibold text-slate-900">{data?.summary.rating_5_count ?? 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Tendência de avaliações</h2>
                    <span className="text-xs text-slate-500">últimos {applied.days} dias</span>
                  </div>
                  <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dayLabel" />
                        <YAxis yAxisId="left" allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                        <Tooltip
                          formatter={(value: number | string | undefined, name?: string) => {
                            const numericValue = Number(value ?? 0);
                            return name === 'avg_rating'
                              ? [numericValue.toFixed(2), 'Nota média']
                              : [numericValue, 'Avaliações'];
                          }}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="reviews" stroke="#1d4ed8" name="Avaliações" />
                        <Line yAxisId="right" type="monotone" dataKey="avg_rating" stroke="#10b981" name="Nota média" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Top avaliações</h2>
                    <span className="text-xs text-slate-500">por nota média</span>
                  </div>
                  <div className="h-72 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topListings} layout="vertical" margin={{ left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis type="category" dataKey="label" width={120} />
                        <Tooltip
                          formatter={(value: number | string | undefined, name?: string) => {
                            const numericValue = Number(value ?? 0);
                            return name === 'avg_rating'
                              ? [numericValue.toFixed(2), 'Nota média']
                              : [numericValue, 'Avaliações'];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="avg_rating" name="Nota média" fill="#10b981" />
                        <Bar dataKey="total_reviews" name="Avaliações" fill="#1d4ed8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-x-auto">
                <h2 className="text-lg font-semibold text-slate-900">Detalhamento por aeródromo</h2>
                <table className="min-w-full text-sm mt-4">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="py-2 pr-4">ICAO</th>
                      <th className="py-2 pr-4">Aeródromo</th>
                      <th className="py-2 pr-4">Cidade</th>
                      <th className="py-2 pr-4">UF</th>
                      <th className="py-2 pr-4">Avaliações</th>
                      <th className="py-2 pr-4">Nota média</th>
                      <th className="py-2 pr-4">5★</th>
                      <th className="py-2 pr-4">4★</th>
                      <th className="py-2 pr-4">3★</th>
                      <th className="py-2 pr-4">2★</th>
                      <th className="py-2 pr-4">1★</th>
                      <th className="py-2 pr-4">Última avaliação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.rows || []).map((row, index) => (
                      <tr key={`${row.icao_code}-${row.city}-${row.state}-${index}`} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-900">{row.icao_code}</td>
                        <td className="py-2 pr-4">{row.aerodrome_name}</td>
                        <td className="py-2 pr-4">{row.city}</td>
                        <td className="py-2 pr-4">{row.state}</td>
                        <td className="py-2 pr-4">{row.total_reviews}</td>
                        <td className="py-2 pr-4">{Number(row.avg_rating || 0).toFixed(2)}</td>
                        <td className="py-2 pr-4">{row.rating_5_count}</td>
                        <td className="py-2 pr-4">{row.rating_4_count}</td>
                        <td className="py-2 pr-4">{row.rating_3_count}</td>
                        <td className="py-2 pr-4">{row.rating_2_count}</td>
                        <td className="py-2 pr-4">{row.rating_1_count}</td>
                        <td className="py-2 pr-4">
                          {row.last_review_at ? new Date(row.last_review_at).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                    {!data?.rows?.length && (
                      <tr>
                        <td colSpan={12} className="py-6 text-center text-slate-500">
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
