'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../../../accessControl';

interface OwnerDetails {
  id: number;
  user_id: number;
  company_name: string | null;
  cnpj: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  owner_type: string | null;
  cpf: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  is_verified: boolean;
  verification_status: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface OwnerVerification {
  id: number;
  id_document_type: string | null;
  id_document_number: string | null;
  id_document_front_url: string | null;
  id_document_back_url: string | null;
  selfie_url: string | null;
  ownership_proof_type: string | null;
  ownership_document_url: string | null;
  company_registration_url: string | null;
  tax_document_url: string | null;
  verification_status: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OwnerDocument {
  id: string;
  label: string;
  url: string;
  status?: string;
  type?: string;
}

export default function OwnerVerificationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const ownerId = useMemo(() => params?.id?.toString() ?? '', [params]);

  const [owner, setOwner] = useState<OwnerDetails | null>(null);
  const [verification, setVerification] = useState<OwnerVerification | null>(null);
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editOwner, setEditOwner] = useState<OwnerDetails | null>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const canAccess = role && (role === Role.MASTER || hasPermission(role, 'manage_compliance'));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  useEffect(() => {
    if (!ownerId || !canAccess) {
      setLoading(false);
      return;
    }

    if (owner) {
      return;
    }

    if (hasFetchedRef.current === ownerId) {
      setLoading(false);
      return;
    }

    if (inFlightRef.current === ownerId) {
      return;
    }

    const fetchOwner = async () => {
      try {
        inFlightRef.current = ownerId;
        const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}/details`);
        if (!res.ok) {
          throw new Error('Erro ao carregar dados do proprietário');
        }
        const data = await res.json();
        setOwner(data.owner || null);
        setEditOwner(data.owner || null);
        setVerification(data.verification || null);
        setDocuments(data.documents || []);
        hasFetchedRef.current = ownerId;
      } catch (error) {
        console.error('Failed to load owner details:', error);
      } finally {
        if (inFlightRef.current === ownerId) {
          inFlightRef.current = null;
        }
        setLoading(false);
      }
    };

    fetchOwner();
  }, [ownerId, canAccess]);

  const handleVerify = async () => {
    if (!ownerId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}/verify`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Falha ao aprovar proprietário');
      }
      const data = await res.json();
      alert(`Proprietário aprovado: ${data.company_name || 'Sem nome'}`);
      router.push('/admin/hangarshare?tab=users');
    } catch (error) {
      console.error('Verify error:', error);
      alert('Erro ao aprovar proprietário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!ownerId) return;
    const confirmReject = window.confirm('Tem certeza que deseja rejeitar este proprietário?');
    if (!confirmReject) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}/reject`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Falha ao rejeitar proprietário');
      }
      alert('Proprietário rejeitado e removido');
      router.push('/admin/hangarshare?tab=users');
    } catch (error) {
      console.error('Reject error:', error);
      alert('Erro ao rejeitar proprietário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!ownerId || !editOwner) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: editOwner.company_name,
          cnpj: editOwner.cnpj,
          phone: editOwner.phone,
          address: editOwner.address,
          website: editOwner.website,
          description: editOwner.description,
          owner_type: editOwner.owner_type,
          cpf: editOwner.cpf,
          pix_key: editOwner.pix_key,
          pix_key_type: editOwner.pix_key_type,
          is_verified: editOwner.is_verified,
          verification_status: editOwner.verification_status
        })
      });
      if (!res.ok) {
        throw new Error('Falha ao salvar alterações');
      }
      const data = await res.json();
      setOwner(data.owner || editOwner);
      setEditOwner(data.owner || editOwner);
      setIsEditing(false);
    } catch (error) {
      console.error('Save owner error:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setActionLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Verificação de Proprietários</b>
        <div className="mt-2 text-slate-700">
          Apenas gestores de compliance e administradores master podem revisar documentos de proprietários.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando dados...</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-slate-900">Proprietário não encontrado</h1>
          <button
            onClick={() => router.push('/admin/hangarshare?tab=users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="space-y-2">
          <button
            onClick={() => router.push('/admin/hangarshare?tab=users')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Voltar às Verificações Pendentes
          </button>
          <h1 className="text-3xl font-black text-blue-900">Verificação de Proprietário</h1>
          <p className="text-slate-600">Revisão detalhada dos documentos enviados.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Informações do Proprietário</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditOwner(owner);
                }}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                {isEditing ? 'Cancelar edição' : 'Editar dados'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSaveOwner}
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
              <p className="text-slate-500">Responsável</p>
              <p className="font-semibold">{owner.first_name} {owner.last_name}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-semibold">{owner.email || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Empresa</p>
              {isEditing ? (
                <input
                  value={editOwner?.company_name ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, company_name: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.company_name || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">CNPJ</p>
              {isEditing ? (
                <input
                  value={editOwner?.cnpj ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, cnpj: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.cnpj || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">CPF</p>
              {isEditing ? (
                <input
                  value={editOwner?.cpf ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, cpf: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.cpf || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              {isEditing ? (
                <div className="flex gap-2">
                  <select
                    value={editOwner?.verification_status ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, verification_status: e.target.value } : prev))}
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  >
                    <option value="">—</option>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <select
                    value={editOwner?.is_verified ? 'true' : 'false'}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, is_verified: e.target.value === 'true' } : prev))}
                    className="w-32 border border-slate-200 rounded px-3 py-2"
                  >
                    <option value="true">Verificado</option>
                    <option value="false">Não verificado</option>
                  </select>
                </div>
              ) : (
                <p className="font-semibold">{owner.is_verified ? 'Verificado' : (owner.verification_status || 'pendente')}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Telefone</p>
              {isEditing ? (
                <input
                  value={editOwner?.phone ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.phone || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Website</p>
              {isEditing ? (
                <input
                  value={editOwner?.website ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, website: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.website || '—'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500">Endereço</p>
              {isEditing ? (
                <input
                  value={editOwner?.address ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.address || '—'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500">Descrição</p>
              {isEditing ? (
                <textarea
                  value={editOwner?.description ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                  rows={3}
                />
              ) : (
                <p className="font-semibold">{owner.description || '—'}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Documentos enviados</h2>
          {!verification && documents.length === 0 ? (
            <p className="text-slate-600">Nenhum documento enviado.</p>
          ) : (
            <div className="space-y-4">
              {verification && (
                <div className="space-y-2 text-sm text-slate-600">
                  <div>
                    Status: <span className="font-semibold">{verification.verification_status || 'pendente'}</span>
                  </div>
                  {verification.rejection_reason && (
                    <p className="text-sm text-red-600">Motivo da rejeição: {verification.rejection_reason}</p>
                  )}
                </div>
              )}

              {documents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => {
                    const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.url);
                    return (
                      <div key={doc.id} className="border border-slate-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">{doc.label}</p>
                        {isImage ? (
                          <img
                            src={doc.url}
                            alt={doc.label}
                            className="w-full h-48 object-cover rounded border"
                          />
                        ) : (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                          >
                            Ver documento
                          </a>
                        )}
                        {doc.status && (
                          <p className="text-xs text-slate-500 mt-2">Status: {doc.status}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-col md:flex-row gap-3">
          <button
            onClick={handleVerify}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-slate-300"
          >
            ✓ Aprovar proprietário
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-slate-300"
          >
            ✗ Rejeitar proprietário
          </button>
        </section>
      </div>
    </div>
  );
}
