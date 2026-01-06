'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Verification {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  cpf: string;
  company_name: string;
  cnpj: string;
  id_document_type: string;
  id_document_number: string;
  id_document_front_url: string;
  id_document_back_url: string;
  selfie_url: string;
  ownership_proof_type: string;
  ownership_document_url: string;
  company_registration_url: string;
  tax_document_url: string;
  verification_status: string;
  created_at: string;
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.push('/');
      return;
    }
    fetchVerifications();
  }, [statusFilter, user, token, router]);

  const fetchVerifications = async () => {
    try {
      const res = await fetch(`/api/admin/verifications?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (verificationId: string, action: 'approve' | 'reject', reason?: string, notes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications/${verificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason, notes })
      });

      if (res.ok) {
        alert(`Verification ${action}d successfully`);
        setSelectedVerification(null);
        fetchVerifications();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-blue-900">Admin - Verification Center</h1>
          <p className="text-slate-600 mt-2">Review and approve hangar owner documents</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-bold ${
                statusFilter === 'pending'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-bold ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-bold ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Verifications List */}
        {verifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">No {statusFilter} verifications found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {verifications.map((verification) => (
              <div key={verification.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-900">
                      {verification.first_name} {verification.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">{verification.email}</p>
                    <p className="text-sm text-slate-600">CPF: {verification.cpf}</p>
                    
                    {verification.company_name && (
                      <div className="mt-3">
                        <p className="font-semibold text-slate-900">{verification.company_name}</p>
                        <p className="text-sm text-slate-600">CNPJ: {verification.cnpj}</p>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-slate-700">ID Document</p>
                        <p className="text-slate-600">{verification.id_document_type}: {verification.id_document_number}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Ownership Proof</p>
                        <p className="text-slate-600">{verification.ownership_proof_type}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4">
                      Submitted: {new Date(verification.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedVerification(verification)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
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
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Review Verification</h2>

                {/* Owner Info */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-2">Owner Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-semibold">{selectedVerification.first_name} {selectedVerification.last_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-semibold">{selectedVerification.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">CPF</p>
                      <p className="font-semibold">{selectedVerification.cpf}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Company</p>
                      <p className="font-semibold">{selectedVerification.company_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <h3 className="font-bold text-slate-900 mb-4">Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedVerification.id_document_front_url && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">ID Front</p>
                        <img 
                          src={selectedVerification.id_document_front_url} 
                          alt="ID Front" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedVerification.id_document_back_url && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">ID Back</p>
                        <img 
                          src={selectedVerification.id_document_back_url} 
                          alt="ID Back" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedVerification.selfie_url && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Selfie</p>
                        <img 
                          src={selectedVerification.selfie_url} 
                          alt="Selfie" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedVerification.ownership_document_url && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Ownership Proof</p>
                        <img 
                          src={selectedVerification.ownership_document_url} 
                          alt="Ownership" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const notes = prompt('Add notes (optional):');
                      handleAction(selectedVerification.id, 'approve', undefined, notes || undefined);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:bg-slate-300"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) {
                        const notes = prompt('Add notes (optional):');
                        handleAction(selectedVerification.id, 'reject', reason, notes || undefined);
                      }
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:bg-slate-300"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
