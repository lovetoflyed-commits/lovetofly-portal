'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface Aircraft {
  id: number;
  title: string;
  manufacturer: string;
  model: string;
  year: number;
  registration?: string;
  serial_number?: string;
  category: string;
  total_time?: number;
  engine_time?: number;
  price: number;
  location_city: string;
  location_state: string;
  description?: string;
  avionics?: string;
  interior_condition?: string;
  exterior_condition?: string;
  logs_status?: string;
  damage_history: boolean;
  financing_available: boolean;
  partnership_available: boolean;
  seller_name: string;
  seller_email: string;
  seller_phone?: string;
  views: number;
  inquiries_count: number;
  created_at: string;
}

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

export default function AircraftDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiry, setInquiry] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAircraft();
    fetchPhotos();
  }, [params.id]);

  const fetchAircraft = async () => {
    try {
      const response = await fetch(`/api/classifieds/aircraft/${params.id}`);
      const result = await response.json();

      if (response.ok) {
        setAircraft(result.data);
      } else {
        alert('Anúncio não encontrado');
        router.push('/classifieds/aircraft');
      }
    } catch (error) {
      console.error('Erro ao carregar anúncio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/classifieds/aircraft/${params.id}/upload-photo`);
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
    if (!user) {
      alert('Faça login para enviar uma mensagem');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/classifieds/aircraft/${params.id}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          ...inquiry
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setShowInquiryForm(false);
        setInquiry({ ...inquiry, message: '' });
        fetchAircraft(); // Refresh to update inquiries count
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
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
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!aircraft) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
            {/* Back button */}
            <div className="bg-white border-b px-6 py-4">
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
              >
                ← Voltar para listagem
              </button>
            </div>

            <div className="max-w-7xl mx-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Photos & Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Photo Gallery */}
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="relative h-96 bg-gray-200">
                      {photos.length > 0 ? (
                        <img
                          src={`/api/classifieds/aircraft/${params.id}/upload-photo?photoId=${photos[selectedPhotoIndex]?.id}`}
                          alt={aircraft.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {photos.length > 1 && (
                      <div className="p-4 flex gap-2 overflow-x-auto">
                        {photos.map((photo, index) => (
                          <button
                            key={photo.id}
                            onClick={() => setSelectedPhotoIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                              index === selectedPhotoIndex ? 'border-blue-600' : 'border-gray-200'
                            }`}
                          >
                            <img 
                              src={`/api/classifieds/aircraft/${params.id}/upload-photo?photoId=${photo.id}`} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Descrição</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {aircraft.description || 'Sem descrição detalhada.'}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Especificações</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Fabricante</p>
                        <p className="font-semibold">{aircraft.manufacturer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="font-semibold">{aircraft.model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ano</p>
                        <p className="font-semibold">{aircraft.year}</p>
                      </div>
                      {aircraft.registration && (
                        <div>
                          <p className="text-sm text-gray-600">Matrícula</p>
                          <p className="font-semibold">{aircraft.registration}</p>
                        </div>
                      )}
                      {aircraft.serial_number && (
                        <div>
                          <p className="text-sm text-gray-600">Número de Série</p>
                          <p className="font-semibold">{aircraft.serial_number}</p>
                        </div>
                      )}
                      {aircraft.total_time && (
                        <div>
                          <p className="text-sm text-gray-600">Total de Horas (TT)</p>
                          <p className="font-semibold">{aircraft.total_time}h</p>
                        </div>
                      )}
                      {aircraft.engine_time && (
                        <div>
                          <p className="text-sm text-gray-600">Horas do Motor</p>
                          <p className="font-semibold">{aircraft.engine_time}h</p>
                        </div>
                      )}
                      {aircraft.interior_condition && (
                        <div>
                          <p className="text-sm text-gray-600">Condição Interna</p>
                          <p className="font-semibold">{aircraft.interior_condition}</p>
                        </div>
                      )}
                      {aircraft.exterior_condition && (
                        <div>
                          <p className="text-sm text-gray-600">Condição Externa</p>
                          <p className="font-semibold">{aircraft.exterior_condition}</p>
                        </div>
                      )}
                    </div>

                    {aircraft.avionics && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Aviônicos</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{aircraft.avionics}</p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {aircraft.financing_available && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          ✓ Aceita Financiamento
                        </span>
                      )}
                      {aircraft.partnership_available && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          ✓ Aceita Parceria
                        </span>
                      )}
                      {aircraft.damage_history && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          ⚠️ Histórico de Danos
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column - Price & Contact */}
                <div className="space-y-6">
                  {/* Price Card */}
                  <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">{aircraft.title}</h1>
                    <p className="text-3xl font-bold text-blue-600 mb-4">
                      {formatPrice(aircraft.price)}
                    </p>
                    <p className="text-gray-600 mb-4">
                      📍 {aircraft.location_city}/{aircraft.location_state}
                    </p>

                    <button
                      onClick={() => setShowInquiryForm(!showInquiryForm)}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3"
                    >
                      💬 Tenho Interesse
                    </button>

                    {showInquiryForm && (
                      <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Seu nome"
                          value={inquiry.name}
                          onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="email"
                          placeholder="Seu e-mail"
                          value={inquiry.email}
                          onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="tel"
                          placeholder="Seu telefone (opcional)"
                          value={inquiry.phone}
                          onChange={(e) => setInquiry({ ...inquiry, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <textarea
                          placeholder="Digite sua mensagem..."
                          value={inquiry.message}
                          onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                        >
                          {submitting ? 'Enviando...' : 'Enviar Mensagem'}
                        </button>
                      </form>
                    )}

                    <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                      <p>👁️ {aircraft.views} visualizações</p>
                      <p className="mt-1">💬 {aircraft.inquiries_count} interessados</p>
                      <p className="mt-1">📅 Anunciado em {new Date(aircraft.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Anunciante</p>
                      <p className="text-gray-900">{aircraft.seller_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}
