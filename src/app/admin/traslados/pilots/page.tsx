'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface PilotDocument {
  pilot_id: number;
  document_type: string;
  file_path: string;
  file_name: string | null;
}

interface Pilot {
  id: number;
  full_name: string;
  contact_email: string;
  contact_phone: string | null;
  license_type: string;
  license_number: string;
  medical_expiry: string | null;
  total_hours: number | null;
  ratings: string | null;
  categories: string | null;
  base_city: string | null;
  availability: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function AdminTrasladosPilotsPage() {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const activeTab = 'pilots';
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [documents, setDocuments] = useState<PilotDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, inactive: 0 });

  const normalizedSearch = searchTerm.trim();

  const statusOptions = [
    { value: 'all', label: t('adminTransfersPilots.statusOptions.all') },
    { value: 'pending', label: t('adminTransfersPilots.statusOptions.pending') },
    { value: 'approved', label: t('adminTransfersPilots.statusOptions.approved') },
    { value: 'rejected', label: t('adminTransfersPilots.statusOptions.rejected') },
    { value: 'inactive', label: t('adminTransfersPilots.statusOptions.inactive') },
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master')) {
    return (
      <div className="text-red-600 p-8">
        <b>{t('adminTransfersPilots.accessDeniedTitle')}</b>
        <div className="mt-2 text-slate-700">{t('adminTransfersPilots.accessDeniedBody')}</div>
      </div>
    );
  }

  useEffect(() => {
    fetchPilots();
  }, [statusFilter, page, normalizedSearch, token]);

  useEffect(() => {
    fetchSummary();
  }, [token]);

  const fetchSummaryTotal = async (url: string) => {
    if (!token) return 0;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data.pagination?.total ?? 0);
  };

  const fetchSummary = async () => {
    if (!token) return;
    setSummaryLoading(true);
    try {
      const statuses = ['pending', 'approved', 'rejected', 'inactive'];
      const totals = await Promise.all(
        statuses.map((status) =>
          fetchSummaryTotal(`/api/admin/traslados/pilots?status=${status}&limit=1`)
        )
      );

      setSummary({
        pending: totals[0] ?? 0,
        approved: totals[1] ?? 0,
        rejected: totals[2] ?? 0,
        inactive: totals[3] ?? 0,
      });
    } catch (error) {
      console.error('Error fetching pilot summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchPilots = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        includeDocs: '1',
        page: String(page),
        limit: String(pagination.limit),
      });
      if (normalizedSearch) {
        queryParams.set('q', normalizedSearch);
      }
      const res = await fetch(`/api/admin/traslados/pilots?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPilots(data.pilots || []);
        setDocuments(data.documents || []);
        setPagination({
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 1,
          limit: data.pagination?.limit ?? pagination.limit,
        });
      }
    } catch (error) {
      console.error('Error fetching pilots:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentsByPilot = useMemo(() => {
    return documents.reduce<Record<number, PilotDocument[]>>((acc, doc) => {
      if (!acc[doc.pilot_id]) acc[doc.pilot_id] = [];
      acc[doc.pilot_id].push(doc);
      return acc;
    }, {});
  }, [documents]);

  const openPilot = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setStatusUpdate(pilot.status || 'pending');
    setAdminNotes(pilot.notes || '');
  };

  const handleSave = async () => {
    if (!selectedPilot) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/traslados/pilots/${selectedPilot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusUpdate, notes: adminNotes }),
      });
      if (res.ok) {
        setSelectedPilot(null);
        fetchPilots();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao atualizar piloto');
      }
    } catch (error) {
      console.error('Error updating pilot:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-blue-900">{t('adminTransfersPilots.title')}</h1>
            <p className="text-slate-600 mt-2">{t('adminTransfersPilots.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">{t('adminTransfersPilots.searchLabel')}</label>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder={t('adminTransfersPilots.searchPlaceholder')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="text-sm text-slate-600">{t('adminTransfersPilots.statusLabel')}</label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Dashboard Admin
          </Link>
          <Link
            href="/admin/traslados"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTab === 'requests'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Solicitações
          </Link>
          <Link
            href="/admin/traslados/pilots"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTab === 'pilots'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Pilotos
          </Link>
          <Link
            href="/admin/traslados/owners"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTab === 'owners'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Proprietários/Operadoras
          </Link>
          <Link
            href="/admin/traslados/messages"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTab === 'messages'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Mensagens
          </Link>
          <Link
            href="/admin/traslados/status"
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeTab === 'status'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Status da operação
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-xs uppercase text-slate-500">Em verificacao</div>
            <div className="mt-2 text-2xl font-bold text-blue-900">
              {summaryLoading ? '...' : summary.pending}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-xs uppercase text-slate-500">Elegiveis</div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">
              {summaryLoading ? '...' : summary.approved}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-xs uppercase text-slate-500">Nao elegiveis</div>
            <div className="mt-2 text-2xl font-bold text-rose-700">
              {summaryLoading ? '...' : summary.rejected + summary.inactive}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">{t('adminTransfersPilots.loading')}</div>
        ) : pilots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">{t('adminTransfersPilots.empty')}</div>
        ) : (
          <div className="grid gap-4">
            {pilots.map((pilot) => (
              <div key={pilot.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-blue-900">{pilot.full_name}</h3>
                    <p className="text-sm text-slate-600">
                      {pilot.license_type} • {pilot.license_number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('adminTransfersPilots.baseLabel')}: {pilot.base_city || t('adminTransfersPilots.notAvailable')}
                    </p>
                  </div>
                  <button
                    onClick={() => openPilot(pilot)}
                    className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    {t('adminTransfersPilots.viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-lg bg-white p-4 shadow md:flex-row">
            <div className="text-sm text-slate-600">
              {t('adminTransfersPilots.paginationLabel')}: {page} / {pagination.totalPages} • {t('adminTransfersPilots.paginationTotal')}: {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
              >
                {t('adminTransfersPilots.paginationPrev')}
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
              >
                {t('adminTransfersPilots.paginationNext')}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPilot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-blue-900">{selectedPilot.full_name}</h2>
                <p className="text-sm text-slate-600">{selectedPilot.contact_email}</p>
              </div>
              <button onClick={() => setSelectedPilot(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfersPilots.contactLabel')}</div>
                <div>{selectedPilot.contact_phone || t('adminTransfersPilots.phoneFallback')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfersPilots.totalHours')}</div>
                <div>{selectedPilot.total_hours ?? t('adminTransfersPilots.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfersPilots.ratings')}</div>
                <div>{selectedPilot.ratings || t('adminTransfersPilots.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfersPilots.categories')}</div>
                <div>{selectedPilot.categories || t('adminTransfersPilots.notAvailable')}</div>
              </div>
            </div>

            {documentsByPilot[selectedPilot.id]?.length ? (
              <div className="mt-6">
                <div className="font-semibold text-slate-800 mb-2">{t('adminTransfersPilots.documents')}</div>
                <div className="flex flex-wrap gap-2">
                  {documentsByPilot[selectedPilot.id].map((doc) => (
                    <a
                      key={`${selectedPilot.id}-${doc.file_path}`}
                      href={doc.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-blue-200 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                    >
                      {doc.document_type}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t('adminTransfersPilots.statusLabel')}</label>
                <select
                  value={statusUpdate}
                  onChange={(event) => setStatusUpdate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t('adminTransfersPilots.internalNotes')}</label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedPilot(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                {t('adminTransfersPilots.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
              >
                {saving ? t('adminTransfersPilots.saving') : t('adminTransfersPilots.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
