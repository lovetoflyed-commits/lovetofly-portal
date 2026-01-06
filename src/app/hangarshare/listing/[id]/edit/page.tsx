'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Hangar {
  id: number;
  hangarNumber: string;
  icaoCode: string;
  aerodromeName: string;
  city: string;
  state: string;
  hangarSizeSqm: number;
  maxWingspanMeters: number | null;
  maxLengthMeters: number | null;
  maxHeightMeters: number | null;
  hourlyRate: number | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  monthlyRate: number | null;
  availableFrom: string;
  availableUntil: string | null;
  acceptsOnlinePayment: boolean;
  acceptsPaymentOnArrival: boolean;
  acceptsPaymentOnDeparture: boolean;
  cancellationPolicy: string;
  hangarLocationDescription: string;
  description: string;
  specialNotes: string;
  isAvailable: boolean;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  photos: Array<{
    id: number;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

export default function EditHangarListingPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [hangar, setHangar] = useState<Hangar | null>(null);
  
  const [formData, setFormData] = useState({
    hangarNumber: '',
    hangarSizeSqm: '',
    maxWingspanMeters: '',
    maxLengthMeters: '',
    maxHeightMeters: '',
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    availableFrom: '',
    availableUntil: '',
    acceptsOnlinePayment: true,
    acceptsPaymentOnArrival: true,
    acceptsPaymentOnDeparture: false,
    cancellationPolicy: 'flexible',
    hangarLocationDescription: '',
    description: '',
    specialNotes: '',
    isAvailable: true,
  });

  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);

  // Fetch listing on mount
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/hangarshare/listing/${listingId}`);
        if (!res.ok) throw new Error('Hangar não encontrado');
        
        const data = await res.json();
        const listing = data.hangar as Hangar;
        setHangar(listing);

        // Pre-fill form
        setFormData({
          hangarNumber: listing.hangarNumber || '',
          hangarSizeSqm: listing.hangarSizeSqm?.toString() || '',
          maxWingspanMeters: listing.maxWingspanMeters?.toString() || '',
          maxLengthMeters: listing.maxLengthMeters?.toString() || '',
          maxHeightMeters: listing.maxHeightMeters?.toString() || '',
          hourlyRate: listing.hourlyRate?.toString() || '',
          dailyRate: listing.dailyRate?.toString() || '',
          weeklyRate: listing.weeklyRate?.toString() || '',
          monthlyRate: listing.monthlyRate?.toString() || '',
          availableFrom: listing.availableFrom || '',
          availableUntil: listing.availableUntil || '',
          acceptsOnlinePayment: listing.acceptsOnlinePayment ?? true,
          acceptsPaymentOnArrival: listing.acceptsPaymentOnArrival ?? true,
          acceptsPaymentOnDeparture: listing.acceptsPaymentOnDeparture ?? false,
          cancellationPolicy: listing.cancellationPolicy || 'flexible',
          hangarLocationDescription: listing.hangarLocationDescription || '',
          description: listing.description || '',
          specialNotes: listing.specialNotes || '',
          isAvailable: listing.isAvailable ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar hangar');
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      router.push('/login');
      return;
    }

    fetchListing();
  }, [listingId, user, router]);

  const handleNewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewPhotos(files);
    setNewPhotoPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleDeletePhoto = (photoId: number) => {
    setPhotosToDelete([...photosToDelete, photoId]);
  };

  const handleSave = async () => {
    if (!hangar) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Update listing
      const updateRes = await fetch(`/api/hangarshare/listing/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          hangarNumber: formData.hangarNumber,
          hangarSizeSqm: parseFloat(formData.hangarSizeSqm),
          maxWingspanMeters: formData.maxWingspanMeters ? parseFloat(formData.maxWingspanMeters) : null,
          maxLengthMeters: formData.maxLengthMeters ? parseFloat(formData.maxLengthMeters) : null,
          maxHeightMeters: formData.maxHeightMeters ? parseFloat(formData.maxHeightMeters) : null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : null,
          weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : null,
          monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : null,
          availableFrom: formData.availableFrom,
          availableUntil: formData.availableUntil || null,
          acceptsOnlinePayment: formData.acceptsOnlinePayment,
          acceptsPaymentOnArrival: formData.acceptsPaymentOnArrival,
          acceptsPaymentOnDeparture: formData.acceptsPaymentOnDeparture,
          cancellationPolicy: formData.cancellationPolicy,
          hangarLocationDescription: formData.hangarLocationDescription,
          description: formData.description,
          specialNotes: formData.specialNotes,
          isAvailable: formData.isAvailable,
        }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.message || 'Erro ao atualizar hangar');
      }

      // Delete photos if needed
      for (const photoId of photosToDelete) {
        await fetch(`/api/hangarshare/listing/${listingId}/photos/${photoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(err => console.error('Erro ao deletar foto:', err));
      }

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const formDataPhotos = new FormData();
        newPhotos.forEach((file, idx) => {
          formDataPhotos.append('photos', file);
          if (idx === 0) formDataPhotos.append('isPrimary', 'true');
        });

        await fetch(`/api/hangarshare/listing/${listingId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataPhotos,
        }).catch(err => console.error('Erro ao enviar fotos:', err));
      }

      alert('✓ Hangar atualizado com sucesso!');
      router.push('/hangarshare/owner/dashboard');
    } catch (err) {
      alert(`Erro ao atualizar: ${err instanceof Error ? err.message : 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/hangarshare/listing/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erro ao deletar hangar');

      alert('✓ Hangar removido com sucesso!');
      router.push('/hangarshare/owner/dashboard');
    } catch (err) {
      alert(`Erro ao remover: ${err instanceof Error ? err.message : 'Tente novamente'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Login necessário</h2>
          <p className="text-slate-600 mb-6">Você precisa estar logado para editar um hangar.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-slate-700 font-semibold">Carregando hangar...</p>
        </div>
      </div>
    );
  }

  if (error || !hangar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-slate-600 mb-6">{error || 'Hangar não encontrado'}</p>
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-black text-blue-900">Editar Hangar</h1>
          <p className="text-slate-600 mt-2">
            Atualize as informações do seu hangar
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-6 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
          Status: {hangar.approvalStatus === 'approved' ? '✓ Aprovado' : hangar.approvalStatus === 'pending_approval' ? '⏳ Aguardando Aprovação' : '✗ Rejeitado'}
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {/* Location Info - Read Only */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Localização (Não Editável)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">Aeródromo</p>
                <p className="text-slate-900 font-mono text-lg">{hangar.icaoCode}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Nome</p>
                <p className="text-slate-900">{hangar.aerodromeName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Localização</p>
                <p className="text-slate-900">{hangar.city}, {hangar.state}</p>
              </div>
            </div>
          </div>

          {/* Characteristics */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Características</h2>
            <div className="space-y-6">
              {/* Current Photos */}
              {hangar.photos && hangar.photos.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Fotos Atuais
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {hangar.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.url}
                          alt="Foto hangar"
                          className="w-32 h-32 object-cover rounded border-2 border-slate-300"
                        />
                        {photo.isPrimary && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                        {!photosToDelete.includes(photo.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                          >
                            ✕
                          </button>
                        )}
                        {photosToDelete.includes(photo.id) && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-50 rounded flex items-center justify-center">
                            <span className="text-white font-bold">Será deletada</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Adicionar Novas Fotos
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewPhotoChange}
                  className="mb-2"
                />
                {newPhotoPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {newPhotoPreviews.map((src, idx) => (
                      <img key={idx} src={src} alt={`Nova foto ${idx+1}`} className="w-24 h-24 object-cover rounded border" />
                    ))}
                  </div>
                )}
              </div>

              {/* Hangar Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Número do Hangar
                  </label>
                  <input
                    type="text"
                    value={formData.hangarNumber}
                    onChange={(e) => setFormData({ ...formData, hangarNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tamanho (m²) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hangarSizeSqm}
                    onChange={(e) => setFormData({ ...formData, hangarSizeSqm: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Localização dentro do Aeródromo
                </label>
                <textarea
                  value={formData.hangarLocationDescription}
                  onChange={(e) => setFormData({ ...formData, hangarLocationDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Dimensions */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 mb-3">Dimensões Máximas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Envergadura (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxWingspanMeters}
                      onChange={(e) => setFormData({ ...formData, maxWingspanMeters: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Comprimento (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxLengthMeters}
                      onChange={(e) => setFormData({ ...formData, maxLengthMeters: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Altura (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.maxHeightMeters}
                      onChange={(e) => setFormData({ ...formData, maxHeightMeters: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Availability */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Preços e Disponibilidade</h2>
            <div className="space-y-6">
              {/* Prices */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 mb-4">Tabela de Preços</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">R$ por Hora</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">R$ por Dia</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">R$ por Semana</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weeklyRate}
                      onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">R$ por Mês</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthlyRate}
                      onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-4">Disponibilidade</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Disponível desde</label>
                    <input
                      type="date"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Disponível até</label>
                    <input
                      type="date"
                      value={formData.availableUntil}
                      onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 mb-3">Formas de Pagamento</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptsOnlinePayment}
                      onChange={(e) => setFormData({ ...formData, acceptsOnlinePayment: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Pagamento online (cartão/Pix)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptsPaymentOnArrival}
                      onChange={(e) => setFormData({ ...formData, acceptsPaymentOnArrival: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Pagamento na chegada</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.acceptsPaymentOnDeparture}
                      onChange={(e) => setFormData({ ...formData, acceptsPaymentOnDeparture: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">Pagamento na saída</span>
                  </label>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700 font-semibold">Hangar disponível para reservas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Informações Adicionais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Descreva as características e vantagens do hangar..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Notas Especiais
                </label>
                <textarea
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Informações adicionais, restrições, ou termos especiais..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Política de Cancelamento
                </label>
                <select
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="flexible">Flexível - Cancelamento gratuito até 24h antes</option>
                  <option value="moderate">Moderada - Cancelamento gratuito até 7 dias antes</option>
                  <option value="strict">Rigorosa - Cancelamento gratuito até 30 dias antes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {deleting ? 'Removendo...' : '🗑️ Deletar Hangar'}
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/hangarshare/owner/dashboard')}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : '✓ Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
