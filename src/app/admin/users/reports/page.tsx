'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    LineChart,
    Line
} from 'recharts';
import {
    exportUsersToCSV,
    exportUsersToPDF,
    exportUsersToXLSX,
    generateUsersPrintReport,
    UserReportRow
} from '@/utils/userReportExport';

interface ReportResponse {
    users: UserReportRow[];
    generatedAt: string;
    limit: number;
}

const STATUS_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

const staffRoles = new Set([
    'master',
    'admin',
    'operations_lead',
    'support_lead',
    'content_manger',
    'finance_manager',
    'marketing',
    'compliance',
    'staff'
]);

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('pt-BR');
};

const buildFiltersLabel = (filters: ReportFilters) => {
    const labels: string[] = [];
    if (filters.q) labels.push(`Busca: ${filters.q}`);
    if (filters.role) labels.push(`Role: ${filters.role}`);
    if (filters.plan) labels.push(`Plano: ${filters.plan}`);
    if (filters.userType) labels.push(`Tipo: ${filters.userType}`);
    if (filters.verified) labels.push(`Verificado: ${filters.verified === 'true' ? 'Sim' : 'Nao'}`);
    if (filters.accessLevel) labels.push(`Status: ${filters.accessLevel}`);
    if (filters.status) labels.push(`Moderacao: ${filters.status}`);
    if (filters.dateFrom || filters.dateTo) {
        labels.push(`Periodo: ${filters.dateFrom || '...'} ate ${filters.dateTo || '...'}`);
    }
    if (filters.customFilters) labels.push(`Customizado: ${filters.customFilters}`);
    return labels.join(' | ');
};

interface ReportFilters {
    q: string;
    role: string;
    plan: string;
    userType: string;
    verified: string;
    accessLevel: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    customFilters: string;
    limit: string;
}

const defaultFilters: ReportFilters = {
    q: '',
    role: '',
    plan: '',
    userType: '',
    verified: '',
    accessLevel: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    customFilters: '',
    limit: '1000'
};

const buildQuery = (filters: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.role) params.set('role', filters.role);
    if (filters.plan) params.set('plan', filters.plan);
    if (filters.userType) params.set('userType', filters.userType);
    if (filters.verified) params.set('verified', filters.verified);
    if (filters.accessLevel) params.set('accessLevel', filters.accessLevel);
    if (filters.status) params.set('status', filters.status);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.customFilters) params.set('customFilters', filters.customFilters);
    if (filters.limit) params.set('limit', filters.limit);
    return params.toString();
};

const computeSummary = (rows: UserReportRow[]) => {
    const summary = {
        total: rows.length,
        verified: 0,
        business: 0,
        staff: 0,
        banned: 0,
        suspended: 0,
        warned: 0,
        inactive30: 0
    };

    rows.forEach((row) => {
        if (row.user_type_verified) summary.verified += 1;
        if (row.user_type === 'business') summary.business += 1;
        if (row.role && staffRoles.has(row.role.toLowerCase())) summary.staff += 1;
        if (row.is_banned) summary.banned += 1;
        if (row.access_level === 'suspended') summary.suspended += 1;
        if ((row.active_warnings || 0) > 0 || (row.active_strikes || 0) > 0) summary.warned += 1;
        if ((row.days_inactive || 0) > 30) summary.inactive30 += 1;
    });

    return summary;
};

const groupByField = (rows: UserReportRow[], field: keyof UserReportRow, labelFallback = 'N/A') => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
        const raw = row[field];
        const key = raw ? String(raw) : labelFallback;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

const groupByMonth = (rows: UserReportRow[]) => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
        if (!row.created_at) return;
        const date = new Date(row.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([month, total]) => ({ month, total }));
};

