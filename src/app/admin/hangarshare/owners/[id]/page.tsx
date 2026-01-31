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
  address_country: string | null;
  address_zip: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  phone_country_code: string | null;
  phone_mobile: string | null;
  phone_landline: string | null;
  website: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
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
  name?: string;
  aiStatus?: string | null;
  aiNotes?: string | null;
  reuploadDeadline?: string | null;
  reuploadReason?: string | null;
}

const COUNTRY_OPTIONS = [
  { code: 'BR', label: 'Brasil', dial: '+55' },
  { code: 'PT', label: 'Portugal', dial: '+351' },
  { code: 'US', label: 'Estados Unidos', dial: '+1' },
];

const cleanNumber = (value: string) => value.replace(/\D/g, '');

const maskCPF = (value: string) => {
  const digits = cleanNumber(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskCNPJ = (value: string) => {
  const digits = cleanNumber(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const maskCEP = (value: string) => {
  const digits = cleanNumber(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
};

const maskPhoneBR = (value: string) => {
  const digits = cleanNumber(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3').replace(/-$/, '');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1)$2-$3').replace(/-$/, '');
};

const validateCPF = (value: string) => {
  const cpf = cleanNumber(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== parseInt(cpf.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === parseInt(cpf.charAt(10), 10);
};

const validateCNPJ = (value: string) => {
  const cnpj = cleanNumber(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calcCheck = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const first = calcCheck(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calcCheck(cnpj.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${first}${second}`);
};

const buildAddressString = (owner: OwnerDetails) => {
  const parts = [
    owner.address_street && owner.address_number
      ? `${owner.address_street}, ${owner.address_number}`
      : owner.address_street || null,
    owner.address_complement || null,
    owner.address_neighborhood || null,
    owner.address_city && owner.address_state
      ? `${owner.address_city} - ${owner.address_state}`
      : owner.address_city || owner.address_state || null,
    owner.address_zip || null,
    owner.address_country || null,
  ].filter(Boolean) as string[];

  return parts.length > 0 ? parts.join(' • ') : owner.address || '';
};

const resolveDocUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('public/')) {
    return `/${url.replace(/^public\//, '')}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  if (url.startsWith('uploads/')) {
    return `/${url}`;
  }
  return `/${url}`;
};

const formatDocStatus = (status?: string | null, isMissing?: boolean) => {
  if (isMissing) return 'Não Enviado';
  switch (status) {
    case 'verified':
      return 'Verificado';
    case 'rejected':
      return 'Rejeitado';
    case 'uploaded':
    case 'pending':
    case 'reupload_requested':
    default:
      return 'Pendente';
  }
};

const getFileExtension = (value?: string | null) => {
  if (!value) return '';
  const clean = value.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

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
  const [isClient, setIsClient] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<OwnerDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [reuploadDoc, setReuploadDoc] = useState<OwnerDocument | null>(null);
  const [reuploadReason, setReuploadReason] = useState('');
  const [reuploadDeadlineDays, setReuploadDeadlineDays] = useState(7);
  const [reuploadNotifyEmail, setReuploadNotifyEmail] = useState(true);
  const [reuploadNotifyDashboard, setReuploadNotifyDashboard] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('pending');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const canAccess = role && (role === Role.MASTER || hasPermission(role, 'manage_compliance'));

  const cpfDigits = cleanNumber(editOwner?.cpf ?? '');
  const cnpjDigits = cleanNumber(editOwner?.cnpj ?? '');
  const hasCpf = cpfDigits.length > 0;
  const hasCnpj = cnpjDigits.length > 0;
  const isCpfValid = !hasCpf || validateCPF(editOwner?.cpf ?? '');
  const isCnpjValid = !hasCnpj || validateCNPJ(editOwner?.cnpj ?? '');
  const isSaveDisabled = actionLoading || !isCpfValid || !isCnpjValid;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isEditing || !editOwner) return;
    const selectedCountry = editOwner.address_country || 'BR';
    const dial = COUNTRY_OPTIONS.find((option) => option.code === selectedCountry)?.dial || '+55';

    if (!editOwner.address_country || !editOwner.phone_country_code) {
      setEditOwner((prev) =>
        prev
          ? {
              ...prev,
              address_country: prev.address_country || selectedCountry,
              phone_country_code: prev.phone_country_code || dial,
            }
          : prev
      );
    }
  }, [isEditing, editOwner]);

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
      router.push('/admin/hangarshare');
    } catch (error) {
      console.error('Verify error:', error);
      alert('Erro ao aprovar proprietário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentAction = async (doc: OwnerDocument, action: 'approve' | 'reject') => {
    if (!doc.id.startsWith('owner-doc-')) return;
    const documentId = doc.id.replace('owner-doc-', '');
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token de autenticação ausente. Faça login novamente.');
      return;
    }

    let payload: { reason?: string; notes?: string } = {};
    if (action === 'reject') {
      const reason = window.prompt('Informe o motivo da rejeição:');
      if (!reason) return;
      payload = { reason };
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/hangarshare/owner-documents/${documentId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao processar documento');
      }

      const updated = await res.json();
      setDocuments((prev) =>
        prev.map((item) =>
          item.id === doc.id
            ? { ...item, status: updated.document?.upload_status || item.status }
            : item
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar documento');
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
      router.push('/admin/hangarshare');
    } catch (error) {
      console.error('Reject error:', error);
      alert('Erro ao rejeitar proprietário');
    } finally {
      setActionLoading(false);
    }
  };

  const closeReuploadModal = () => {
    setReuploadDoc(null);
    setReuploadReason('');
    setReuploadDeadlineDays(7);
    setReuploadNotifyEmail(true);
    setReuploadNotifyDashboard(true);
  };

  const handleRequestReupload = async () => {
    if (!reuploadDoc) return;
    if (!reuploadReason.trim()) {
      alert('Informe o motivo do reenvio.');
      return;
    }

    const documentId = reuploadDoc.id.replace('owner-doc-', '');
    const token = localStorage.getItem('token');

    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/hangarshare/owner-documents/${documentId}/request-reupload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: reuploadReason.trim(),
          deadlineDays: Math.max(1, reuploadDeadlineDays || 7),
          notifyEmail: reuploadNotifyEmail,
          notifyDashboard: reuploadNotifyDashboard,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao solicitar reenvio');
      }

      const data = await res.json();
      setDocuments((prev) =>
        prev.map((item) =>
          item.id === reuploadDoc.id
            ? {
                ...item,
                status: data.document?.upload_status,
                reuploadDeadline: data.document?.reupload_deadline,
                reuploadReason: reuploadReason.trim(),
              }
            : item
        )
      );
      closeReuploadModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao solicitar reenvio');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = () => {
    const currentStatus = owner?.verification_status || (owner?.is_verified ? 'verified' : 'pending');
    setStatusValue(currentStatus);
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!ownerId) return;
    try {
      setActionLoading(true);
      const isVerified = ['verified', 'approved'].includes(statusValue);
      const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: statusValue,
          is_verified: isVerified,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao atualizar status');
      }

      const data = await res.json();
      setOwner(data.owner || owner);
      setEditOwner(data.owner || editOwner);
      setStatusModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminUpload = async (doc: OwnerDocument, file: File | null) => {
    if (!file || !ownerId) return;
    const documentType = doc.type || doc.label;
    if (!documentType) {
      alert('Tipo de documento inválido.');
      return;
    }

    try {
      setUploadingDocId(doc.id);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', file);
      formData.append('ownerId', ownerId);
      formData.append('documentType', documentType);

      const res = await fetch('/api/admin/hangarshare/owner-documents/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao enviar documento');
      }

      const data = await res.json();
      const updatedDoc = data.document;

      setDocuments((prev) => {
        const existing = prev.find((item) => item.id === doc.id);
        if (existing) {
          return prev.map((item) =>
            item.id === doc.id
              ? {
                  ...item,
                  url: updatedDoc.file_path,
                  name: updatedDoc.document_name,
                  status: updatedDoc.upload_status,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            id: `owner-doc-${updatedDoc.id}`,
            label: updatedDoc.document_type || doc.label,
            url: updatedDoc.file_path,
            status: updatedDoc.upload_status,
            type: updatedDoc.document_type,
            name: updatedDoc.document_name,
          },
        ];
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao enviar documento');
    } finally {
      setUploadingDocId(null);
    }
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleaned = cleanNumber(cep);
    if (cleaned.length !== 8) return;
    try {
      const response = await fetch(`/api/address/cep?code=${cleaned}`);
      if (!response.ok) return;
      const data = await response.json();
      setEditOwner((prev) =>
        prev
          ? {
              ...prev,
              address_zip: maskCEP(cleaned),
              address_street: data.street || prev.address_street,
              address_neighborhood: data.neighborhood || prev.address_neighborhood,
              address_city: data.city || prev.address_city,
              address_state: data.state || prev.address_state,
            }
          : prev
      );
    } catch (error) {
      console.error('Failed to fetch address by CEP:', error);
    }
  };

  const handleSaveOwner = async () => {
    if (!ownerId || !editOwner) return;
    if (!isCpfValid || !isCnpjValid) {
      alert('Corrija o CPF/CNPJ antes de salvar.');
      return;
    }
    setActionLoading(true);
    try {
      const addressFull = buildAddressString(editOwner);
      const primaryPhone = editOwner.phone || editOwner.phone_mobile || editOwner.phone_landline || null;
      const res = await fetch(`/api/admin/hangarshare/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: editOwner.company_name,
          cnpj: editOwner.cnpj,
          phone: primaryPhone,
          address: addressFull,
          address_country: editOwner.address_country,
          address_zip: editOwner.address_zip,
          address_street: editOwner.address_street,
          address_number: editOwner.address_number,
          address_complement: editOwner.address_complement,
          address_neighborhood: editOwner.address_neighborhood,
          address_city: editOwner.address_city,
          address_state: editOwner.address_state,
          phone_country_code: editOwner.phone_country_code,
          phone_mobile: editOwner.phone_mobile,
          phone_landline: editOwner.phone_landline,
          website: editOwner.website,
          social_instagram: editOwner.social_instagram,
          social_facebook: editOwner.social_facebook,
          social_linkedin: editOwner.social_linkedin,
          social_youtube: editOwner.social_youtube,
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

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando dados...</p>
      </div>
    );
  }

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
            onClick={() => router.push('/admin/hangarshare')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            ← Voltar para Dashboard HangarShare
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
            onClick={() => router.push('/admin/hangarshare')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Voltar para Dashboard HangarShare
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
                  disabled={isSaveDisabled}
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
                <div className="space-y-1">
                  <input
                    value={maskCNPJ(editOwner?.cnpj ?? '')}
                    onChange={(e) =>
                      setEditOwner((prev) =>
                        prev
                          ? {
                              ...prev,
                              cnpj: maskCNPJ(e.target.value),
                              cpf: cleanNumber(e.target.value).length > 0 ? '' : prev.cpf,
                            }
                          : prev
                      )
                    }
                    disabled={hasCpf}
                    placeholder="00.000.000/0000-00"
                    className="w-full border border-slate-200 rounded px-3 py-2 disabled:bg-slate-100"
                  />
                  {!isCnpjValid && <p className="text-xs text-red-600">CNPJ inválido.</p>}
                </div>
              ) : (
                <p className="font-semibold">{owner.cnpj || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">CPF</p>
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    value={maskCPF(editOwner?.cpf ?? '')}
                    onChange={(e) =>
                      setEditOwner((prev) =>
                        prev
                          ? {
                              ...prev,
                              cpf: maskCPF(e.target.value),
                              cnpj: cleanNumber(e.target.value).length > 0 ? '' : prev.cnpj,
                            }
                          : prev
                      )
                    }
                    disabled={hasCnpj}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-200 rounded px-3 py-2 disabled:bg-slate-100"
                  />
                  {!isCpfValid && <p className="text-xs text-red-600">CPF inválido.</p>}
                </div>
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
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={editOwner?.address_country ?? 'BR'}
                      onChange={(e) =>
                        setEditOwner((prev) => {
                          if (!prev) return prev;
                          const selected = COUNTRY_OPTIONS.find((option) => option.code === e.target.value);
                          return {
                            ...prev,
                            address_country: e.target.value,
                            phone_country_code: selected?.dial || prev.phone_country_code,
                          };
                        })
                      }
                      className="w-40 border border-slate-200 rounded px-3 py-2"
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">{editOwner?.phone_country_code || '+55'}</span>
                      <input
                        value={maskPhoneBR(editOwner?.phone_landline ?? '')}
                        onChange={(e) =>
                          setEditOwner((prev) =>
                            prev ? { ...prev, phone_landline: maskPhoneBR(e.target.value) } : prev
                          )
                        }
                        placeholder="(31)3333-3333"
                        className="w-full border border-slate-200 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{editOwner?.phone_country_code || '+55'}</span>
                    <input
                      value={maskPhoneBR(editOwner?.phone_mobile ?? '')}
                      onChange={(e) =>
                        setEditOwner((prev) =>
                          prev ? { ...prev, phone_mobile: maskPhoneBR(e.target.value) } : prev
                        )
                      }
                      placeholder="(31)99999-9999"
                      className="w-full border border-slate-200 rounded px-3 py-2"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold">
                    {owner.phone_landline || owner.phone
                      ? `${owner.phone_country_code || ''} ${owner.phone_landline || owner.phone}`.trim()
                      : '—'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Celular: {owner.phone_mobile ? `${owner.phone_country_code || ''} ${owner.phone_mobile}`.trim() : '—'}
                  </p>
                </div>
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
            <div>
              <p className="text-slate-500">Instagram</p>
              {isEditing ? (
                <input
                  value={editOwner?.social_instagram ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, social_instagram: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.social_instagram || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Facebook</p>
              {isEditing ? (
                <input
                  value={editOwner?.social_facebook ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, social_facebook: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.social_facebook || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">LinkedIn</p>
              {isEditing ? (
                <input
                  value={editOwner?.social_linkedin ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, social_linkedin: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.social_linkedin || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">YouTube</p>
              {isEditing ? (
                <input
                  value={editOwner?.social_youtube ?? ''}
                  onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, social_youtube: e.target.value } : prev))}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{owner.social_youtube || '—'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500">Endereço</p>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={editOwner?.address_zip ?? ''}
                    onChange={(e) => {
                      const masked = maskCEP(e.target.value);
                      setEditOwner((prev) => (prev ? { ...prev, address_zip: masked } : prev));
                      if (cleanNumber(masked).length === 8) {
                        fetchAddressByCEP(masked);
                      }
                    }}
                    placeholder="CEP 00000-000"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_street ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_street: e.target.value } : prev))}
                    placeholder="Rua"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_number ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_number: e.target.value } : prev))}
                    placeholder="Número"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_complement ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_complement: e.target.value } : prev))}
                    placeholder="Complemento"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_neighborhood ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_neighborhood: e.target.value } : prev))}
                    placeholder="Bairro"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_city ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_city: e.target.value } : prev))}
                    placeholder="Cidade"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <input
                    value={editOwner?.address_state ?? ''}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_state: e.target.value } : prev))}
                    placeholder="Estado"
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  />
                  <select
                    value={editOwner?.address_country ?? 'BR'}
                    onChange={(e) => setEditOwner((prev) => (prev ? { ...prev, address_country: e.target.value } : prev))}
                    className="w-full border border-slate-200 rounded px-3 py-2"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="font-semibold">{buildAddressString(owner) || '—'}</p>
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
                    const isOwnerDoc = doc.id.startsWith('owner-doc-');
                    const isMissing = doc.status === 'missing' || (!doc.url && isOwnerDoc);
                    const statusLabel = formatDocStatus(doc.status, isMissing);
                    const aiStatusLabel = doc.aiStatus || 'pendente';
                    const resolvedUrl = resolveDocUrl(doc.url);
                    const isUnavailable = !resolvedUrl;
                    const isMock = /sample|mock/i.test(resolvedUrl);
                    return (
                      <div key={doc.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{doc.label}</p>
                            <p className="text-xs text-slate-500">Arquivo: {doc.name || doc.url?.split('/').pop() || '—'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!resolvedUrl) {
                                alert('Arquivo indisponível ou ausente.');
                                return;
                              }
                              setPreviewDoc(doc);
                              setPreviewUrl(resolvedUrl);
                            }}
                            disabled={isUnavailable}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                          >
                            Visualizar
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                            Status: {statusLabel}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                            IA: {aiStatusLabel}
                          </span>
                          {isMock && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                              Mock
                            </span>
                          )}
                          {isUnavailable && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
                              Arquivo indisponível ou mock
                            </span>
                          )}
                          {doc.reuploadDeadline && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                              Prazo: {new Date(doc.reuploadDeadline).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {doc.reuploadReason && (
                          <p className="mt-2 text-xs text-amber-700">Motivo do reenvio: {doc.reuploadReason}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isOwnerDoc && (
                            <label className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
                              {uploadingDocId === doc.id ? 'Enviando...' : 'Enviar arquivo'}
                              <input
                                type="file"
                                className="hidden"
                                accept="application/pdf,image/jpeg,image/png,image/webp"
                                disabled={uploadingDocId === doc.id}
                                onChange={(event) =>
                                  handleAdminUpload(doc, event.target.files?.[0] || null)
                                }
                              />
                            </label>
                          )}
                          {isOwnerDoc && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDocumentAction(doc, 'approve')}
                                disabled={actionLoading || isMissing}
                                className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-300"
                              >
                                Aprovar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDocumentAction(doc, 'reject')}
                                disabled={actionLoading || isMissing}
                                className="px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-300"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          {isOwnerDoc && (
                            <button
                              type="button"
                              onClick={async () => {
                                setReuploadDoc(doc);
                                setReuploadReason('');
                                setReuploadDeadlineDays(7);
                                setReuploadNotifyEmail(true);
                                setReuploadNotifyDashboard(true);
                              }}
                              disabled={actionLoading}
                              className="px-3 py-2 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-slate-300"
                            >
                              Solicitar reenvio
                            </button>
                          )}
                        </div>
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
            ✓ Aprovar
          </button>
          <button
            onClick={openStatusModal}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300"
          >
            Alterar Status
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-slate-300"
          >
            ✗ Reprovar/Cancelar
          </button>
        </section>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm text-slate-500">Documento</p>
                <h3 className="text-lg font-bold text-slate-900">{previewDoc.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewUrl('');
                }}
                className="px-3 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {(() => {
                const extension = getFileExtension(previewUrl || previewDoc.url || previewDoc.name);
                const isPdf = extension === 'pdf';
                const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension);

                if (isPdf) {
                  return (
                    <div className="space-y-3">
                      <object
                        data={previewUrl}
                        type="application/pdf"
                        className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
                      >
                        <div className="p-4 text-center text-slate-600">
                          <p>Pré-visualização indisponível para este PDF.</p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                          >
                            Abrir em nova aba
                          </a>
                        </div>
                      </object>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Abrir PDF em nova aba
                      </a>
                    </div>
                  );
                }

                if (isImage) {
                  return (
                    <img
                      src={previewUrl}
                      alt={previewDoc.label}
                      className="max-h-[70vh] w-full object-contain rounded-lg border border-slate-200 bg-white"
                    />
                  );
                }

                return (
                  <div className="text-center text-slate-600 space-y-3">
                    <p>Pré-visualização indisponível para este formato.</p>
                    <a
                      href={previewUrl}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Baixar arquivo
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {reuploadDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Solicitar reenvio</h3>
              <p className="text-sm text-slate-500">{reuploadDoc.label}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo do reenvio</label>
                <textarea
                  value={reuploadReason}
                  onChange={(e) => setReuploadReason(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm"
                  placeholder="Descreva o motivo da solicitação"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Prazo em dias</label>
                <input
                  type="number"
                  min={1}
                  value={reuploadDeadlineDays}
                  onChange={(e) => setReuploadDeadlineDays(Number(e.target.value || 1))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={reuploadNotifyEmail}
                    onChange={(e) => setReuploadNotifyEmail(e.target.checked)}
                  />
                  Enviar e-mail de notificação
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={reuploadNotifyDashboard}
                    onChange={(e) => setReuploadNotifyDashboard(e.target.checked)}
                  />
                  Enviar Notificação ao Dashboard do Usuário
                </label>
              </div>
            </div>
            <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeReuploadModal}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRequestReupload}
                className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-slate-300"
                disabled={actionLoading}
              >
                Solicitar reenvio
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Alterar Status</h3>
              <p className="text-sm text-slate-500">Atualize o status do proprietário</p>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Status
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="pending">Pendente</option>
                  <option value="verified">Verificado</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Reprovado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Status “Verificado/Aprovado” marca o proprietário como verificado.
              </p>
            </div>
            <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
                disabled={actionLoading}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
