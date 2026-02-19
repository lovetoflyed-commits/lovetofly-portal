'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PhotoGallery from '@/components/PhotoGallery';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';

interface Photo {
  id: number;
  photoUrl: string;
  displayOrder: number;
}

interface HangarListing {
  id: number;
  hangarNumber: string;
  icao: string;
  aerodromeName: string;
  city: string;
  state: string;
  sizeSqm: string;
  maxWingspan: string;
  maxLength: string;
  maxHeight: string;
  aircraftCategories: string[];
  hourlyRate: number | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  monthlyRate: number;
  operatingHours: any;
  services: string[];
  description: string;
  specialNotes: string;
  photos: Photo[] | string[]; // Support both old and new formats
  isActive: boolean;
  verificationStatus?: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  createdAt: string;
}

interface BookingCalculation {
  nights: number;
  days: number;
  hours: number;
  breakdown: {
    period: string;
    quantity: number;
    rate: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount?: {
    code: string;
    description?: string;
    type: string;
    value: number;
    amount: number;
  } | null;
  subtotalAfterDiscount?: number;
  fees: number;
  total: number;
  savings?: {
    comparedTo: string;
    amount: number;
    percentage: number;
  };
}

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const hasNumber = (value: number | string | null | undefined): boolean => toNumber(value) !== null;

const formatMoney = (value: number | string | null | undefined): string => {
  const num = toNumber(value);
  return num === null ? '—' : num.toFixed(2);
};

const normalizeHangarListing = (raw: any): HangarListing => {
  const isActive =
    typeof raw?.isActive === 'boolean'
      ? raw.isActive
      : typeof raw?.isAvailable === 'boolean'
        ? raw.isAvailable
        : raw?.status === 'active';

  return {
    ...raw,
    icao: raw?.icao ?? raw?.icaoCode ?? '',
    sizeSqm: raw?.sizeSqm ?? raw?.hangarSizeSqm ?? '',
    maxWingspan: raw?.maxWingspan ?? raw?.maxWingspanMeters ?? '',
    maxLength: raw?.maxLength ?? raw?.maxLengthMeters ?? '',
    maxHeight: raw?.maxHeight ?? raw?.maxHeightMeters ?? '',
    aircraftCategories: raw?.aircraftCategories ?? raw?.acceptedAircraftCategories ?? [],
    isActive,
  } as HangarListing;
};

export default function HangarListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [hangar, setHangar] = useState<HangarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [showBooking, setShowBooking] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculation, setCalculation] = useState<BookingCalculation | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  // Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  // Message states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchHangar = async () => {
      try {
        const response = await fetch(`/api/hangarshare/listing/${params.id}`);
        if (!response.ok) {
          throw new Error('Hangar não encontrado');
        }
        const data = await response.json();
        setHangar(normalizeHangarListing(data.hangar));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchHangar();
    }
  }, [params.id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!params.id) return;

      setLoadingReviews(true);
      try {
        const response = await fetch(`/api/hangarshare/reviews?listing_id=${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setReviewStats(data.stats);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [params.id]);

  useEffect(() => {
    const reviewId = searchParams.get('edit-review');
    if (!reviewId) {
      setEditingReview(null);
      return;
    }

    const matched = reviews.find((review) => String(review.id) === String(reviewId));
    setEditingReview(matched || null);
  }, [searchParams, reviews]);

  const calculatePrice = async (overridePromo?: string | null) => {
    if (!checkIn || !checkOut) {
      alert('Selecione as datas de entrada e saída');
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      alert('A data de saída deve ser posterior à data de entrada');
      return;
    }

    setCalculatingPrice(true);
    setPromoError('');
    try {
      const promoSource = typeof overridePromo === 'string' ? overridePromo : promoCode;
      const promoToApply = promoSource.trim();
      const response = await fetch('/api/hangarshare/booking/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hangarId: params.id,
          checkIn,
          checkOut,
          promoCode: promoToApply || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao calcular preço');
      }

      const data = await response.json();
      setCalculation(data.calculation);

      if (promoToApply && !data.calculation?.discount) {
        setPromoError('Código inválido ou expirado');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleBooking = () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/hangarshare/listing/${params.id}`));
      return;
    }
    setShowBooking(true);
  };

  const handleReport = async () => {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(`/hangarshare/listing/${params.id}`));
      return;
    }

    const reason = window.prompt('Descreva o motivo da denúncia');
    if (!reason) return;

    const details = window.prompt('Detalhes adicionais (opcional)') || null;

    try {
      const response = await fetch('/api/moderation/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: 'hangar_listing',
          contentId: Number(params.id),
          reason,
          details,
        }),
      });

      if (response.ok) {
        alert('Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.');
      } else {
        const data = await response.json();
        alert(data.message || 'Não foi possível enviar a denúncia.');
      }
    } catch (error) {
      console.error('Error reporting listing:', error);
      alert('Não foi possível enviar a denúncia.');
    }
  };

  const handleSendMessage = async () => {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent(`/hangarshare/listing/${params.id}`));
      return;
    }

    if (!messageSubject.trim() || !messageContent.trim()) {
      alert('Por favor, preencha o assunto e a mensagem.');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: hangar?.ownerId,
          module: 'hangarshare',
          subject: messageSubject,
          message: messageContent,
          priority: 'normal',
          relatedEntityType: 'hangar_listing',
          relatedEntityId: Number(params.id),
        }),
      });

      if (response.ok) {
        alert('Mensagem enviada com sucesso!');
        setShowMessageModal(false);
        setMessageSubject('');
        setMessageContent('');
      } else {
        const data = await response.json();
        alert(data.message || 'Não foi possível enviar a mensagem.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Não foi possível enviar a mensagem.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !hangar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-slate-600 mb-6">{error || 'Hangar não encontrado'}</p>
          <button
            onClick={() => router.push('/hangarshare')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Hangar ${hangar.hangarNumber} - ${hangar.icao}`,
    description: hangar.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: toNumber(hangar.monthlyRate) ?? toNumber(hangar.dailyRate) ?? toNumber(hangar.hourlyRate) ?? 0,
      availability: hangar.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-bold mb-6 flex items-center gap-2"
        >
          ← Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title & Location */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-blue-900 mb-2">
                    Hangar {hangar.hangarNumber}
                  </h1>
                  <p className="text-lg text-slate-600">
                    📍 {hangar.icao} - {hangar.aerodromeName}
                  </p>
                  <p className="text-md text-slate-500">
                    {hangar.city}, {hangar.state}
                  </p>
                  {reviewStats && (
                    <p className="text-sm text-slate-600 mt-2">
                      ⭐ {reviewStats.avg_rating || 0} ({reviewStats.total_reviews || 0} avaliações)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hangar.isActive && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-full text-sm">
                      ✓ Disponível
                    </span>
                  )}
                  {['verified', 'approved'].includes(hangar.verificationStatus || '') && (
                    <span className="px-3 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-full text-sm">
                      ✅ Verificado
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Valores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hasNumber(hangar.hourlyRate) && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Por hora</p>
                      <p className="text-xl font-black text-blue-900">
                        R$ {formatMoney(hangar.hourlyRate)}
                      </p>
                    </div>
                  )}
                  {hasNumber(hangar.dailyRate) && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Diária</p>
                      <p className="text-xl font-black text-blue-900">
                        R$ {formatMoney(hangar.dailyRate)}
                      </p>
                    </div>
                  )}
                  {hasNumber(hangar.weeklyRate) && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Semanal</p>
                      <p className="text-xl font-black text-blue-900">
                        R$ {formatMoney(hangar.weeklyRate)}
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-900 text-white rounded-lg p-3">
                    <p className="text-xs mb-1">Mensal</p>
                    <p className="text-xl font-black">
                      R$ {formatMoney(hangar.monthlyRate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos Gallery */}
            {hangar.photos && hangar.photos.length > 0 && (
              <PhotoGallery
                photos={hangar.photos as Photo[]}
                title={`Fotos do Hangar ${hangar.hangarNumber}`}
              />
            )}

            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Descrição</h3>
              <p className="text-slate-700 whitespace-pre-line">{hangar.description}</p>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Especificações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📏</span>
                  <div>
                    <p className="font-bold text-slate-900">Área Total</p>
                    <p className="text-slate-600">{hangar.sizeSqm} m²</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <p className="font-bold text-slate-900">Envergadura Máxima</p>
                    <p className="text-slate-600">{hangar.maxWingspan} metros</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📐</span>
                  <div>
                    <p className="font-bold text-slate-900">Comprimento Máximo</p>
                    <p className="text-slate-600">{hangar.maxLength} metros</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-bold text-slate-900">Altura Máxima</p>
                    <p className="text-slate-600">{hangar.maxHeight} metros</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🛩️</span>
                  <div>
                    <p className="font-bold text-slate-900">Categorias Aceitas</p>
                    <p className="text-slate-600 capitalize">
                      {hangar.aircraftCategories?.join(', ') || 'Todas'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            {hangar.services && hangar.services.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Serviços e Comodidades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hangar.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-slate-700 capitalize">{service.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Notes */}
            {hangar.specialNotes && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ Observações Importantes</h3>
                <p className="text-slate-700 whitespace-pre-line">{hangar.specialNotes}</p>
              </div>
            )}

            {/* Owner Contact */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Contato do Proprietário</h3>
              <div className="space-y-2">
                <p className="text-slate-700">
                  <span className="font-bold">Nome:</span> {hangar.ownerName}
                </p>
                <p className="text-slate-700">
                  <span className="font-bold">Email:</span>{' '}
                  <a href={`mailto:${hangar.ownerEmail}`} className="text-blue-600 hover:underline">
                    {hangar.ownerEmail}
                  </a>
                </p>
                {hangar.ownerPhone && (
                  <p className="text-slate-700">
                    <span className="font-bold">Telefone:</span>{' '}
                    <a href={`tel:${hangar.ownerPhone}`} className="text-blue-600 hover:underline">
                      {hangar.ownerPhone}
                    </a>
                  </p>
                )}
              </div>
              {user && (
                <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <span>✉️</span>
                    <span>Enviar Mensagem ao Proprietário</span>
                  </button>
                  <button
                    onClick={handleReport}
                    className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                  >
                    ⚠️ Reportar anúncio
                  </button>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              {!loadingReviews && reviewStats && (
                <ReviewList
                  listingId={parseInt(String(params.id))}
                  reviews={reviews}
                  stats={reviewStats}
                  onReviewDeleted={(reviewId) => {
                    setReviews(reviews.filter(r => r.id !== reviewId));
                  }}
                  onReviewUpdated={(updatedReview) => {
                    setReviews(reviews.map(r => r.id === updatedReview.id ? updatedReview : r));
                  }}
                />
              )}

              {user && token && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <ReviewForm
                    listingId={parseInt(String(params.id))}
                    existingReview={editingReview}
                    onReviewSubmitted={(newReview) => {
                      setReviews([
                        newReview,
                        ...reviews.filter((review) => review.id !== newReview.id)
                      ]);
                      setEditingReview(null);
                    }}
                  />
                </div>
              )}

              {!user && reviews.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">
                    Faça login para deixar uma avaliação
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    Fazer Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Fazer Reserva</h3>

              {!showBooking ? (
                <button
                  onClick={handleBooking}
                  className="w-full py-4 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition"
                >
                  Calcular Valor e Reservar
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Date Inputs */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={() => calculatePrice()}
                    disabled={calculatingPrice || !checkIn || !checkOut}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                  >
                    {calculatingPrice ? 'Calculando...' : 'Calcular Valor'}
                  </button>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-bold text-amber-900 mb-2">🏷️ Código promocional</h4>
                    <p className="text-xs text-amber-800 mb-3">Opcional - deixe em branco se nao tiver codigo.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && calculatePrice()}
                        placeholder="Digite o código..."
                        className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                      <button
                        onClick={() => calculatePrice()}
                        disabled={calculatingPrice || !promoCode.trim() || !checkIn || !checkOut}
                        className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        {calculatingPrice ? 'Validando...' : 'Aplicar'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-red-600 text-sm mt-2">❌ {promoError}</p>
                    )}
                    {calculation?.discount && (
                      <div className="flex items-center justify-between mt-3 text-sm text-green-700">
                        <span>✓ {calculation.discount.code} aplicado</span>
                        <button
                          onClick={() => {
                            setPromoCode('');
                            calculatePrice('');
                          }}
                          className="text-green-700 hover:text-red-600 font-semibold"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  {calculation && (
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <h4 className="font-bold text-slate-900 mb-3">Detalhamento do Valor</h4>

                      <div className="space-y-2 mb-4">
                        {calculation.breakdown.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              {item.quantity}x {item.period} @ R$ {formatMoney(item.rate)}
                            </span>
                            <span className="font-bold text-slate-900">
                              R$ {formatMoney(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {calculation.savings && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-800">
                            💰 <span className="font-bold">Economia de R$ {calculation.savings.amount.toFixed(2)}</span>
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {calculation.savings.percentage.toFixed(0)}% mais barato que {calculation.savings.comparedTo}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="text-slate-900">R$ {calculation.subtotal.toFixed(2)}</span>
                        </div>
                        {calculation.discount && (
                          <div className="flex justify-between mb-2 text-green-700 font-semibold">
                            <span>Desconto ({calculation.discount.code})</span>
                            <span>-R$ {calculation.discount.amount.toFixed(2)}</span>
                          </div>
                        )}
                        {typeof calculation.subtotalAfterDiscount === 'number' && calculation.discount && (
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-600">Subtotal com desconto</span>
                            <span className="text-slate-900">R$ {calculation.subtotalAfterDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-600">Taxa de serviço (5%)</span>
                          <span className="text-slate-900">R$ {calculation.fees.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                          <span className="text-blue-900">Total</span>
                          <span className="text-blue-900">R$ {calculation.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!user) {
                            router.push('/login?redirect=' + encodeURIComponent(`/hangarshare/listing/${params.id}`));
                            return;
                          }
                          // Redirect to checkout with query parameters
                          const checkoutUrl = new URL('/hangarshare/booking/checkout', window.location.origin);
                          checkoutUrl.searchParams.set('hangarId', String(params.id));
                          checkoutUrl.searchParams.set('userId', String(user.id));
                          checkoutUrl.searchParams.set('checkIn', checkIn);
                          checkoutUrl.searchParams.set('checkOut', checkOut);
                          checkoutUrl.searchParams.set('totalPrice', String(calculation.total));
                          checkoutUrl.searchParams.set('subtotal', String(calculation.subtotal));
                          checkoutUrl.searchParams.set('fees', String(calculation.fees));
                          if (calculation.discount?.code) {
                            checkoutUrl.searchParams.set('promoCode', calculation.discount.code);
                          }
                          router.push(checkoutUrl.toString());
                        }}
                        className="w-full mt-4 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                      >
                        Confirmar Reserva
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4 text-center">
                Você não será cobrado ainda
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-900">Enviar Mensagem</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Enviando mensagem para: <span className="font-bold">{hangar?.ownerName}</span>
              </p>
              <p className="text-sm text-slate-600">
                Referente ao: <span className="font-bold">Hangar {hangar?.hangarNumber} - {hangar?.icao}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Ex: Interesse em alugar o hangar"
                  maxLength={255}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageSubject.length}/255 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem...\n\nEx: Olá, tenho interesse em alugar seu hangar. Gostaria de mais informações sobre disponibilidade e valores."
                  rows={8}
                  maxLength={10000}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageContent.length}/10000 caracteres
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <span className="font-bold">Dica:</span> Seja claro e objetivo. Inclua informações como período desejado, tipo de aeronave e necessidades específicas.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition"
                disabled={sendingMessage}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageSubject.trim() || !messageContent.trim()}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                {sendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
