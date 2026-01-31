'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface FavoriteListing {
  favorite_id: string;
  favorited_at: string;
  listing_id: string;
  hangar_number: string;
  icao_code: string;
  description: string;
  daily_rate: number | null;
  monthly_rate: number | null;
  size_sqm: number | null;
  max_wingspan: number | null;
  max_length: number | null;
  max_height: number | null;
  security_features: string[];
  airport_name: string;
  city: string;
  state: string;
  total_bookings: number;
  avg_rating?: number;
  review_count?: number;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchFavorites();
  }, [user, token, router]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hangarshare/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId: string) => {
    try {
      const response = await fetch('/api/hangarshare/favorites', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listing_id: listingId })
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(f => f.listing_id !== listingId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Carregando seus favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="font-black text-2xl">❤️ Meus Favoritos</h1>
                <p className="text-blue-200 text-sm">
                  {favorites.length} {favorites.length === 1 ? 'hangar salvo' : 'hangares salvos'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/hangarshare')}
              className="px-4 py-2 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition-colors"
            >
              🔍 Buscar Hangares
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nenhum favorito ainda</h2>
            <p className="text-slate-600 mb-6">
              Comece a explorar hangares e adicione seus favoritos clicando no ❤️
            </p>
            <button
              onClick={() => router.push('/hangarshare')}
              className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
            >
              Explorar Hangares
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {favorites.map((favorite) => (
              (() => {
                const nightlyPrice = favorite.daily_rate ?? (favorite.monthly_rate ? favorite.monthly_rate / 30 : 0);
                const priceLabel = nightlyPrice > 0 ? formatPrice(nightlyPrice) : '—';
                const capacityLabel = favorite.size_sqm ? `${favorite.size_sqm} m²` : '—';
                const widthLabel = favorite.max_wingspan ? `${favorite.max_wingspan}m` : '—';
                const depthLabel = favorite.max_length ? `${favorite.max_length}m` : '—';
                const heightLabel = favorite.max_height ? `${favorite.max_height}m` : '—';

                return (
              <div 
                key={favorite.favorite_id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-900 mb-1">
                        {`Hangar ${favorite.hangar_number}`}
                      </h3>
                      <p className="text-slate-600 font-mono text-sm">
                        {favorite.icao_code} • {favorite.airport_name}
                      </p>
                      <p className="text-slate-500 text-sm">
                        {favorite.city}/{favorite.state}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        💾 Adicionado em {formatDate(favorite.favorited_at)}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      {/* Remove from favorites button */}
                      <button
                        onClick={() => removeFavorite(favorite.listing_id)}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors group"
                        title="Remover dos favoritos"
                      >
                        <svg className="w-6 h-6 fill-red-500" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">A partir de</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {priceLabel}/noite
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {favorite.description && (
                    <p className="text-slate-700 mb-4 leading-relaxed">
                      {favorite.description}
                    </p>
                  )}

                  {/* Specifications */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-slate-50 rounded-lg p-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">Capacidade</div>
                      <div className="text-lg font-bold text-slate-800">{capacityLabel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">Largura</div>
                      <div className="text-lg font-bold text-slate-800">{widthLabel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">Profundidade</div>
                      <div className="text-lg font-bold text-slate-800">{depthLabel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">Altura</div>
                      <div className="text-lg font-bold text-slate-800">{heightLabel}</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {favorite.has_electricity && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                        ⚡ Eletricidade
                      </span>
                    )}
                    {favorite.has_water && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        💧 Água
                      </span>
                    )}
                    {favorite.has_bathroom && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        🚽 Banheiro
                      </span>
                    )}
                    {favorite.security_features && favorite.security_features.length > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                        🔒 Segurança
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  {(favorite.total_bookings > 0 || (favorite.review_count || 0) > 0) && (
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                      {favorite.total_bookings > 0 && (
                        <span>📅 {favorite.total_bookings} reservas</span>
                      )}
                      {(favorite.review_count || 0) > 0 && (
                        <span>
                          ⭐ {favorite.avg_rating?.toFixed(1)} ({favorite.review_count} avaliações)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => router.push(`/hangarshare/listing/${favorite.listing_id}`)}
                      className="flex-1 px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Ver Detalhes →
                    </button>
                    <button
                      onClick={() => router.push(`/hangarshare/booking/checkout?listing=${favorite.listing_id}`)}
                      className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Reservar Agora
                    </button>
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
