'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface TrasladoRequest {
  id: number;
  user_id?: number | null;
  aircraft_model: string;
  aircraft_prefix: string;
  aircraft_category: string;
  maintenance_status?: string | null;
  origin_city: string;
  origin_airport: string | null;
  destination_city: string;
  destination_airport: string | null;
  date_window_start: string;
  date_window_end: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  operator_name: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  assigned_to: number | null;
  requester_first_name?: string | null;
  requester_last_name?: string | null;
  requester_email?: string | null;
  assignee_first_name?: string | null;
  assignee_last_name?: string | null;
  assignee_email?: string | null;
  fee_amount_cents?: number | null;
  fee_base_amount_cents?: number | null;
  fee_discount_cents?: number | null;
  fee_discount_reason?: string | null;
  fee_status?: string | null;
  fee_currency?: string | null;
  fee_payer_role?: string | null;
  fee_created_at?: string | null;
  created_at: string;
}

interface ApprovedPilot {
  id: number;
  user_id: number | null;
  full_name: string;
  contact_email: string;
}

export default function AdminTrasladosPage() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<TrasladoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [selectedRequest, setSelectedRequest] = useState<TrasladoRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('new');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [approvedPilots, setApprovedPilots] = useState<ApprovedPilot[]>([]);

  const normalizedSearch = searchTerm.trim();
  const requestAssignee = (request: TrasladoRequest) => {
    if (!request.assignee_first_name && !request.assignee_last_name && !request.assignee_email) {
      return t('adminTransfers.notAvailable');
    }
    const name = [request.assignee_first_name, request.assignee_last_name].filter(Boolean).join(' ');
    const email = request.assignee_email ? ` (${request.assignee_email})` : '';
    return `${name || t('adminTransfers.notAvailable')}${email}`;
  };

  const statusOptions = [
    { value: 'new', label: t('adminTransfers.statusOptions.new') },
    { value: 'in_review', label: t('adminTransfers.statusOptions.inReview') },
    { value: 'scheduled', label: t('adminTransfers.statusOptions.scheduled') },
    { value: 'completed', label: t('adminTransfers.statusOptions.completed') },
    { value: 'cancelled', label: t('adminTransfers.statusOptions.cancelled') },
  ];

  const formatCurrency = (amountCents?: number | null) => {
    if (!amountCents && amountCents !== 0) return t('adminTransfers.notAvailable');
    const amount = amountCents / 100;
    const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
    return amount.toLocaleString(locale, { style: 'currency', currency: 'BRL' });
  };

  const getDiscountLabel = (reason?: string | null) => {
    if (!reason) return t('adminTransfers.discount.none');
    if (reason === 'premium_plan') return t('adminTransfers.discount.premium');
    if (reason === 'pro_plan') return t('adminTransfers.discount.pro');
    return t('adminTransfers.discount.applied');
  };

  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master')) {
    return (
      <div className="text-red-600 p-8">
        <b>{t('adminTransfers.accessDeniedTitle')}</b>
        <div className="mt-2 text-slate-700">{t('adminTransfers.accessDeniedBody')}</div>
      </div>
    );
  }

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, page, normalizedSearch, token]);

  useEffect(() => {
    fetchApprovedPilots();
  }, [token]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: String(pagination.limit),
      });
      if (normalizedSearch) {
        queryParams.set('q', normalizedSearch);
      }
      const res = await fetch(`/api/admin/traslados?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setPagination({
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 1,
          limit: data.pagination?.limit ?? pagination.limit,
        });
      }
    } catch (error) {
      console.error('Error fetching traslados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedPilots = async () => {
    try {
      const res = await fetch('/api/admin/traslados/pilots?status=approved&limit=200', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApprovedPilots((data.pilots || []).filter((pilot: ApprovedPilot) => pilot.user_id));
      }
    } catch (error) {
      console.error('Error fetching approved pilots:', error);
    }
  };

  const openDetails = (request: TrasladoRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setStatusUpdate(request.status || 'new');
    setAssignedTo(request.assigned_to || '');
  };

  const handleSave = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/traslados/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusUpdate, adminNotes, assignedTo: assignedTo || null }),
      });

      if (res.ok) {
        setSelectedRequest(null);
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao atualizar solicitação');
      }
    } catch (error) {
      console.error('Error updating traslados:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-blue-900">{t('adminTransfers.title')}</h1>
            <p className="text-slate-600 mt-2">{t('adminTransfers.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">{t('adminTransfers.searchLabel')}</label>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder={t('adminTransfers.searchPlaceholder')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="text-sm text-slate-600">{t('adminTransfers.statusLabel')}</label>
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

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">{t('adminTransfers.loading')}</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">{t('adminTransfers.empty')}</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-blue-900">
                      {request.aircraft_model} — {request.aircraft_prefix}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {request.origin_city} → {request.destination_city}
                    </p>
                    <p className="text-xs text-slate-500">
                      {request.contact_name} • {request.contact_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('adminTransfers.feeLabel')}: {request.fee_status ? request.fee_status.toUpperCase() : t('adminTransfers.feeNotRecorded')} •{' '}
                      {formatCurrency(request.fee_amount_cents ?? request.fee_base_amount_cents ?? null)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('adminTransfers.requesterLabel')}: {request.requester_first_name || request.requester_last_name
                        ? `${request.requester_first_name ?? ''} ${request.requester_last_name ?? ''}`.trim()
                        : t('adminTransfers.notAvailable')} ({request.requester_email || t('adminTransfers.notAvailable')})
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase text-slate-500">{t('adminTransfers.statusLabel')}</span>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {request.status}
                    </span>
                    <button
                      onClick={() => openDetails(request)}
                      className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      {t('adminTransfers.viewDetails')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-lg bg-white p-4 shadow md:flex-row">
            <div className="text-sm text-slate-600">
              {t('adminTransfers.paginationLabel')}: {page} / {pagination.totalPages} • {t('adminTransfers.paginationTotal')}: {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
              >
                {t('adminTransfers.paginationPrev')}
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
              >
                {t('adminTransfers.paginationNext')}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-blue-900">{t('adminTransfers.requestTitle')}: TR-{selectedRequest.id}</h2>
                <p className="text-sm text-slate-600">{selectedRequest.aircraft_model}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.routeLabel')}</div>
                <div>{selectedRequest.origin_city} → {selectedRequest.destination_city}</div>
                <div className="text-xs text-slate-500">
                  {selectedRequest.origin_airport || t('adminTransfers.notAvailable')} → {selectedRequest.destination_airport || t('adminTransfers.notAvailable')}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.windowLabel')}</div>
                <div>
                  {selectedRequest.date_window_start}{' '}
                  {selectedRequest.date_window_end ? `${t('adminTransfers.windowUntil')} ${selectedRequest.date_window_end}` : ''}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.contactLabel')}</div>
                <div>{selectedRequest.contact_name}</div>
                <div>{selectedRequest.contact_email}</div>
                <div>{selectedRequest.contact_phone || t('adminTransfers.phoneFallback')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.requesterLabel')}</div>
                <div>
                  {selectedRequest.requester_first_name || selectedRequest.requester_last_name
                    ? `${selectedRequest.requester_first_name ?? ''} ${selectedRequest.requester_last_name ?? ''}`.trim()
                    : t('adminTransfers.notAvailable')}
                </div>
                <div>{selectedRequest.requester_email || t('adminTransfers.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.assigneeLabel')}</div>
                <div>{requestAssignee(selectedRequest)}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.aircraftCategoryLabel')}</div>
                <div>{selectedRequest.aircraft_category || t('adminTransfers.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.maintenanceLabel')}</div>
                <div>{selectedRequest.maintenance_status || t('adminTransfers.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.operatorLabel')}</div>
                <div>{selectedRequest.operator_name || t('adminTransfers.notAvailable')}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{t('adminTransfers.notesLabel')}</div>
                <div>{selectedRequest.notes || t('adminTransfers.notesFallback')}</div>
              </div>
              <div className="md:col-span-2">
                <div className="font-semibold text-slate-800">{t('adminTransfers.feeBreakdownTitle')}</div>
                {selectedRequest.fee_status ? (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <div className="flex flex-wrap gap-4">
                      <div>{t('adminTransfers.feeStatus')}: {selectedRequest.fee_status.toUpperCase()}</div>
                      <div>{t('adminTransfers.feePayer')}: {selectedRequest.fee_payer_role?.toUpperCase() || t('adminTransfers.notAvailable')}</div>
                      <div>{t('adminTransfers.feeTotal')}: {formatCurrency(selectedRequest.fee_amount_cents ?? 0)}</div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div>{t('adminTransfers.feeBase')}: {formatCurrency(selectedRequest.fee_base_amount_cents ?? selectedRequest.fee_amount_cents ?? 0)}</div>
                      <div>
                        {getDiscountLabel(selectedRequest.fee_discount_reason)}:{' '}
                        {selectedRequest.fee_discount_cents && selectedRequest.fee_discount_cents > 0
                          ? `- ${formatCurrency(selectedRequest.fee_discount_cents)}`
                          : t('adminTransfers.notAvailable')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">{t('adminTransfers.feeNotRecordedDetail')}</div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t('adminTransfers.statusLabel')}</label>
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
                <label className="text-sm font-semibold text-slate-700">{t('adminTransfers.internalNotes')}</label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t('adminTransfers.assignedPilot')}</label>
                <select
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value ? Number(event.target.value) : '')}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('adminTransfers.unassigned')}</option>
                  {approvedPilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.user_id ?? ''}>
                      {pilot.full_name} ({pilot.contact_email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                {t('adminTransfers.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
              >
                {saving ? t('adminTransfers.saving') : t('adminTransfers.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
