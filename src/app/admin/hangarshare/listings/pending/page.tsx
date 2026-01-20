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
  company_name: string;
  created_at: string;
}

export default function PendingListingsPage() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const fetchPendingListings = async () => {
    try {
      const response = await fetch('/api/admin/hangarshare/listings');
      const data = await response.json();
      // Filter listings that are pending
      setListings(data.filter((l: PendingListing) => l.status === 'pending'));
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
                      <div className="flex gap-2">
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
