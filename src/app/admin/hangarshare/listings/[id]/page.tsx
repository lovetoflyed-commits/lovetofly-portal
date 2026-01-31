'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ListingDetails {
  id: number;
  owner_id: number;
  icao_code: string | null;
  aerodrome_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  hangar_number: string | null;
  hangar_location_description: string | null;
  hangar_size_sqm: number | null;
  max_wingspan_meters: number | null;
  max_length_meters: number | null;
  max_height_meters: number | null;
  accepted_aircraft_categories: string[] | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  available_from: string | null;
  available_until: string | null;
  is_available: boolean;
  operating_hours: Record<string, { open?: string; close?: string }> | null;
  services: string[] | null;
  description: string | null;
  special_notes: string | null;
  accepts_online_payment: boolean;
  accepts_payment_on_arrival: boolean;
  accepts_payment_on_departure: boolean;
  cancellation_policy: string | null;
  verification_status: string | null;
  verified_at: string | null;
  photos: string[] | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  owner_verified?: boolean | null;
  owner_verification_status?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const formatCurrency = (value?: number | null) => {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export default function HangarListingDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const listingId = useMemo(() => params?.id?.toString() ?? '', [params]);

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editListing, setEditListing] = useState<Partial<ListingDetails> | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState<string | null>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'master' && user.role !== 'admin' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
      return;
    }

    if (!listingId) {
      setLoading(false);
      return;
    }

    if (listing) {
      return;
    }

    if (hasFetchedRef.current === listingId) {
      setLoading(false);
      return;
    }

    if (inFlightRef.current === listingId) {
      return;
    }

    const fetchListing = async () => {
      try {
        inFlightRef.current = listingId;
        const res = await fetch(`/api/admin/hangarshare/listings/${listingId}`);
        if (!res.ok) {
          throw new Error('Erro ao carregar anúncio');
        }
        const data = await res.json();
        setListing(data);
        setEditListing(data);
        hasFetchedRef.current = listingId;
      } catch (error) {
        console.error('Failed to load listing details:', error);
      } finally {
        if (inFlightRef.current === listingId) {
          inFlightRef.current = null;
        }
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, user, router]);

  const handleApprove = async () => {
    if (!listingId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/listings/${listingId}/approve`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Falha ao aprovar anúncio');
      }
      setListing((prev) => (prev ? { ...prev, status: 'active', verification_status: 'approved' } : prev));
    } catch (error) {
      console.error('Approve error:', error);
      alert('Erro ao aprovar anúncio');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!listingId) return;
    const confirmReject = window.confirm('Tem certeza que deseja rejeitar este anúncio?');
    if (!confirmReject) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/listings/${listingId}/reject`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Falha ao rejeitar anúncio');
      }
      setListing((prev) => (prev ? { ...prev, status: 'rejected', verification_status: 'rejected' } : prev));
    } catch (error) {
      console.error('Reject error:', error);
      alert('Erro ao rejeitar anúncio');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!listingId || !editListing) return;
    setActionLoading(true);
    try {
      const payload = {
        ...editListing,
        photos: parseJson<string[]>(editListing.photos, []).filter(Boolean),
        services: parseJson<string[]>(editListing.services, []).filter(Boolean),
        accepted_aircraft_categories: parseJson<string[]>(editListing.accepted_aircraft_categories, []).filter(Boolean),
        operating_hours: parseJson<Record<string, { open?: string; close?: string }>>(
          editListing.operating_hours,
          {}
        )
      };

      const res = await fetch(`/api/admin/hangarshare/listings/${listingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) {
        throw new Error('Falha ao salvar alterações');
      }
      const data = await res.json();
      setListing(data.listing ?? editListing);
      setEditListing(data.listing ?? editListing);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file || !listingId) return;
    try {
      setPhotoUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`/api/admin/hangarshare/listings/${listingId}/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao fazer upload da foto');
      }

      const data = await res.json();
      setListing((prev) => (prev ? { ...prev, photos: data.photos } : prev));
      setEditListing((prev) => (prev ? { ...prev, photos: data.photos } : prev));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload da foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = async (photoUrl: string) => {
    if (!listingId) return;
    const confirmRemove = window.confirm('Remover esta foto?');
    if (!confirmRemove) return;

    try {
      setPhotoRemoving(photoUrl);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/hangarshare/listings/${listingId}/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ photoUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao remover foto');
      }

      const data = await res.json();
      setListing((prev) => (prev ? { ...prev, photos: data.photos } : prev));
      setEditListing((prev) => (prev ? { ...prev, photos: data.photos } : prev));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao remover foto');
    } finally {
      setPhotoRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando dados...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-slate-900">Anúncio não encontrado</h1>
          <button
            onClick={() => router.push('/admin/hangarshare?tab=listings')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const photos = parseJson<string[]>(listing.photos, []);
  const services = parseJson<string[]>(listing.services, []);
  const categories = parseJson<string[]>(listing.accepted_aircraft_categories, []);
  const operatingHours = parseJson<Record<string, { open?: string; close?: string }>>(
    listing.operating_hours,
    {}
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="space-y-2">
          <button
            onClick={() => router.push('/admin/hangarshare?tab=listings')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Voltar para anúncios
          </button>
          <h1 className="text-3xl font-black text-blue-900">Detalhes do Hangar</h1>
          <p className="text-slate-600">Informações completas do anúncio e do proprietário.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Resumo do Anúncio</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditListing(listing);
                }}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                {isEditing ? 'Cancelar edição' : 'Editar anúncio'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                >
                  Salvar alterações
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Hangar</p>
              {isEditing ? (
                <input
                  value={editListing?.hangar_number ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, hangar_number: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.hangar_number || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Aeródromo</p>
              {isEditing ? (
                <input
                  value={editListing?.aerodrome_name ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, aerodrome_name: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.aerodrome_name || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Localização</p>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    value={editListing?.city ?? ''}
                    onChange={(e) => setEditListing((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2"
                    placeholder="Cidade"
                  />
                  <input
                    value={editListing?.state ?? ''}
                    onChange={(e) => setEditListing((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-24 border border-slate-200 rounded px-3 py-2"
                    placeholder="UF"
                  />
                </div>
              ) : (
                <p className="font-semibold">{listing.city || '—'} {listing.state ? `- ${listing.state}` : ''}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">ICAO</p>
              {isEditing ? (
                <input
                  value={editListing?.icao_code ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, icao_code: e.target.value.toUpperCase() }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.icao_code || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              {isEditing ? (
                <select
                  value={editListing?.status ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="rejected">rejected</option>
                  <option value="inactive">inactive</option>
                </select>
              ) : (
                <p className="font-semibold">{listing.status || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Disponibilidade</p>
              {isEditing ? (
                <select
                  value={editListing?.is_available ? 'true' : 'false'}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, is_available: e.target.value === 'true' }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                >
                  <option value="true">Disponível</option>
                  <option value="false">Indisponível</option>
                </select>
              ) : (
                <p className="font-semibold">{listing.is_available ? 'Disponível' : 'Indisponível'}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Proprietário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Empresa</p>
              <p className="font-semibold">{listing.company_name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Responsável</p>
              <p className="font-semibold">{listing.first_name || ''} {listing.last_name || ''}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-semibold">{listing.email || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Telefone</p>
              <p className="font-semibold">{listing.phone || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">CNPJ</p>
              <p className="font-semibold">{listing.cnpj || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Status de verificação</p>
              <p className="font-semibold">{listing.owner_verification_status || '—'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Tarifas e Dimensões</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Diária</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.daily_rate ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, daily_rate: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{formatCurrency(listing.daily_rate)}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Mensal</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.monthly_rate ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, monthly_rate: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{formatCurrency(listing.monthly_rate)}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Tamanho (m²)</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.hangar_size_sqm ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, hangar_size_sqm: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.hangar_size_sqm ?? '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Envergadura máx.</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.max_wingspan_meters ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, max_wingspan_meters: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.max_wingspan_meters ?? '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Comprimento máx.</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.max_length_meters ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, max_length_meters: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.max_length_meters ?? '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Altura máx.</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editListing?.max_height_meters ?? ''}
                  onChange={(e) => setEditListing((prev) => ({ ...prev, max_height_meters: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{listing.max_height_meters ?? '—'}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Serviços e Categorias</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-sm">Categorias aceitas</p>
              {isEditing ? (
                <input
                  value={(parseJson<string[]>(editListing?.accepted_aircraft_categories, [])).join(', ')}
                  onChange={(e) =>
                    setEditListing((prev) => ({
                      ...prev,
                      accepted_aircraft_categories: e.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    }))
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2"
                  placeholder="Ex: executivo, helicóptero"
                />
              ) : categories.length === 0 ? (
                <p className="text-slate-600">—</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span key={category} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-500 text-sm">Serviços</p>
              {isEditing ? (
                <input
                  value={(parseJson<string[]>(editListing?.services, [])).join(', ')}
                  onChange={(e) =>
                    setEditListing((prev) => ({
                      ...prev,
                      services: e.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    }))
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2"
                  placeholder="Ex: segurança, limpeza, manutenção"
                />
              ) : services.length === 0 ? (
                <p className="text-slate-600">—</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span key={service} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Horários de Operação</h2>
          {isEditing ? (
            <textarea
              value={JSON.stringify(parseJson(editListing?.operating_hours, {}), null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || '{}');
                  setEditListing((prev) => ({ ...prev, operating_hours: parsed }));
                } catch {
                  setEditListing((prev) => ({ ...prev }));
                }
              }}
              className="w-full border border-slate-200 rounded px-3 py-2 font-mono text-sm"
              rows={6}
            />
          ) : Object.keys(operatingHours).length === 0 ? (
            <p className="text-slate-600">—</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(operatingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 capitalize">{day}</span>
                  <span className="font-semibold">
                    {hours?.open || '—'} - {hours?.close || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Descrição</h2>
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editListing?.description ?? ''}
                onChange={(e) => setEditListing((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2"
                rows={5}
                placeholder="Descrição do anúncio"
              />
              <textarea
                value={editListing?.special_notes ?? ''}
                onChange={(e) => setEditListing((prev) => ({ ...prev, special_notes: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2"
                rows={3}
                placeholder="Notas especiais"
              />
            </div>
          ) : (
            <>
              <p className="text-slate-700 whitespace-pre-line">{listing.description || '—'}</p>
              {listing.special_notes && (
                <p className="mt-3 text-slate-500">Notas: {listing.special_notes}</p>
              )}
            </>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Fotos</h2>
          {isEditing ? (
            <textarea
              value={parseJson<string[]>(editListing?.photos, []).join('\n')}
              onChange={(e) =>
                setEditListing((prev) => ({
                  ...prev,
                  photos: e.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
                }))
              }
              className="w-full border border-slate-200 rounded px-3 py-2"
              rows={5}
              placeholder="Uma URL por linha"
            />
          ) : photos.length === 0 ? (
            <p className="text-slate-600">Nenhuma foto enviada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-48 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(photo)}
                    disabled={photoRemoving === photo}
                    className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-300"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isEditing && (
            <div className="mt-4 flex items-center gap-3">
              <label className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                {photoUploading ? 'Enviando...' : 'Enviar foto'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={photoUploading}
                  onChange={(event) => handlePhotoUpload(event.target.files?.[0] || null)}
                />
              </label>
              <span className="text-xs text-slate-500">JPG, PNG ou WebP até 10MB.</span>
            </div>
          )}
        </section>

        <section className="flex flex-col md:flex-row gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-slate-300"
          >
            ✓ Aprovar anúncio
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-slate-300"
          >
            ✗ Rejeitar anúncio
          </button>
        </section>
      </div>
    </div>
  );
}