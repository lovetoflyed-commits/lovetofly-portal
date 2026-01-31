'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Photo {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  display_order: number;
  is_primary: boolean;
  caption?: string;
  created_at: string;
}

interface Part {
  id: number;
  user_id: number;
  title: string;
  part_number?: string;
  manufacturer?: string;
  category: string;
  condition: string;
  price: number;
  description: string;
  location_city: string;
  location_state: string;
  compatible_aircraft?: string;
  time_since_overhaul?: string;
  has_certification: boolean;
  has_logbook: boolean;
  shipping_available: boolean;
  return_policy?: string;
  seller_name: string;
  views: number;
  created_at: string;
}

interface InquiryRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const conditions: Record<string, string> = {
  new: 'Novo',
  overhauled: 'Revisado',
  serviceable: 'Operacional',
  'as-is': 'No Estado',
  'for-parts': 'Para Peças'
};

export default function PartDetail() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const id = params.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [inquiryForm, setInquiryForm] = useState<InquiryRequest>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    message: ''
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const handleReport = async () => {
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(`/classifieds/parts/${id}`)}`);
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
          contentType: 'classified_parts',
          contentId: Number(id),
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

  useEffect(() => {
    fetchPartDetail();
    fetchPhotos();
  }, [id]);

  const fetchPartDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/classifieds/parts/${id}`);
      const result = await response.json();

      if (response.ok) {
        setPart(result.data);
      } else {
        console.error('Erro ao carregar detalhes:', result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar peça:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/classifieds/parts/${id}/upload-photo`);
      const result = await response.json();

      if (response.ok && result.photos) {
        setPhotos(result.photos);
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.phone || !inquiryForm.message) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      setInquiryLoading(true);
      const response = await fetch(`/api/classifieds/parts/${id}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm)
      });

      if (response.ok) {
        setInquirySuccess(true);
        setInquiryForm({ name: user?.name || '', email: user?.email || '', phone: '', message: '' });
        setTimeout(() => setInquirySuccess(false), 3000);
      } else {
        alert('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar inquérito:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setInquiryLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/classifieds/checkout?type=parts&id=${id}`)}`);
      return;
    }
    router.push(`/classifieds/checkout?type=parts&id=${id}`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Carregando detalhes...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!part) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Peça não encontrada</p>
                <Link
                  href="/classifieds/parts"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Voltar
                </Link>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: part.title,
    description: part.description,
    brand: part.manufacturer || undefined,
    sku: part.part_number || String(part.id),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: part.price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Link
              href="/classifieds/parts"
              className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block"
            >
              ← Voltar
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Photos & Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Photo Gallery */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-200 h-96 flex items-center justify-center">
                    {photos.length > 0 ? (
                      <img
                        src={`/api/classifieds/parts/${id}/upload-photo?photoId=${photos[selectedPhotoIndex]?.id}`}
                        alt={part.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 0 && (
                    <div className="p-4 flex gap-2 overflow-x-auto bg-white">
                      {photos.map((photo, idx) => (
                        <button
                          key={photo.id || idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                            idx === selectedPhotoIndex
                              ? 'border-blue-600'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <img
                            src={`/api/classifieds/parts/${id}/upload-photo?photoId=${photo.id}`}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{part.description}</p>
                </div>

                {/* Specs Grid */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificações</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {part.part_number && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Número da Peça</p>
                          <p className="font-semibold text-gray-900">{part.part_number}</p>
                        </div>
                      </>
                    )}
                    {part.manufacturer && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Fabricante</p>
                          <p className="font-semibold text-gray-900">{part.manufacturer}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Condição</p>
                      <p className="font-semibold text-gray-900">{conditions[part.condition] || part.condition}</p>
                    </div>
                    {part.time_since_overhaul && (
                      <div>
                        <p className="text-sm text-gray-600">Horas desde Revisão</p>
                        <p className="font-semibold text-gray-900">{part.time_since_overhaul}</p>
                      </div>
                    )}
                    {part.compatible_aircraft && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Aeronaves Compatíveis</p>
                        <p className="font-semibold text-gray-900">{part.compatible_aircraft}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3">
                  {part.has_certification && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>✓</span> Certificada (TSO/PMA)
                    </div>
                  )}
                  {part.has_logbook && (
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>📋</span> Com Logbook
                    </div>
                  )}
                  {part.shipping_available && (
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>✓</span> Envio Disponível
                    </div>
                  )}
                </div>

                {part.return_policy && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">Política de Devolução</p>
                    <p className="text-sm text-yellow-800">{part.return_policy}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Price & Inquiry */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Preço</p>
                    <p className="text-4xl font-bold text-blue-600">{formatPrice(part.price)}</p>
                  </div>

                  {user?.id !== part.user_id && (
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      🛡️ Comprar com Escrow
                    </button>
                  )}

                  {/* Seller Info */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Informações do Anunciante</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Vendedor:</strong> {part.seller_name}</p>
                      <p><strong>Local:</strong> {part.location_city}/{part.location_state}</p>
                      <p><strong>Publicado em:</strong> {new Date(part.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs">👁️ {part.views} visualizações</p>
                    </div>
                    {user && user.id !== part.user_id && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={handleReport}
                          className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                        >
                          ⚠️ Reportar anúncio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inquiry Form */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Entre em Contato</h3>

                    {inquirySuccess && (
                      <div className="mb-4 p-3 bg-green-100 text-green-800 text-sm rounded-lg">
                        ✓ Mensagem enviada com sucesso!
                      </div>
                    )}

                    <form onSubmit={handleInquirySubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Telefone *
                        </label>
                        <input
                          type="tel"
                          value={inquiryForm.phone}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Mensagem *
                        </label>
                        <textarea
                          rows={4}
                          value={inquiryForm.message}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          placeholder="Faça sua pergunta sobre a peça..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {inquiryLoading ? 'Enviando...' : 'Enviar Mensagem'}
                      </button>
                    </form>
                  </div>

                  <button
                    onClick={() => router.push('/classifieds/parts')}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Ver Mais Peças
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
