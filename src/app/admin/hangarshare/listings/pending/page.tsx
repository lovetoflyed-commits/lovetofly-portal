'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PendingListing {
  id: string;
  hangar_number: string;
  aerodrome_name: string;
  city: string;
  state: string;
  size_sqm: number;
  daily_rate: number;
  monthly_rate?: number;
  status: string;
  approval_status?: string;
  company_name: string;
  created_at: string;
}

export default function PendingListingsPage() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const fetchPendingListings = async () => {
    try {
      const response = await fetch('/api/admin/hangarshare/listings');
      const data = await response.json();
      // Filter listings that are pending
      setListings(
        data.filter(
          (l: PendingListing) =>
            l.status === 'pending' ||
            l.approval_status === 'pending' ||
            l.approval_status === 'pending_approval'
        )
      );
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    setApproving(listingId);
    try {
      const response = await fetch(`/api/admin/hangarshare/listings/${listingId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setListings(listings.filter(l => l.id !== listingId));
      }
    } catch (error) {
      console.error('Error approving listing:', error);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (listingId: string) => {
    setApproving(listingId);
    try {
      const response = await fetch(`/api/admin/hangarshare/listings/${listingId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setListings(listings.filter(l => l.id !== listingId));
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm('Aprovar todos os anúncios pendentes?')) return;
    setApprovingAll(true);
    try {
      const response = await fetch('/api/admin/hangarshare/listings/approve-all', {
        method: 'POST',
      });
      if (response.ok) {
        setListings([]);
      }
    } catch (error) {
      console.error('Error approving all listings:', error);
    } finally {
      setApprovingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <p className="text-slate-600">Carregando anúncios pendentes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Link href="/admin/hangarshare" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Anúncios Pendentes</h1>
        <p className="text-slate-600 mt-1">Aprove ou rejeite novos hangares para aluguel</p>
        {listings.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleApproveAll}
              disabled={approvingAll}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-400"
            >
              {approvingAll ? 'Aprovando tudo...' : `Aprovar todos (${listings.length})`}
            </button>
          </div>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-semibold">✓ Nenhum anúncio pendente</p>
          <p className="text-green-700 mt-1">Todos os anúncios foram aprovados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Hangar</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Aeródromo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Localização</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tamanho</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Diária</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Anunciante</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{listing.hangar_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{listing.aerodrome_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {listing.city}, {listing.state}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{listing.size_sqm} m²</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      R$ {listing.daily_rate?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{listing.company_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/admin/hangarshare/listings/${listing.id}`}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-semibold"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={approving === listing.id}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-400 font-semibold"
                        >
                          {approving === listing.id ? 'Aprovando...' : 'Aprovar'}
                        </button>
                        <button
                          onClick={() => handleReject(listing.id)}
                          disabled={approving === listing.id}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-400 font-semibold"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
