'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

interface Listing {
  id: string;
  title: string;
  price: number;
  location_city: string;
  location_state: string;
  condition: string;
  primary_photo_url: string;
  views: number;
  tso_certified?: boolean;
  panel_mount?: boolean;
  has_certification?: boolean;
}

export default function ClassifiedsPreview() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'aircraft' | 'parts' | 'avionics'>('all');
  const [listings, setListings] = useState<{ aircraft: Listing[]; parts: Listing[]; avionics: Listing[] }>({
    aircraft: [],
    parts: [],
    avionics: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // Mock data to demonstrate the UI
        const mockListings = {
          aircraft: [
            {
              id: '1',
              title: 'Cessna 172R Skyhawk - 2010',
              price: 189500,
              location_city: 'São Paulo',
              location_state: 'SP',
              condition: 'excellent',
              primary_photo_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06',
              views: 342
            },
            {
              id: '2',
              title: 'Piper PA-28 Cherokee - 1999',
              price: 125000,
              location_city: 'Ribeirão Preto',
              location_state: 'SP',
              condition: 'good',
              primary_photo_url: 'https://images.unsplash.com/photo-1462604346223-e0b50159bbf7',
              views: 218
            },
            {
              id: '3',
              title: 'Beechcraft Bonanza G36 - 2015',
              price: 425000,
              location_city: 'Curitiba',
              location_state: 'PR',
              condition: 'excellent',
              primary_photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c3a01e0a',
              views: 567
            }
          ],
          parts: [
            {
              id: '1',
              title: 'Motor Lycoming O-360 Overhauled',
              price: 28500,
              location_city: 'Rio de Janeiro',
              location_state: 'RJ',
              condition: 'new',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092162392-8cd5ae9b3e1d',
              views: 89,
              has_certification: true
            },
            {
              id: '2',
              title: 'Propeller Hartzell MTV-6',
              price: 12400,
              location_city: 'Brasília',
              location_state: 'DF',
              condition: 'good',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
              views: 156,
              has_certification: true
            },
            {
              id: '3',
              title: 'Alternator 28V 55A - Continental',
              price: 3200,
              location_city: 'Belo Horizonte',
              location_state: 'MG',
              condition: 'excellent',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092919281-e821a17abf6d',
              views: 234
            }
          ],
          avionics: [
            {
              id: '1',
              title: 'Garmin GNS 430W WAAS',
              price: 18500,
              location_city: 'Salvador',
              location_state: 'BA',
              condition: 'excellent',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092918037-90c6056ae78f',
              views: 412,
              tso_certified: true,
              panel_mount: true
            },
            {
              id: '2',
              title: 'King KX 155 Navigation/Comm',
              price: 4200,
              location_city: 'Manaus',
              location_state: 'AM',
              condition: 'good',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092162392-8cd5ae9b3e1d',
              views: 187,
              tso_certified: true,
              panel_mount: true
            },
            {
              id: '3',
              title: 'Garmin GTX 330 Transponder',
              price: 5800,
              location_city: 'Porto Alegre',
              location_state: 'RS',
              condition: 'excellent',
              primary_photo_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
              views: 298,
              tso_certified: true,
              panel_mount: true
            }
          ]
        };
        setListings(mockListings);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const getDisplayListings = () => {
    if (activeTab === 'all') {
      return [...listings.aircraft, ...listings.parts, ...listings.avionics].slice(0, 6);
    }
    return listings[activeTab as keyof typeof listings];
  };

  const getCategoryIcon = (listing: Listing) => {
    if (listings.aircraft.includes(listing)) return '✈️';
    if (listings.parts.includes(listing)) return '🔧';
    if (listings.avionics.includes(listing)) return '📡';
    return '📦';
  };

  const getCategoryName = (listing: Listing) => {
    if (listings.aircraft.includes(listing)) return 'Aeronave';
    if (listings.parts.includes(listing)) return 'Peça';
    if (listings.avionics.includes(listing)) return 'Avionics';
    return 'Produto';
  };

  const displayListings = getDisplayListings();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace Preview</h1>
              <p className="text-gray-600 mt-1">Como ficará a seção de Classifieds na Dashboard</p>
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Módulos Existentes (Simulação)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                      <div className="text-xs font-semibold text-blue-900">Seguro Aeronáutico</div>
                      <h3 className="text-lg font-bold">Cotação Imediata</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Proteção completa para sua aeronave</p>
                </div>

                <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎁</span>
                    <div>
                      <div className="text-xs font-semibold text-orange-900">Oferta do Dia</div>
                      <h3 className="text-lg font-bold">Pilot Shop</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Produtos com desconto especial</p>
                </div>

                <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">📚</span>
                    <div>
                      <div className="text-xs font-semibold text-green-900">Cursos</div>
                      <h3 className="text-lg font-bold">Treinamento</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Aprenda com especialistas</p>
                </div>

                <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚙️</span>
                    <div>
                      <div className="text-xs font-semibold text-purple-900">Ferramentas</div>
                      <h3 className="text-lg font-bold">E6B Digital</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Cálculos de voo precisos</p>
                </div>
              </div>
            </section>

            <section className="space-y-6 bg-white rounded-xl shadow-lg border border-blue-200 p-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🛒</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marketplace de Aviação</h2>
                    <p className="text-sm text-gray-600">Compre e venda aeronaves, peças e equipamentos</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{listings.aircraft.length}</div>
                    <div className="text-xs text-gray-600">Aeronaves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{listings.parts.length}</div>
                    <div className="text-xs text-gray-600">Peças</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{listings.avionics.length}</div>
                    <div className="text-xs text-gray-600">Equipamentos</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {(['all', 'aircraft', 'parts', 'avionics'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'all' && '📋 Todos'}
                      {tab === 'aircraft' && '✈️ Aeronaves'}
                      {tab === 'parts' && '🔧 Peças'}
                      {tab === 'avionics' && '📡 Equipamentos'}
                    </button>
                  ))}
                </div>

                <a
                  href="/classifieds/aircraft/create"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  ➕ Anunciar Produto
                </a>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg h-72 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-300 transition"
                    >
                      <div className="relative overflow-hidden bg-gray-200 h-48">
                        {listing.primary_photo_url ? (
                          <img
                            src={listing.primary_photo_url}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                            {getCategoryIcon(listing)}
                          </div>
                        )}

                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          {getCategoryIcon(listing)} {getCategoryName(listing)}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                          {listing.title}
                        </h3>

                        <div className="text-xs">
                          <span className={`inline-block px-2 py-1 rounded font-medium ${
                            listing.condition === 'new'
                              ? 'bg-green-100 text-green-800'
                              : listing.condition === 'excellent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {listing.condition === 'new' ? 'Novo' : listing.condition === 'excellent' ? 'Excelente' : listing.condition}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          📍 {listing.location_city}, {listing.location_state}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="font-bold text-lg text-green-600">
                            R$ {listing.price.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            👁️ {listing.views} views
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-2">
                          {listing.has_certification && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Certificado</span>
                          )}
                          {listing.tso_certified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ TSO</span>
                          )}
                          {listing.panel_mount && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📊 Painel</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center pt-4 border-t border-gray-200">
                <a
                  href={activeTab === 'all' ? '/classifieds/aircraft' : `/classifieds/${activeTab}`}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Ver Todos os Anúncios →
                </a>
              </div>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold text-blue-900">💡 Como usar o Marketplace</h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-900">
                <li className="flex gap-2">
                  <span>🔍</span>
                  <span><strong>Procure:</strong> Use filtros para encontrar exatamente o que precisa</span>
                </li>
                <li className="flex gap-2">
                  <span>💬</span>
                  <span><strong>Negocie:</strong> Envie perguntas diretamente ao vendedor</span>
                </li>
                <li className="flex gap-2">
                  <span>🛡️</span>
                  <span><strong>Seguro:</strong> Transações protegidas e verificadas</span>
                </li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
