"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type WeatherResponse = {
  raw?: string;
  metar?: string;
  taf?: string;
  station?: string;
  time?: string;
};

type NotamItem = {
  id: string | null;
  location: string;
  text: string;
  start: string | null;
  end: string | null;
  created?: string | null;
  type?: string | null;
};

type Chart = {
  name: string;
  type: string;
  path: string;
  size: number;
};

export default function ProceduresPage() {
  const params = useParams() as Record<string, string | string[]>;
  const rawParam = params?.icao;
  const code = (Array.isArray(rawParam) ? (rawParam[0] || '') : (rawParam || '')).toUpperCase();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [notams, setNotams] = useState<NotamItem[]>([]);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSearch, setChartSearch] = useState('');
  const [chartTypeFilter, setChartTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);
        const [wRes, nRes, cRes] = await Promise.all([
          fetch(`/api/weather/metar?icao=${code}`),
          fetch(`/api/notam?icao=${code}`),
          fetch(`/api/charts?icao=${code}`)
        ]);
        const wJson = await wRes.json();
        const nJson = await nRes.json();
        const cJson = await cRes.json();
        if (!wRes.ok) throw new Error(wJson?.message || 'Falha METAR/TAF');
        if (!nRes.ok) throw new Error(nJson?.message || 'Falha NOTAMs');
        const wData = wJson?.data || wJson;
        if (isMounted) {
          setWeather(wData);
          setNotams(nJson?.notams || []);
          setCharts(cJson?.charts || []);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Erro ao carregar dados');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (/^[A-Z]{4}$/.test(code)) {
      fetchAll();
    } else {
      setError('ICAO inválido');
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [code]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Procedimentos & NOTAMs — {code}</h1>
        <Link href="/" className="px-3 py-1.5 bg-slate-800 text-white text-sm font-bold rounded hover:bg-slate-700">
          Voltar ao Dashboard
        </Link>
      </div>
      {loading && (
        <div className="rounded-lg border border-slate-200 p-4 bg-white">Carregando…</div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 p-4 bg-red-50 text-red-700 mb-4">{error}</div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* METAR/TAF */}
          <div id="procedures" className="lg:col-span-1 rounded-lg border border-slate-200 p-4 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-2">METAR & TAF</h2>
            <div className="text-sm text-slate-800 space-y-2">
              <div>
                <span className="font-semibold">METAR:</span>{' '}
                {weather?.raw || weather?.metar || 'Não disponível'}
              </div>
              <div>
                <span className="font-semibold">TAF:</span>{' '}
                {weather?.taf || 'Não disponível'}
              </div>
              <div className="text-xs text-slate-500">Estação: {weather?.station || code} • Hora: {weather?.time || '-'}</div>
            </div>
          </div>
          {/* ROTAER / Procedimentos & Cartas */}
          <div id="rotaer" className="rounded-lg border border-slate-200 p-4 bg-white">
            <h2 className="text-lg font-bold text-slate-900 mb-2">ROTAER & Procedimentos</h2>
            <p className="text-sm text-slate-700 mb-3">
              Consulte no AISWEB para ROTAER oficial e procedimentos detalhados do aeródromo.
            </p>
            <a
              href="https://aisweb.decea.mil.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded hover:bg-blue-800"
            >
              Abrir AISWEB
            </a>
          </div>

          {/* Cartas Aeronáuticas */}
          <div id="charts" className="lg:col-span-2 rounded-lg border border-slate-200 p-4 bg-white">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Cartas Aeronáuticas</h2>
              <p className="text-xs text-slate-500">© DECEA/AISWEB • Fornecidas para fins de planejamento não-comercial</p>
            </div>
            {charts.length === 0 ? (
              <div className="text-sm text-slate-700">Nenhuma carta disponível para este aeródromo.</div>
            ) : (
              <div className="space-y-3">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3 pb-3 border-b border-slate-200">
                  <input
                    type="text"
                    placeholder="Buscar por nome da carta..."
                    value={chartSearch}
                    onChange={(e) => setChartSearch(e.target.value.toUpperCase())}
                    className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <select
                    value={chartTypeFilter || ''}
                    onChange={(e) => setChartTypeFilter(e.target.value || null)}
                    className="rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Todos os tipos</option>
                    {(() => {
                      const types = [...new Set(charts.map(c => c.type))].sort();
                      return types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Filtered Charts */}
                {(() => {
                  const filtered = charts.filter(c => {
                    const matchesSearch = chartSearch === '' || c.name.toUpperCase().includes(chartSearch);
                    const matchesType = chartTypeFilter === null || c.type === chartTypeFilter;
                    return matchesSearch && matchesType;
                  });

                  if (filtered.length === 0) {
                    return <div className="text-sm text-slate-700">Nenhuma carta encontrada com os filtros selecionados.</div>;
                  }

                  const grouped = filtered.reduce((acc, chart) => {
                    if (!acc[chart.type]) acc[chart.type] = [];
                    acc[chart.type].push(chart);
                    return acc;
                  }, {} as Record<string, typeof filtered>);

                  return Object.entries(grouped).map(([type, items]) => (
                    <div key={type} className="rounded border border-slate-200 p-3">
                      <h3 className="text-sm font-semibold text-slate-800 mb-2">{type} ({items.length})</h3>
                      <ul className="space-y-1">
                        {items.map((chart, idx) => (
                          <li key={idx}>
                            <a
                              href={chart.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {chart.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* NOTAMs */}
          <div id="notams" className="lg:col-span-2 rounded-lg border border-slate-200 p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">NOTAMs</h2>
              <a
                href="https://aisweb.decea.mil.br"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-500"
              >
                Abrir no AISWEB
              </a>
            </div>
            {notams.length === 0 ? (
              <div className="text-sm text-slate-700">Nenhum NOTAM encontrado.</div>
            ) : (
              <ul className="space-y-3">
                {notams.map((n, idx) => (
                  <li key={n.id ?? idx} className="rounded border border-slate-200 p-3">
                    <div className="text-xs text-slate-500 mb-1">
                      {n.location} • Início: {n.start || '-'} • Fim: {n.end || '-'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-slate-800">{n.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
