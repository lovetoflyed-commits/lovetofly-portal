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

interface Avionics {
  id: number;
  title: string;
  manufacturer?: string;
  model?: string;
  category: string;
  condition: string;
  price: number;
  description: string;
  location_city: string;
  location_state: string;
  compatible_aircraft?: string;
  software_version?: string;
  tso_certified: boolean;
  panel_mount: boolean;
  includes_installation: boolean;
  warranty_remaining?: string;
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
  excellent: 'Excelente',
  good: 'Bom',
  fair: 'Razoável',
  parts: 'Para Peças'
};

export default function AvionicsDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [avionics, setAvionics] = useState<Avionics | null>(null);
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

  useEffect(() => {
    fetchAvionicsDetail();
    fetchPhotos();
  }, [id]);

  const fetchAvionicsDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/classifieds/avionics/${id}`);
      const result = await response.json();

      if (response.ok) {
        setAvionics(result.data);
      } else {
        console.error('Erro ao carregar detalhes:', result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/classifieds/avionics/${id}/upload-photo`);
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
      const response = await fetch(`/api/classifieds/avionics/${id}/inquiry`, {
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

  if (!avionics) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Equipamento não encontrado</p>
                <Link
                  href="/classifieds/avionics"
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

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Link
              href="/classifieds/avionics"
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
                        src={`/api/classifieds/avionics/${id}/upload-photo?photoId=${photos[selectedPhotoIndex]?.id}`}
                        alt={avionics.title}
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
                          key={photo.id}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                            idx === selectedPhotoIndex
                              ? 'border-blue-600'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <img
                            src={`/api/classifieds/avionics/${id}/upload-photo?photoId=${photo.id}`}
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
                  <p className="text-gray-700 whitespace-pre-wrap">{avionics.description}</p>
                </div>

                {/* Specs Grid */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificações</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {avionics.manufacturer && (
                      <div>
                        <p className="text-sm text-gray-600">Fabricante</p>
                        <p className="font-semibold text-gray-900">{avionics.manufacturer}</p>
                      </div>
                    )}
                    {avionics.model && (
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="font-semibold text-gray-900">{avionics.model}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Categoria</p>
                      <p className="font-semibold text-gray-900">{avionics.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Condição</p>
                      <p className="font-semibold text-gray-900">{conditions[avionics.condition] || avionics.condition}</p>
                    </div>
                    {avionics.software_version && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Versão de Software</p>
                        <p className="font-semibold text-gray-900">{avionics.software_version}</p>
                      </div>
                    )}
                    {avionics.compatible_aircraft && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Aeronaves Compatíveis</p>
                        <p className="font-semibold text-gray-900">{avionics.compatible_aircraft}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3">
                  {avionics.tso_certified && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>✓</span> TSO Certificada
                    </div>
                  )}
                  {avionics.includes_installation && (
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <span>🔧</span> Instalação Incluída
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${avionics.panel_mount ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    <span>{avionics.panel_mount ? '📊' : '📱'}</span> {avionics.panel_mount ? 'Painel' : 'Portátil'}
                  </div>
                </div>

                {avionics.warranty_remaining && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Garantia Remanescente</p>
                    <p className="text-sm text-blue-800">{avionics.warranty_remaining}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Price & Inquiry */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Preço</p>
                    <p className="text-4xl font-bold text-blue-600">{formatPrice(avionics.price)}</p>
                  </div>

                  {/* Seller Info */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Informações do Anunciante</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Vendedor:</strong> {avionics.seller_name}</p>
                      <p><strong>Local:</strong> {avionics.location_city}/{avionics.location_state}</p>
                      <p><strong>Publicado em:</strong> {new Date(avionics.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs">👁️ {avionics.views} visualizações</p>
                    </div>
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
                          placeholder="Faça sua pergunta sobre o equipamento..."
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
                    onClick={() => router.push('/classifieds/avionics')}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Ver Mais Equipamentos
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
