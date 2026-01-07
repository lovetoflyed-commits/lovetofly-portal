'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Aircraft {
  id: string;
  title: string;
  manufacturer: string;
  model: string;
  year: number;
  price: number;
  location_city: string;
  location_state: string;
  category: string;
  total_time?: number;
  primary_photo?: string;
  photo_count: number;
  featured: boolean;
  views: number;
  created_at: string;
}

export default function AircraftClassifieds() {
  const { user } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    state: '',
    min_price: '',
    max_price: '',
    manufacturer: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: 'single-engine', label: 'Monomotor' },
    { value: 'multi-engine', label: 'Multimotor' },
    { value: 'helicopter', label: 'Helicóptero' },
    { value: 'ultralight', label: 'Ultraleve' }
  ];

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    fetchAircraft();
  }, [filters, page]);

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: 'active',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/classifieds/aircraft?${queryParams}`);
      const result = await response.json();

      if (response.ok) {
        if (!result.data || result.data.length === 0) {
          const mockAircraft: Aircraft[] = [
            {
              id: 'cirrus-sr22t-g6-demo',
              title: 'Cirrus SR22T G6',
              manufacturer: 'Cirrus',
              model: 'SR22T G6',
              year: 2022,
              price: 4250000,
              location_city: 'Jundiaí',
              location_state: 'SP',
              category: 'single-engine',
              total_time: 450,
              primary_photo: '/classifieds/aircraft-featured.jpg',
              photo_count: 5,
              featured: true,
              views: 320,
              created_at: new Date().toISOString()
            },
            {
              id: 'cessna-172s-2015-demo',
              title: '2015 CESSNA 172S SKYHAWK',
              manufacturer: 'Cessna',
              model: '172S Skyhawk',
              year: 2015,
              price: 285000,
              location_city: 'São Paulo',
              location_state: 'SP',
              category: 'single-engine',
              total_time: 2150,
              primary_photo: '/aircrafts/2015-cessna-172s-skyhawk.png',
              photo_count: 4,
              featured: true,
              views: 210,
              created_at: new Date().toISOString()
            },
            {
              id: 'extra-330lx-2020-demo',
              title: '2020 EXTRA 330LX',
              manufacturer: 'Extra',
              model: '330LX',
              year: 2020,
              price: 495000,
              location_city: 'Rio de Janeiro',
              location_state: 'RJ',
              category: 'single-engine',
              total_time: 450,
              primary_photo: '/extra330.png',
              photo_count: 3,
              featured: true,
              views: 180,
              created_at: new Date().toISOString()
              },
              {
                id: 'beechcraft-king-air-350i-2018-demo',
                title: '2018 BEECHCRAFT KING AIR 350i',
                manufacturer: 'Beechcraft',
                model: 'King Air 350i',
                year: 2018,
                price: 6500000,
                location_city: 'Belo Horizonte',
                location_state: 'MG',
                category: 'multi-engine',
                total_time: 1890,
                primary_photo: '/aircrafts/2018-beechcraft-king-air-350i.png',
                photo_count: 4,
                featured: true,
                views: 140,
                created_at: new Date().toISOString()
              },
              {
                id: 'cessna-citation-m2-2012-demo',
                title: '2012 CESSNA CITATION M2',
                manufacturer: 'Cessna',
                model: 'Citation M2',
                year: 2012,
                price: 3250000,
                location_city: 'Dallas',
                location_state: 'TX',
                category: 'multi-engine',
                total_time: 2400,
                primary_photo: '/aircrafts/2012-cessna-citation-m2.png',
                photo_count: 4,
                featured: true,
                views: 120,
                created_at: new Date().toISOString()
            }
          ];
          setAircraft(mockAircraft);
          setTotalPages(1);
        } else {
          setAircraft(result.data);
          setTotalPages(result.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      const mockAircraft: Aircraft[] = [
        {
          id: 'cirrus-sr22t-g6-demo',
          title: 'Cirrus SR22T G6',
          manufacturer: 'Cirrus',
          model: 'SR22T G6',
          year: 2022,
          price: 4250000,
          location_city: 'Jundiaí',
          location_state: 'SP',
          category: 'single-engine',
          total_time: 450,
          primary_photo: '/classifieds/aircraft-featured.jpg',
          photo_count: 5,
          featured: true,
          views: 320,
          created_at: new Date().toISOString()
        },
        {
          id: 'beechcraft-king-air-350i-2018-demo',
          title: '2018 BEECHCRAFT KING AIR 350i',
          manufacturer: 'Beechcraft',
          model: 'King Air 350i',
          year: 2018,
          price: 6500000,
          location_city: 'Belo Horizonte',
          location_state: 'MG',
          category: 'multi-engine',
          total_time: 1890,
          primary_photo: '/aircrafts/2018-beechcraft-king-air-350i.png',
          photo_count: 4,
          featured: true,
          views: 140,
          created_at: new Date().toISOString()
        },
        {
          id: 'cessna-citation-m2-2012-demo',
          title: '2012 CESSNA CITATION M2',
          manufacturer: 'Cessna',
          model: 'Citation M2',
          year: 2012,
          price: 3250000,
          location_city: 'Dallas',
          location_state: 'TX',
          category: 'multi-engine',
          total_time: 2400,
          primary_photo: '/aircrafts/2012-cessna-citation-m2.png',
          photo_count: 4,
          featured: true,
          views: 120,
          created_at: new Date().toISOString()
        }
      ];
      setAircraft(mockAircraft);
      setTotalPages(1);
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
                <h1 className="text-3xl font-bold text-gray-900">Aeronaves à Venda</h1>
                <p className="text-gray-600 mt-1">Compre e venda aeronaves com segurança</p>
              </div>
              <Link
                href="/classifieds/aircraft/create"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Anunciar Aeronave
              </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    placeholder="Ex: Cessna"
                    value={filters.manufacturer}
                    onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

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
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setPage(1);
                    setTimeout(() => fetchAircraft(), 0);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Pesquisar
                </button>
                <button
                  onClick={() => {
                    setFilters({ category: '', state: '', min_price: '', max_price: '', manufacturer: '' });
                    setPage(1);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Carregando anúncios...</p>
              </div>
            ) : aircraft.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600">Nenhuma aeronave encontrada com os filtros selecionados.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aircraft.map((item) => (
                    <Link
                      key={item.id}
                      href={`/classifieds/aircraft/${item.id}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      {/* Photo */}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {item.featured && (
                          <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                            DESTAQUE
                          </span>
                        )}
                        {item.photo_count > 1 && (
                          <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            📷 {item.photo_count}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.manufacturer} {item.model} • {item.year}
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-3">
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                          <span>📍 {item.location_city}/{item.location_state}</span>
                          <span>👁️ {item.views}</span>
                        </div>
                        {item.total_time && (
                          <p className="text-xs text-gray-500 mt-2">
                            TT: {item.total_time}h
                          </p>
                        )}
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