export default function AdminUserReportsPage() {
    const { token } = useAuth();
    const [filters, setFilters] = useState<ReportFilters>({ ...defaultFilters });
    const [compareFilters, setCompareFilters] = useState<ReportFilters>({ ...defaultFilters });
    const [compareEnabled, setCompareEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [comparison, setComparison] = useState<ReportResponse | null>(null);

    const fetchReport = async (activeFilters: ReportFilters) => {
        const query = buildQuery(activeFilters);
        const res = await fetch(`/api/admin/users/reports?${query}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Erro ao gerar relatorio');
        }
        return (await res.json()) as ReportResponse;
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const mainReport = await fetchReport(filters);
            setReport(mainReport);

            if (compareEnabled) {
                const compareReport = await fetchReport(compareFilters);
                setComparison(compareReport);
            } else {
                setComparison(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar relatorio');
        } finally {
            setLoading(false);
        }
    };

    const summary = useMemo(() => computeSummary(report?.users || []), [report?.users]);
    const compareSummary = useMemo(() => computeSummary(comparison?.users || []), [comparison?.users]);

    const chartsData = useMemo(() => {
        const rows = report?.users || [];
        return {
            byPlan: groupByField(rows, 'plan', 'N/A'),
            byRole: groupByField(rows, 'role', 'N/A'),
            byType: groupByField(rows, 'user_type', 'N/A'),
            byStatus: groupByField(rows, 'access_level', 'active'),
            byMonth: groupByMonth(rows)
        };
    }, [report?.users]);

    const handleExport = (type: 'pdf' | 'csv' | 'xlsx' | 'print') => {
        if (!report) return;
        const filtersLabel = buildFiltersLabel(filters);
        const exportData = {
            title: 'Relatorio de Usuarios',
            generatedAt: report.generatedAt,
            filtersLabel,
            rows: report.users,
            summary
        };

        if (type === 'pdf') exportUsersToPDF(exportData);
        if (type === 'csv') exportUsersToCSV(exportData);
        if (type === 'xlsx') exportUsersToXLSX(exportData);
        if (type === 'print') {
            const html = generateUsersPrintReport(exportData);
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    return (
        <div className="max-w-full mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-green-900">Relatorio de Usuarios</h1>
                    <p className="text-sm text-slate-600">Filtros, exportacao, graficos e comparacoes.</p>
                </div>
                <Link
                    href="/admin/users"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                    ← Voltar para Usuarios
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input
                        value={filters.q}
                        onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                        placeholder="Busca por nome ou email"
                        className="px-3 py-2 border rounded"
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Role (todos)</option>
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                        <option value="master">Master</option>
                        <option value="staff">Staff</option>
                        <option value="operations_lead">Operacoes</option>
                        <option value="support_lead">Suporte</option>
                    </select>
                    <select
                        value={filters.plan}
                        onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Plano (todos)</option>
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="pro">Pro</option>
                    </select>
                    <select
                        value={filters.userType}
                        onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Tipo (todos)</option>
                        <option value="individual">Pessoa Fisica</option>
                        <option value="business">Pessoa Juridica</option>
                        <option value="staff">Staff</option>
                    </select>
                    <select
                        value={filters.verified}
                        onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Verificacao (todos)</option>
                        <option value="true">Verificados</option>
                        <option value="false">Nao verificados</option>
                    </select>
                    <select
                        value={filters.accessLevel}
                        onChange={(e) => setFilters({ ...filters, accessLevel: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Status (todos)</option>
                        <option value="active">Ativo</option>
                        <option value="warning">Aviso</option>
                        <option value="restricted">Restrito</option>
                        <option value="suspended">Suspenso</option>
                        <option value="banned">Banido</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Moderacao (todos)</option>
                        <option value="active">Ativos</option>
                        <option value="banned">Banidos</option>
                        <option value="suspended">Suspensos</option>
                        <option value="warned">Com advertencia</option>
                        <option value="inactive">Inativos 30d+</option>
                        <option value="never">Nunca logou</option>
                    </select>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="px-3 py-2 border rounded"
                        placeholder="Data inicial"
                    />
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="px-3 py-2 border rounded"
                        placeholder="Data final"
                    />
                    <input
                        type="text"
                        value={filters.customFilters}
                        onChange={(e) => setFilters({ ...filters, customFilters: e.target.value })}
                        className="px-3 py-2 border rounded"
                        placeholder="campo:valor;campo2:valor2"
                        title="Sintaxe: fieldname:value;fieldname2:value2 (ex: business_name:Acme;verification_status:approved)"
                    />
                    <input
                        type="number"
                        min={1}
                        max={5000}
                        value={filters.limit}
                        onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                        className="px-3 py-2 border rounded"
                        placeholder="Limite"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                        disabled={loading}
                    >
                        {loading ? 'Gerando...' : 'Gerar Relatorio'}
                    </button>
                    <button
                        onClick={() => setFilters({ ...defaultFilters })}
                        className="px-4 py-2 border rounded-lg text-slate-700"
                    >
                        Limpar filtros
                    </button>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={compareEnabled}
                            onChange={(e) => setCompareEnabled(e.target.checked)}
                        />
                        Comparar com outro filtro
                    </label>
                </div>
            </div>

            {compareEnabled && (
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Filtros de Comparacao</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <input
                            value={compareFilters.q}
                            onChange={(e) => setCompareFilters({ ...compareFilters, q: e.target.value })}
                            placeholder="Busca por nome ou email"
                            className="px-3 py-2 border rounded"
                        />
                        <select
                            value={compareFilters.role}
                            onChange={(e) => setCompareFilters({ ...compareFilters, role: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Role (todos)</option>
                            <option value="user">Usuario</option>
                            <option value="admin">Admin</option>
                            <option value="master">Master</option>
                            <option value="staff">Staff</option>
                            <option value="operations_lead">Operacoes</option>
                            <option value="support_lead">Suporte</option>
                        </select>
                        <select
                            value={compareFilters.plan}
                            onChange={(e) => setCompareFilters({ ...compareFilters, plan: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Plano (todos)</option>
                            <option value="free">Free</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="pro">Pro</option>
                        </select>
                        <select
                            value={compareFilters.userType}
                            onChange={(e) => setCompareFilters({ ...compareFilters, userType: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Tipo (todos)</option>
                            <option value="individual">Pessoa Fisica</option>
                            <option value="business">Pessoa Juridica</option>
                            <option value="staff">Staff</option>
                        </select>
                        <select
                            value={compareFilters.verified}
                            onChange={(e) => setCompareFilters({ ...compareFilters, verified: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Verificacao (todos)</option>
                            <option value="true">Verificados</option>
                            <option value="false">Nao verificados</option>
                        </select>
                        <select
                            value={compareFilters.accessLevel}
                            onChange={(e) => setCompareFilters({ ...compareFilters, accessLevel: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Status (todos)</option>
                            <option value="active">Ativo</option>
                            <option value="warning">Aviso</option>
                            <option value="restricted">Restrito</option>
                            <option value="suspended">Suspenso</option>
                            <option value="banned">Banido</option>
                        </select>
                        <select
                            value={compareFilters.status}
                            onChange={(e) => setCompareFilters({ ...compareFilters, status: e.target.value })}
                            className="px-3 py-2 border rounded"
                        >
                            <option value="">Moderacao (todos)</option>
                            <option value="active">Ativos</option>
                            <option value="banned">Banidos</option>
                            <option value="suspended">Suspensos</option>
                            <option value="warned">Com advertencia</option>
                            <option value="inactive">Inativos 30d+</option>
                            <option value="never">Nunca logou</option>
                        </select>
                        <input
                            type="date"
                            value={compareFilters.dateFrom}
                            onChange={(e) => setCompareFilters({ ...compareFilters, dateFrom: e.target.value })}
                            className="px-3 py-2 border rounded"
                            placeholder="Data inicial"
                        />
                        <input
                            type="date"
                            value={compareFilters.dateTo}
                            onChange={(e) => setCompareFilters({ ...compareFilters, dateTo: e.target.value })}
                            className="px-3 py-2 border rounded"
                            placeholder="Data final"
                        />
                        <input
                            type="text"
                            value={compareFilters.customFilters}
                            onChange={(e) => setCompareFilters({ ...compareFilters, customFilters: e.target.value })}
                            className="px-3 py-2 border rounded"
                            placeholder="campo:valor;campo2:valor2"
                            title="Sintaxe: fieldname:value;fieldname2:value2"
                        />
                        <input
                            type="number"
                            min={1}
                            max={5000}
                            value={compareFilters.limit}
                            onChange={(e) => setCompareFilters({ ...compareFilters, limit: e.target.value })}
                            className="px-3 py-2 border rounded"
                            placeholder="Limite"
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded mb-6">{error}</div>
            )}

            {report && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Resumo do Relatorio</h2>
                                <p className="text-sm text-slate-500">Gerado em {formatDate(report.generatedAt)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="px-3 py-2 bg-slate-900 text-white rounded"
                                >
                                    Exportar PDF
                                </button>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="px-3 py-2 bg-blue-600 text-white rounded"
                                >
                                    Exportar CSV
                                </button>
                                <button
                                    onClick={() => handleExport('xlsx')}
                                    className="px-3 py-2 bg-emerald-600 text-white rounded"
                                >
                                    Exportar XLSX
                                </button>
                                <button
                                    onClick={() => handleExport('print')}
                                    className="px-3 py-2 border rounded"
                                >
                                    Imprimir
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Total</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Verificados</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.verified}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Empresas</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.business}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Staff</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.staff}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Banidos</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.banned}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Suspensos</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.suspended}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Com Advertencia</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.warned}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-sm text-slate-500">Inativos 30d+</p>
                                <p className="text-2xl font-bold text-slate-800">{summary.inactive30}</p>
                            </div>
                        </div>
                    </div>

                    {compareEnabled && comparison && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Comparacao</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-700 mb-2">Relatorio Principal</h3>
                                    <p className="text-sm">Total: {summary.total}</p>
                                    <p className="text-sm">Verificados: {summary.verified}</p>
                                    <p className="text-sm">Empresas: {summary.business}</p>
                                    <p className="text-sm">Staff: {summary.staff}</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-700 mb-2">Comparacao</h3>
                                    <p className="text-sm">Total: {compareSummary.total}</p>
                                    <p className="text-sm">Verificados: {compareSummary.verified}</p>
                                    <p className="text-sm">Empresas: {compareSummary.business}</p>
                                    <p className="text-sm">Staff: {compareSummary.staff}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-semibold text-slate-700 mb-4">Usuarios por Plano</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={chartsData.byPlan}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-semibold text-slate-700 mb-4">Usuarios por Tipo</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={chartsData.byType} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                                        {chartsData.byType.map((entry, index) => (
                                            <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-semibold text-slate-700 mb-4">Usuarios por Status</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={chartsData.byStatus}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="font-semibold text-slate-700 mb-4">Cadastros por Mes</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartsData.byMonth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-semibold text-slate-700 mb-4">Resultados</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-2 text-left">Nome</th>
                                        <th className="p-2 text-left">Email</th>
                                        <th className="p-2 text-left">Tipo</th>
                                        <th className="p-2 text-left">Role</th>
                                        <th className="p-2 text-left">Plano</th>
                                        <th className="p-2 text-left">Status</th>
                                        <th className="p-2 text-left">Verificado</th>
                                        <th className="p-2 text-left">Ultima Atividade</th>
                                        <th className="p-2 text-left">Criado em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.users.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="p-2 font-medium text-slate-800">{row.name}</td>
                                            <td className="p-2 text-slate-600">{row.email}</td>
                                            <td className="p-2">{row.user_type || '-'}</td>
                                            <td className="p-2">{row.role || '-'}</td>
                                            <td className="p-2">{row.plan || '-'}</td>
                                            <td className="p-2">{row.access_level || 'active'}</td>
                                            <td className="p-2">{row.user_type_verified ? 'Sim' : 'Nao'}</td>
                                            <td className="p-2">{formatDate(row.last_activity_at || null)}</td>
                                            <td className="p-2">{formatDate(row.created_at || null)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
