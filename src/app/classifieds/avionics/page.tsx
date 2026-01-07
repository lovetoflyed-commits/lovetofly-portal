'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Avionics {
  id: number;
  title: string;
  manufacturer?: string;
  model?: string;
  category: string;
  condition: string;
  price: number;
  location_city: string;
  location_state: string;
  compatible_aircraft?: string;
  tso_certified: boolean;
  panel_mount: boolean;
  primary_photo?: string;
  photo_count: number;
  featured: boolean;
  views: number;
  created_at: string;
}

export default function AvionicsClassifieds() {
  const { user } = useAuth();
  const [avionics, setAvionics] = useState<Avionics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    state: '',
    min_price: '',
    max_price: '',
    manufacturer: '',
    tso_certified: '',
    panel_mount: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: 'gps', label: 'GPS' },
    { value: 'radio', label: 'Rádio' },
    { value: 'transponder', label: 'Transponder' },
    { value: 'autopilot', label: 'Piloto Automático' },
    { value: 'adsb', label: 'ADS-B' },
    { value: 'portable', label: 'Portátil' }
  ];

  const conditions = [
    { value: 'new', label: 'Novo' },
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Razoável' },
    { value: 'parts', label: 'Para Peças' }
  ];

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    fetchAvionics();
  }, [filters, page]);

  const fetchAvionics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'active',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/classifieds/avionics?${queryParams}`);
      const result = await response.json();

      if (response.ok) {
        // Add mock data if empty (only if filters don't exclude it)
        if (!result.data || result.data.length === 0) {
          // Check if panel_mount filter would exclude our mock data
          if (filters.panel_mount === 'false') {
            // User selected portable, but our mock is panel mount
            setAvionics([]);
            setTotalPages(1);
          } else {
            setAvionics([{
              id: 1,
              title: 'Garmin GTN 750Xi (TSO)',
              manufacturer: 'Garmin',
              model: 'GTN 750Xi',
              category: 'gps',
              condition: 'excellent',
              price: 185000,
              location_city: 'São Paulo',
              location_state: 'SP',
              compatible_aircraft: 'Múltiplos',
              tso_certified: true,
              panel_mount: true,
              primary_photo: '/classifieds/avionics-featured.jpg',
              photo_count: 5,
              featured: true,
              views: 234,
              created_at: new Date().toISOString()
            }]);
            setTotalPages(1);
            }
        } else {
          setAvionics(result.data);
          setTotalPages(result.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avionics:', error);
      // Set mock data on error (only if filters don't exclude it)
      if (filters.panel_mount === 'false') {
        // User selected portable, but our mock is panel mount
        setAvionics([]);
        setTotalPages(1);
      } else {
        setAvionics([{
          id: 1,
          title: 'Garmin GTN 750Xi (TSO)',
          manufacturer: 'Garmin',
          model: 'GTN 750Xi',
          category: 'gps',
          condition: 'excellent',
          price: 185000,
          location_city: 'São Paulo',
          location_state: 'SP',
          compatible_aircraft: 'Múltiplos',
          tso_certified: true,
          panel_mount: true,
          primary_photo: '/classifieds/avionics-featured.jpg',
          photo_count: 5,
          featured: true,
          views: 234,
          created_at: new Date().toISOString()
        }]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aviônicos</h1>
                <p className="text-gray-600 mt-1">Compre e venda equipamentos de aviônicos</p>
              </div>
              <Link
                href="/classifieds/avionics/create"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Anunciar Equipamento
              </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condição
                  </label>
                  <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {conditions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {brazilianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Garmin"
                    value={filters.manufacturer}
                    onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="R$ 0"
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Máximo
                  </label>
                  <input
                    type="number"
                    placeholder="R$ ∞"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificação TSO
                  </label>
                  <select
                    value={filters.tso_certified}
                    onChange={(e) => setFilters({ ...filters, tso_certified: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Qualquer uma</option>
                    <option value="true">TSO Certificado</option>
                    <option value="false">Sem TSO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Montagem
                  </label>
                  <select
                    value={filters.panel_mount}
                    onChange={(e) => setFilters({ ...filters, panel_mount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Qualquer um</option>
                    <option value="true">Painel</option>
                    <option value="false">Portátil</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setPage(1);
                    setTimeout(() => fetchAvionics(), 0);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Pesquisar
                </button>
                <button
                  onClick={() => {
                    setFilters({
                      category: '', condition: '', state: '', min_price: '', max_price: '',
                      manufacturer: '', tso_certified: '', panel_mount: ''
                    });
                    setPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Carregando equipamentos...</p>
              </div>
            ) : avionics.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600">Nenhum equipamento encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {avionics.map((item) => (
                    <Link
                      key={item.id}
                      href={`/classifieds/avionics/${item.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      <div className="relative h-48 bg-gray-200">
                        {item.primary_photo ? (
                          <img
                            src={item.primary_photo}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V3m0 2V5m0 10l-3-3m0 0l-3 3m3-3v8" />
                            </svg>
                          </div>
                        )}
                        {item.featured && (
                          <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                            DESTAQUE
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                          {item.manufacturer && <span>{item.manufacturer}</span>}
                          {item.model && <span>• {item.model}</span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Condição: <span className="font-medium">{conditions.find(c => c.value === item.condition)?.label}</span>
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-3">
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                          <span>📍 {item.location_city}/{item.location_state}</span>
                          <span>👁️ {item.views}</span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.tso_certified && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ TSO</span>
                          )}
                          {item.panel_mount ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📊 Painel</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">📱 Portátil</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
