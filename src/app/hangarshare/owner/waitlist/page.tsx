'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Listing {
  id: string;
  hangarNumber: string;
  icao: string;
}

interface WaitlistEntry {
  id: number;
  listing_id: number;
  user_id: number;
  status: string;
  desired_start_date: string | null;
  desired_end_date: string | null;
  created_at: string;
  updated_at: string;
  hangar_number: string;
  airport_icao: string;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default function OwnerWaitlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token || !user?.id) {
        router.push('/login');
        return;
      }

      const listingsRes = await fetch(`/api/hangarshare/owner/listings?userId=${user.id}`);
      const listingsData = listingsRes.ok ? await listingsRes.json() : { listings: [] };
      const ownerListings: Listing[] = (listingsData.listings || []).map((listing: any) => ({
        id: String(listing.id),
        hangarNumber: listing.hangarNumber || listing.hangar_number || '—',
        icao: listing.icao || listing.airport_icao || listing.icao_code || '—',
      }));

      setListings(ownerListings);

      if (ownerListings.length === 0) {
        setEntries([]);
        return;
      }

      const waitlistResponses = await Promise.all(
        ownerListings.map((listing) =>
          fetch(`/api/hangarshare/waitlist?listingId=${listing.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const waitlistData = await Promise.all(
        waitlistResponses.map((res) => (res.ok ? res.json() : { waitlist: [] }))
      );

      const mergedEntries = waitlistData.flatMap((data) => data.waitlist || []);
      setEntries(mergedEntries);
    } catch (error) {
      console.error('Error loading waitlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEntryStatus = async (entryId: number, status: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/hangarshare/waitlist/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao atualizar status');
      }

      const data = await res.json();
      setEntries((prev) =>
        prev.map((entry) => (entry.id === entryId ? { ...entry, status: data.waitlist.status } : entry))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status');
    } finally {
      setActionLoading(false);
    }
  };

  const groupedByListing = useMemo(() => {
    return entries.reduce<Record<string, WaitlistEntry[]>>((acc, entry) => {
      const key = String(entry.listing_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      notified: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando lista de espera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Lista de Espera</h1>
          <p className="text-slate-600 mt-2">
            Gerencie solicitações de interessados em seus hangares.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">Nenhum hangar cadastrado para exibir lista de espera.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">Nenhuma solicitação na lista de espera.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {listings.map((listing) => {
              const listingEntries = groupedByListing[String(listing.id)] || [];
              if (listingEntries.length === 0) return null;
              return (
                <div key={listing.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">
                        Hangar {listing.hangarNumber} • {listing.icao}
                      </h2>
                      <p className="text-sm text-slate-600">Solicitações: {listingEntries.length}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Interessado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Período</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {listingEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-semibold text-slate-900">
                                {entry.first_name || ''} {entry.last_name || ''}
                              </div>
                              <div className="text-slate-600 text-xs">{entry.email || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {entry.desired_start_date ? new Date(entry.desired_start_date).toLocaleDateString('pt-BR') : '—'}
                              {' '}→{' '}
                              {entry.desired_end_date ? new Date(entry.desired_end_date).toLocaleDateString('pt-BR') : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {getStatusBadge(entry.status)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => updateEntryStatus(entry.id, 'notified')}
                                  disabled={actionLoading}
                                  className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300"
                                >
                                  Notificar
                                </button>
                                <button
                                  onClick={() => updateEntryStatus(entry.id, 'accepted')}
                                  disabled={actionLoading}
                                  className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-300"
                                >
                                  Aceitar
                                </button>
                                <button
                                  onClick={() => updateEntryStatus(entry.id, 'cancelled')}
                                  disabled={actionLoading}
                                  className="px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
