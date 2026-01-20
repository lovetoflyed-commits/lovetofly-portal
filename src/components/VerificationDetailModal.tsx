'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface OwnerDetail {
  id: number;
  company_name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  owner_type: string;
  verification_status: string;
  is_verified: boolean;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface Document {
  id: number;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_status: string;
  uploaded_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

interface VerificationDetail {
  owner: OwnerDetail;
  documents: Document[];
  documentCount: number;
  pendingDocuments: number;
  verifiedDocuments: number;
}

interface VerificationDetailModalProps {
  ownerId: number;
  onClose: () => void;
  onApprove: (ownerId: number) => void;
  onReject: (ownerId: number) => void;
}

export default function VerificationDetailModal({
  ownerId,
  onClose,
  onApprove,
  onReject,
}: VerificationDetailModalProps) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(
          `/api/admin/hangarshare/owners/${ownerId}/details`
        );
        if (!response.ok) throw new Error('Failed to fetch owner details');
        const data = await response.json();
        setDetail(data);
      } catch (error) {
        console.error('Error fetching owner details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [ownerId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(
        `/api/admin/hangarshare/owners/${ownerId}/verify`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to approve owner');
      onApprove(ownerId);
      onClose();
    } catch (error) {
      console.error('Error approving owner:', error);
      alert('Erro ao aprovar proprietário');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, forneça um motivo para a rejeição');
      return;
    }
    setRejecting(true);
    try {
      const response = await fetch(
        `/api/admin/hangarshare/owners/${ownerId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      if (!response.ok) throw new Error('Failed to reject owner');
      onReject(ownerId);
      onClose();
    } catch (error) {
      console.error('Error rejecting owner:', error);
      alert('Erro ao rejeitar proprietário');
    } finally {
      setRejecting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      cnpj_certificate: 'Certificado CNPJ',
      registration: 'Comprovante de Registro',
      insurance: 'Apólice de Seguro',
      tax_clearance: 'Certidão Negativa',
      bank_statement: 'Extrato Bancário',
      proof_of_address: 'Comprovante de Endereço',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
          <p className="text-center text-red-600">Proprietário não encontrado</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const { owner, documents, documentCount, pendingDocuments } = detail;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 my-6 shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{owner.company_name}</h2>
            <p className="text-blue-100 mt-1">Verificação de Registro</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-blue-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Owner Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b-2 border-blue-600 pb-2">
                Informações do Proprietário
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold">
                    {owner.first_name} {owner.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold break-all">{owner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-semibold">{owner.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Proprietário</p>
                  <p className="font-semibold capitalize">
                    {owner.owner_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b-2 border-blue-600 pb-2">
                Informações da Empresa
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">CNPJ</p>
                  <p className="font-semibold">{owner.cnpj || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CPF</p>
                  <p className="font-semibold">{owner.cpf || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-semibold text-sm">{owner.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  {owner.website ? (
                    <a
                      href={owner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {owner.website}
                    </a>
                  ) : (
                    <p className="font-semibold">N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b-2 border-blue-600 pb-2">
              Documentação ({documentCount})
            </h3>

            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                Nenhum documento enviado
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {getDocumentTypeLabel(doc.document_type)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {doc.document_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(doc.upload_status)}`}
                        >
                          {doc.upload_status === 'verified'
                            ? '✓ Verificado'
                            : doc.upload_status === 'uploaded'
                              ? '⏳ Enviado'
                              : doc.upload_status === 'pending'
                                ? '○ Pendente'
                                : '✕ Rejeitado'}
                        </span>
                        <p className="text-xs text-gray-600">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>

                    {doc.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-700">
                          <strong>Motivo da rejeição:</strong>{' '}
                          {doc.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex justify-between text-xs text-gray-600">
                      <span>
                        Enviado:{' '}
                        {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                      {doc.verified_at && (
                        <span>
                          Verificado:{' '}
                          {new Date(doc.verified_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => window.open(doc.file_path)}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      📥 Baixar / Visualizar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Summary */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-8">
            <p className="text-sm text-gray-700">
              <strong>Status de Documentação:</strong>{' '}
              {documentCount === 0
                ? 'Nenhum documento enviado'
                : `${detail.verifiedDocuments} verificado(s), ${pendingDocuments} pendente(s)`}
            </p>
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo da Rejeição (obrigatório)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição para que o proprietário possa corrigir..."
                className="w-full px-3 py-2 border border-red-300 rounded text-sm focus:outline-none focus:border-red-600"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-100 p-6 flex gap-3 justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => setShowRejectForm(!showRejectForm)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            disabled={approving || rejecting}
          >
            {showRejectForm ? 'Cancelar Rejeição' : '✕ Rejeitar'}
          </button>
          {showRejectForm ? (
            <button
              onClick={handleReject}
              disabled={rejecting || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
            >
              {rejecting ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
            >
              {approving ? 'Aprovando...' : '✓ Aprovar Proprietário'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
