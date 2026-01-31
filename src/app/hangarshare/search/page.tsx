'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdvancedFilters from '@/components/AdvancedFilters';

interface Hangar {
  id: number;
  icaoCode: string;
  aerodromeName: string;
  city: string;
  state: string;
  hangarNumber: string;
  locationDescription: string;
  sizeSqm: number;
  maxWingspan: number;
  maxLength: number;
  maxHeight: number;
  acceptedCategories: string[];
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  services: string[];
  description: string;
  operatingHours: any;
  verificationStatus?: string;
  owner: {
    firstName: string;
    lastName: string;
  };
}

interface SearchResult {
  success: boolean;
  message: string;
  suggestion?: string;
  location?: string;
  count?: number;
  hangars: Hangar[];
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const icao = searchParams.get('icao');
  const city = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  useEffect(() => {
    const fetchHangars = async () => {
      // Permitir busca apenas com filtros de preço
      const hasPriceFilter = (minPrice && Number(minPrice) > 0) || (maxPrice && Number(maxPrice) < 20000);
      
      if (!icao && !city && !hasPriceFilter) {
        router.push('/hangarshare');
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (icao) params.append('icao', icao);
        if (city) params.append('city', city);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);

        // Add applied filters
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        const response = await fetch(`/api/hangarshare/search?${params.toString()}`);
        const data = await response.json();
        setResult(data);

        // Load favorites if user is authenticated
        if (user && token) {
          const favResponse = await fetch('/api/hangarshare/favorites', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (favResponse.ok) {
            const favData = await favResponse.json();
            const favIds = new Set<number>(favData.favorites.map((f: any) => Number(f.listing_id)));
            setFavorites(favIds);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar hangares:', error);
        setResult({
          success: false,
          message: 'Erro ao buscar hangares. Tente novamente.',
          hangars: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHangars();
  }, [icao, city, minPrice, maxPrice, router, user, token, appliedFilters]);

  const handleApplyFilters = (filters: any) => {
    setAppliedFilters(filters);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      'eletricidade': '⚡ Eletricidade',
      'agua': '💧 Água',
      'seguranca24h': '🔒 Segurança 24h',
      'seguranca': '🔒 Segurança',
      'iluminacao': '💡 Iluminação',
      'wifi': '📶 Wi-Fi',
      'ar_condicionado': '❄️ Ar Condicionado',
      'combustivel_proximo': '⛽ Combustível Próximo',
      'manutencao_disponivel': '🔧 Manutenção',
      'limpeza': '🧹 Limpeza',
      'sala_reuniao': '🏢 Sala de Reunião',
      'lavagem': '🚿 Lavagem',
      'area_carregamento': '📦 Área de Carregamento',
    };
    return labels[service] || service;
  };

  const toggleFavorite = async (listingId: number) => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    const isFavorited = favorites.has(listingId);
    
    try {
      const response = await fetch('/api/hangarshare/favorites', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listing_id: listingId })
      });

      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (isFavorited) {
            newFavorites.delete(listingId);
          } else {
            newFavorites.add(listingId);
          }
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Buscando hangares disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="font-black text-xl">HangarShare</h1>
              <p className="text-xs text-blue-200">Resultados da Busca</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/hangarshare')}
            className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50 text-sm"
          >
            ← Nova Busca
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Advanced Filters */}
        <AdvancedFilters 
          onApplyFilters={handleApplyFilters}
          initialFilters={{
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            ...appliedFilters
          }}
        />

        {/* Search Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {city ? `Hangares em ${city}` : icao ? `Hangares em ${icao}` : 'Resultados'}
          </h2>
          {result?.location && (
            <p className="text-slate-600 mt-1">{result.location}</p>
          )}
        </div>
        {/* Conditional rendering for results or CTA */}
        {result && result.hangars && result.hangars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-6 text-lg font-semibold">Nenhum hangar encontrado para os filtros selecionados.</p>
            <button
              onClick={() => router.push('/hangarshare/owner/register')}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
            >
              📝 Anunciar Meu Hangar
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-6">
              {result?.count} hangar{result?.count !== 1 ? 'es' : ''} encontrado{result?.count !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 gap-6">
              {result?.hangars?.map((hangar) => (
                <div 
                  key={hangar.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-slate-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold text-blue-900">
                            Hangar {hangar.hangarNumber}
                          </h3>
                          {['verified', 'approved'].includes(hangar.verificationStatus || '') && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                              ✅ Verificado
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 font-mono text-sm">
                          {hangar.icaoCode} • {hangar.aerodromeName}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {hangar.city}/{hangar.state}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        {/* Heart Icon for Favorites */}
                        {user && (
                          <button
                            onClick={() => toggleFavorite(hangar.id)}
                            className="p-2 rounded-full hover:bg-red-50 transition-colors group"
                            title={favorites.has(hangar.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            {favorites.has(hangar.id) ? (
                              <svg className="w-6 h-6 fill-red-500" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 stroke-red-400 group-hover:stroke-red-500 fill-none" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            )}
                          </button>
                        )}
                        <div className="text-right">
                          <div className="text-sm text-slate-500">A partir de</div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {formatPrice(hangar.pricing.daily)}/dia
                          </div>
                          {hangar.pricing.monthly && (
                            <div className="text-sm text-slate-600">
                              {formatPrice(hangar.pricing.monthly)}/mês
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {hangar.description && (
                      <p className="text-slate-700 mb-4 leading-relaxed">
                        {hangar.description}
                      </p>
                    )}
                    {/* Specifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-slate-50 rounded-lg p-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Área</div>
                        <div className="text-lg font-bold text-slate-800">{hangar.sizeSqm}m²</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Envergadura</div>
                        <div className="text-lg font-bold text-slate-800">{hangar.maxWingspan}m</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Comprimento</div>
                        <div className="text-lg font-bold text-slate-800">{hangar.maxLength}m</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Altura</div>
                        <div className="text-lg font-bold text-slate-800">{hangar.maxHeight}m</div>
                      </div>
                    </div>
                    {/* Services */}
                    {hangar.services && hangar.services.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-bold text-slate-700 mb-2">Serviços e Comodidades:</div>
                        <div className="flex flex-wrap gap-2">
                          {hangar.services.map((service: string, idx: number) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full"
                            >
                              {getServiceLabel(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hangar.locationDescription && (
                      <p className="text-sm text-slate-600 mb-4">
                        📍 {hangar.locationDescription}
                      </p>
                    )}
                    {/* Owner Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        Anunciado por: <span className="font-bold">{hangar.owner.firstName} {hangar.owner.lastName}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/hangarshare/listing/${hangar.id}`)}
                        className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                      >
                        Ver Detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HangarSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900"></div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
