'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface LeaseTemplate {
  id: number;
  name: string;
  version: string;
  content_url: string;
  created_at: string;
}

interface ListingOption {
  id: number;
  icao: string;
  hangarNumber: string;
  status: string;
}

interface LeaseItem {
  id: number;
  listing_id: number;
  lease_template_id: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  icao_code: string | null;
  hangar_number: string | null;
  template_name: string | null;
  template_version: string | null;
  template_url: string | null;
}

interface LeaseFormState {
  listingId: string;
  templateId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface LeaseEditState {
  status: string;
  startDate: string;
  endDate: string;
  templateId: string;
}

export default function OwnerLeaseTemplatesPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState<LeaseTemplate[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaseForm, setLeaseForm] = useState<LeaseFormState>({
    listingId: '',
    templateId: '',
    startDate: '',
    endDate: '',
    status: 'draft',
  });
  const [leaseEdits, setLeaseEdits] = useState<Record<number, LeaseEditState>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAll();
  }, [user, router]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        router.push('/login');
        return;
      }

      const [templatesRes, listingsRes, leasesRes] = await Promise.all([
        fetch('/api/hangarshare/owner/lease-templates', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch('/api/hangarshare/owner/listings', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch('/api/hangarshare/owner/leases', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (!templatesRes.ok) {
        throw new Error('Erro ao carregar modelos de contrato');
      }

      if (!listingsRes.ok) {
        throw new Error('Erro ao carregar hangares');
      }

      if (!leasesRes.ok) {
        throw new Error('Erro ao carregar contratos');
      }

      const [templatesData, listingsData, leasesData] = await Promise.all([
        templatesRes.json(),
        listingsRes.json(),
        leasesRes.json(),
      ]);

      setTemplates(templatesData.templates || []);
      setListings(listingsData.listings || []);
      setLeases(leasesData.leases || []);
    } catch (error) {
      console.error('Error loading lease templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaseEditState = useMemo(() => {
    const edits: Record<number, LeaseEditState> = {};
    leases.forEach((lease) => {
      edits[lease.id] = {
        status: lease.status,
        startDate: lease.start_date ? lease.start_date.slice(0, 10) : '',
        endDate: lease.end_date ? lease.end_date.slice(0, 10) : '',
        templateId: lease.lease_template_id ? String(lease.lease_template_id) : '',
      };
    });
    return edits;
  }, [leases]);

  useEffect(() => {
    setLeaseEdits(leaseEditState);
  }, [leaseEditState]);

  const handleCreateLease = async () => {
    if (!leaseForm.listingId) return;

    try {
      setActionLoading(true);
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/hangarshare/owner/leases', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: Number(leaseForm.listingId),
          lease_template_id: leaseForm.templateId ? Number(leaseForm.templateId) : null,
          start_date: leaseForm.startDate || null,
          end_date: leaseForm.endDate || null,
          status: leaseForm.status,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao criar contrato');
      }

      setLeaseForm({
        listingId: '',
        templateId: '',
        startDate: '',
        endDate: '',
        status: 'draft',
      });
      await loadAll();
    } catch (error) {
      console.error('Error creating lease:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLease = async (leaseId: number) => {
    const edit = leaseEdits[leaseId];
    if (!edit) return;

    try {
      setActionLoading(true);
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/hangarshare/owner/leases/${leaseId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: edit.status,
          start_date: edit.startDate || null,
          end_date: edit.endDate || null,
          lease_template_id: edit.templateId ? Number(edit.templateId) : null,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar contrato');
      }

      await loadAll();
    } catch (error) {
      console.error('Error updating lease:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLease = async (leaseId: number) => {
    try {
      setActionLoading(true);
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/hangarshare/owner/leases/${leaseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir contrato');
      }

      await loadAll();
    } catch (error) {
      console.error('Error deleting lease:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Contratos</h1>
          <p className="text-slate-600 mt-2">Crie e gerencie contratos de locação.</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Criar novo contrato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Hangar</label>
              <select
                value={leaseForm.listingId}
                onChange={(event) =>
                  setLeaseForm((prev) => ({ ...prev, listingId: event.target.value }))
                }
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="">Selecione o hangar</option>
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.icao} - {listing.hangarNumber} ({listing.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Modelo de contrato</label>
              <select
                value={leaseForm.templateId}
                onChange={(event) =>
                  setLeaseForm((prev) => ({ ...prev, templateId: event.target.value }))
                }
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="">Sem modelo</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} (v{template.version})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Data de início</label>
              <input
                type="date"
                value={leaseForm.startDate}
                onChange={(event) =>
                  setLeaseForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Data de término</label>
              <input
                type="date"
                value={leaseForm.endDate}
                onChange={(event) =>
                  setLeaseForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                value={leaseForm.status}
                onChange={(event) =>
                  setLeaseForm((prev) => ({ ...prev, status: event.target.value }))
                }
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCreateLease}
              disabled={!leaseForm.listingId || actionLoading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {actionLoading ? 'Salvando...' : 'Criar contrato'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Contratos existentes</h2>
          {leases.length === 0 ? (
            <p className="text-slate-600">Nenhum contrato registrado.</p>
          ) : (
            <div className="space-y-4">
              {leases.map((lease) => (
                <div key={lease.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {lease.icao_code || 'ICAO'} - {lease.hangar_number || 'Hangar'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Modelo: {lease.template_name || 'Sem modelo'}
                        {lease.template_version ? ` (v${lease.template_version})` : ''}
                      </p>
                      {lease.signed_at && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Assinado em {new Date(lease.signed_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    {lease.template_url && (
                      <a
                        href={lease.template_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Ver modelo
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Status</label>
                      <select
                        value={leaseEdits[lease.id]?.status || lease.status}
                        onChange={(event) =>
                          setLeaseEdits((prev) => ({
                            ...prev,
                            [lease.id]: {
                              ...(prev[lease.id] || leaseEditState[lease.id]),
                              status: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
                      >
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativo</option>
                        <option value="expired">Expirado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Início</label>
                      <input
                        type="date"
                        value={leaseEdits[lease.id]?.startDate || ''}
                        onChange={(event) =>
                          setLeaseEdits((prev) => ({
                            ...prev,
                            [lease.id]: {
                              ...(prev[lease.id] || leaseEditState[lease.id]),
                              startDate: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Término</label>
                      <input
                        type="date"
                        value={leaseEdits[lease.id]?.endDate || ''}
                        onChange={(event) =>
                          setLeaseEdits((prev) => ({
                            ...prev,
                            [lease.id]: {
                              ...(prev[lease.id] || leaseEditState[lease.id]),
                              endDate: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Modelo</label>
                      <select
                        value={leaseEdits[lease.id]?.templateId || ''}
                        onChange={(event) =>
                          setLeaseEdits((prev) => ({
                            ...prev,
                            [lease.id]: {
                              ...(prev[lease.id] || leaseEditState[lease.id]),
                              templateId: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
                      >
                        <option value="">Sem modelo</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} (v{template.version})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => handleUpdateLease(lease.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                      disabled={actionLoading}
                    >
                      Salvar alterações
                    </button>
                    <button
                      onClick={() => handleDeleteLease(lease.id)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300"
                      disabled={actionLoading}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Modelos de contrato</h2>
          {templates.length === 0 ? (
            <p className="text-slate-600">Nenhum modelo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-blue-900">{template.name}</h2>
                      <p className="text-sm text-slate-600">Versão: {template.version}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Atualizado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <a
                      href={template.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Visualizar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
