'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface TrasladoRequest {
    id: number;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    operator_name: string | null;
    origin_city: string;
    destination_city: string;
    status: string;
    created_at: string;
}

interface OwnerSummary {
    key: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    operator_name: string | null;
    total_requests: number;
    latest_request_id: number;
    latest_status: string;
    latest_created_at: string;
}

export default function AdminTrasladosOwnersPage() {
    const { t } = useLanguage();
    const { user, token } = useAuth();
    const activeTab = 'owners';
    const [requests, setRequests] = useState<TrasladoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master')) {
        return (
            <div className="text-red-600 p-8">
                <b>{t('adminTransfers.accessDeniedTitle')}</b>
                <div className="mt-2 text-slate-700">{t('adminTransfers.accessDeniedBody')}</div>
            </div>
        );
    }

    useEffect(() => {
        fetchOwners();
    }, [statusFilter, page, normalizedSearch, token]);

    const fetchOwners = async () => {
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
            console.error('Error fetching owners:', error);
        } finally {
            setLoading(false);
        }
    };

    const owners = useMemo<OwnerSummary[]>(() => {
        const map = new Map<string, OwnerSummary>();

        requests.forEach((request) => {
            const key = (request.operator_name || request.contact_email).toLowerCase();
            const existing = map.get(key);
            const createdAt = request.created_at;

            if (!existing) {
                map.set(key, {
                    key,
                    contact_name: request.contact_name,
                    contact_email: request.contact_email,
                    contact_phone: request.contact_phone,
                    operator_name: request.operator_name,
                    total_requests: 1,
                    latest_request_id: request.id,
                    latest_status: request.status,
                    latest_created_at: createdAt,
                });
                return;
            }

            existing.total_requests += 1;
            if (new Date(createdAt).getTime() > new Date(existing.latest_created_at).getTime()) {
                existing.latest_request_id = request.id;
                existing.latest_status = request.status;
                existing.latest_created_at = createdAt;
            }
        });

        return Array.from(map.values());
    }, [requests]);

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-blue-900">Proprietarios e Operadoras</h1>
                        <p className="text-slate-600 mt-2">Gerencie proprietarios vinculados aos traslados e acompanhe solicitacoes.</p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Buscar</label>
                            <input
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Nome, email ou operadora"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <label className="text-sm text-slate-600">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="all">Todos status</option>
                            <option value="new">Sem resposta</option>
                            <option value="in_review">Em analise</option>
                            <option value="scheduled">Em andamento</option>
                            <option value="completed">Concluidos</option>
                            <option value="cancelled">Recusados</option>
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

                {loading ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">Carregando proprietarios...</div>
                ) : owners.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">Nenhum proprietario encontrado.</div>
                ) : (
                    <div className="grid gap-4">
                        {owners.map((owner) => (
                            <div key={owner.key} className="bg-white rounded-lg shadow p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-900">{owner.contact_name}</h3>
                                        <p className="text-sm text-slate-600">{owner.contact_email}</p>
                                        <p className="text-xs text-slate-500">{owner.operator_name || 'Operadora nao informada'}</p>
                                        <p className="text-xs text-slate-500">
                                            {owner.total_requests} solicitacao(oes) • Ultimo status: {owner.latest_status}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={`/admin/traslados?status=all`}
                                            className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                        >
                                            Ver traslados
                                        </Link>
                                        <Link
                                            href={`/admin/traslados/messages?requestId=TR-${owner.latest_request_id}`}
                                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                            Mensagens
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && pagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-lg bg-white p-4 shadow md:flex-row">
                        <div className="text-sm text-slate-600">
                            Pagina {page} / {pagination.totalPages} • Total: {pagination.total}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page <= 1}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                                disabled={page >= pagination.totalPages}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
                            >
                                Proxima
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
