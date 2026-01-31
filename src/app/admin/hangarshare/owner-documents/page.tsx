'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface OwnerDocument {
  id: number;
  owner_id: number;
  listing_id: number | null;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  upload_status: string;
  uploaded_at: string;
  verified_by: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  notes: string | null;
  company_name: string | null;
  user_id: number | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

type StatusFilter = 'uploaded' | 'verified' | 'rejected' | 'pending' | 'all';

const STATUS_LABELS: Record<string, string> = {
  uploaded: 'Enviado',
  pending: 'Pendente',
  verified: 'Verificado',
  rejected: 'Rejeitado',
};

export default function AdminOwnerDocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('uploaded');
  const [processing, setProcessing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OwnerDocument | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  const canAccess = useMemo(() => {
    if (!user?.role) return false;
    return user.role === 'master' || user.role === 'admin' || user.role === 'staff';
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!canAccess) {
      router.push('/admin');
      return;
    }
    loadDocuments();
  }, [canAccess, filter, isMounted, router]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const statusParam = filter === 'all' ? '' : `status=${filter}`;
      const url = `/api/admin/hangarshare/owner-documents${statusParam ? `?${statusParam}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar documentos');
      }

      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading owner documents:', error);
      alert('Erro ao carregar documentos de proprietários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (doc: OwnerDocument) => {
    setSelectedDoc(doc);
    setModalAction('approve');
    setRejectionReason('');
  };

  const handleReject = (doc: OwnerDocument) => {
    setSelectedDoc(doc);
    setModalAction('reject');
    setRejectionReason('');
  };

  const closeModal = () => {
    setSelectedDoc(null);
    setRejectionReason('');
  };

  const confirmAction = async () => {
    if (!selectedDoc) return;

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      alert('Informe o motivo da rejeição');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const endpoint = `/api/admin/hangarshare/owner-documents/${selectedDoc.id}/${modalAction}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: modalAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Erro ao processar documento');
      }

      alert(modalAction === 'approve' ? '✓ Documento aprovado!' : '✓ Documento rejeitado');
      closeModal();
      loadDocuments();
    } catch (error) {
      console.error('Error processing document:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Tente novamente'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      uploaded: { color: 'bg-blue-100 text-blue-700', text: STATUS_LABELS[status] || status },
      pending: { color: 'bg-yellow-100 text-yellow-700', text: STATUS_LABELS[status] || status },
      verified: { color: 'bg-green-100 text-green-700', text: STATUS_LABELS[status] || status },
      rejected: { color: 'bg-red-100 text-red-700', text: STATUS_LABELS[status] || status },
    };
    const badge = map[status] || { color: 'bg-gray-100 text-gray-700', text: status };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/hangarshare')}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar ao HangarShare
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Documentos de Proprietários</h1>
          <p className="text-slate-600 mt-2">Revisão centralizada dos documentos enviados pelos proprietários.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {(['uploaded', 'verified', 'rejected', 'pending', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  filter === status
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'Todos' : STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">Nenhum documento encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-blue-900">{doc.document_type}</h3>
                      {getStatusBadge(doc.upload_status)}
                    </div>
                    <p className="text-sm text-slate-600">Arquivo: {doc.document_name}</p>
                    <p className="text-sm text-slate-600">Empresa: {doc.company_name || '—'}</p>
                    <p className="text-sm text-slate-600">
                      Proprietário: {doc.first_name || ''} {doc.last_name || ''} ({doc.email || '—'})
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">Motivo da rejeição: {doc.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Visualizar
                    </a>
                    {(doc.upload_status === 'uploaded' || doc.upload_status === 'pending') && (
                      <>
                        <button
                          onClick={() => handleApprove(doc)}
                          className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(doc)}
                          className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {modalAction === 'approve' ? 'Aprovar Documento' : 'Rejeitar Documento'}
            </h2>
            <p className="text-slate-600 mb-4">
              {modalAction === 'approve'
                ? `Confirma aprovação do documento ${selectedDoc.document_type}?`
                : `Informe o motivo da rejeição do documento ${selectedDoc.document_type}:`}
            </p>

            {modalAction === 'reject' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Motivo da rejeição"
              />
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg ${
                  modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={processing}
              >
                {processing ? 'Processando...' : modalAction === 'approve' ? 'Aprovar' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
