'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Listing {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: string;
  photos: string[];
  location: string;
  price: number;
  created_at: string;
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Only admin, staff, or master can access
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master' && user.email !== 'lovetofly.ed@gmail.com')) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Aprovação de Anúncios</b>
        <div className="mt-2 text-slate-700">
          Apenas administradores e equipe autorizada podem aprovar anúncios de hangares.<br />
          Solicite permissão ao responsável pelo setor ou ao administrador master.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchListings();
  }, [token]);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/admin/listings?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (listingId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason })
      });
      if (res.ok) {
        alert(`Anúncio ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`);
        setSelectedListing(null);
        fetchListings();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao processar ação');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-amber-900">Admin - Listing Approvals</h1>
          <p className="text-slate-600 mt-2">Review and approve hangar listings</p>
        </div>
        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">No pending listings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900">{listing.title}</h3>
                    <p className="text-sm text-slate-600">{listing.description}</p>
                    <p className="text-sm text-slate-600">Location: {listing.location}</p>
                    <p className="text-sm text-slate-600">Price: R${listing.price}</p>
                    <p className="text-xs text-slate-500 mt-4">Submitted: {new Date(listing.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedListing(listing)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Review Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-6">Review Listing</h2>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-2">Listing Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Title</p>
                      <p className="font-semibold">{selectedListing.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Location</p>
                      <p className="font-semibold">{selectedListing.location}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Price</p>
                      <p className="font-semibold">R${selectedListing.price}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Owner ID</p>
                      <p className="font-semibold">{selectedListing.owner_id}</p>
                    </div>
                  </div>
                </div>
                {/* Photos */}
                <div className="mb-6">
                  <h3 className="font-bold text-slate-900 mb-4">Photos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedListing.photos && selectedListing.photos.length > 0 ? (
                      selectedListing.photos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-full h-48 object-cover rounded border" />
                      ))
                    ) : (
                      <p className="text-slate-600">No photos available</p>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction(selectedListing.id, 'approve')}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:bg-slate-300"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleAction(selectedListing.id, 'reject', reason);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:bg-slate-300"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
