'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface Document {
  id: number;
  user_id: number;
  owner_id: number;
  document_type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  validation_score: number;
  validation_status: string;
  validation_issues: string[];
  validation_suggestions: string[];
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_name: string;
  user_cpf: string;
  owner_company: string | null;
  owner_cnpj: string | null;
  owner_verification_status: string | null;
  reviewed_by_name: string | null;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'MASTER' && user.role !== 'ADMIN')) {
      router.push('/admin');
      return;
    }
    loadDocuments();
  }, [user, router, filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/admin/documents?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar documentos');
      }

      const data = await res.json();
      setDocuments(data.documents || []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doc: Document) => {
    setSelectedDoc(doc);
    setModalAction('approve');
    setShowModal(true);
  };

  const handleReject = async (doc: Document) => {
    setSelectedDoc(doc);
    setModalAction('reject');
    setRejectionReason('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedDoc) return;

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const endpoint = `/api/admin/documents/${selectedDoc.id}/${modalAction}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: modalAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao processar documento');
      }

      alert(modalAction === 'approve' ? '✓ Documento aprovado!' : '✓ Documento rejeitado');
      setShowModal(false);
      setSelectedDoc(null);
      setRejectionReason('');
      loadDocuments();
    } catch (error) {
      console.error('Error processing document:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Tente novamente'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_front: 'RG/CNH (Frente)',
      id_back: 'RG/CNH (Verso)',
      selfie: 'Selfie',
      business_license: 'Alvará',
      insurance: 'Seguro',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      pending_review: { color: 'bg-yellow-100 text-yellow-700', text: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-700', text: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-700', text: 'Rejeitado' },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-700', text: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
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
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar ao Painel Administrativo
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Verificação de Documentos</h1>
          <p className="text-slate-600 mt-2">
            Revise e aprove documentos de identidade enviados pelos anunciantes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('pending_review')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  filter === 'pending_review'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Pendentes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  filter === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Aprovados ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  filter === 'rejected'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                Rejeitados ({stats.rejected})
              </button>
            </nav>
          </div>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Document Image */}
                  <div className="lg:w-1/3">
                    <img
                      src={doc.file_url}
                      alt={getDocumentTypeLabel(doc.document_type)}
                      className="w-full h-64 object-contain bg-slate-100 rounded-lg cursor-pointer hover:opacity-75 transition"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    />
                    <p className="text-xs text-center text-slate-500 mt-2">Clique para ampliar</p>
                  </div>

                  {/* Document Info */}
                  <div className="lg:w-2/3">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {getDocumentTypeLabel(doc.document_type)}
                        </h3>
                        <p className="text-sm text-slate-600">{doc.user_name} ({doc.user_email})</p>
                        {doc.owner_company && (
                          <p className="text-sm text-slate-600 mt-1">
                            Empresa: {doc.owner_company}
                            {doc.owner_cnpj && ` - CNPJ: ${doc.owner_cnpj}`}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(doc.validation_status)}
                    </div>

                    {/* Validation Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">Score de Validação</span>
                        <span className={`text-sm font-semibold ${getScoreColor(doc.validation_score)}`}>
                          {doc.validation_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            doc.validation_score >= 85
                              ? 'bg-green-600'
                              : doc.validation_score >= 70
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${doc.validation_score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Issues & Suggestions */}
                    {doc.validation_issues && doc.validation_issues.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">Problemas Detectados:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {doc.validation_issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {doc.validation_suggestions && doc.validation_suggestions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">Sugestões:</p>
                        <ul className="text-sm text-slate-600 list-disc list-inside">
                          {doc.validation_suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {doc.rejection_reason && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Motivo da Rejeição:</p>
                        <p className="text-sm text-red-700">{doc.rejection_reason}</p>
                      </div>
                    )}

                    {/* Review Info */}
                    {doc.reviewed_at && (
                      <div className="mb-4 text-sm text-slate-600">
                        Revisado por {doc.reviewed_by_name} em{' '}
                        {new Date(doc.reviewed_at).toLocaleString('pt-BR')}
                      </div>
                    )}

                    {/* Actions */}
                    {filter === 'pending_review' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(doc)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(doc)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          ✗ Rejeitar
                        </button>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                      <p>Enviado em: {new Date(doc.created_at).toLocaleString('pt-BR')}</p>
                      <p>Tamanho: {(doc.file_size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {modalAction === 'approve' ? 'Aprovar Documento' : 'Rejeitar Documento'}
            </h3>

            <p className="text-slate-600 mb-4">
              {modalAction === 'approve'
                ? `Confirma a aprovação do documento ${getDocumentTypeLabel(selectedDoc.document_type)}?`
                : `Informe o motivo da rejeição do documento ${getDocumentTypeLabel(selectedDoc.document_type)}:`}
            </p>

            {modalAction === 'reject' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                className="w-full border border-slate-300 rounded-lg p-3 mb-4 min-h-[100px]"
                required
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDoc(null);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg transition font-medium disabled:opacity-50 ${
                  modalAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {processing ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
