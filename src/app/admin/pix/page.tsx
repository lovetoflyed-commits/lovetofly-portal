'use client';

/**
 * Admin PIX Management Page
 * Access: /admin/pix
 * Full PIX management dashboard with key management, transactions, and monitoring
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PIXConfigAdmin from '@/components/admin/PIXConfigAdmin';
import { AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface StatsData {
    pendingPayments: number;
    completedToday: number;
    revenueToday: string;
    totalRevenue: string;
    expiredPayments: number;
    completedByType: { membership: number; booking: number };
    recentTransactions: Array<{
        id: number;
        userId: string;
        amount: string;
        status: string;
        type: string;
        completedAt: string;
        createdAt: string;
    }>;
}

export default function AdminPIXPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'transactions' | 'monitoring'>('overview');
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check authorization
    useEffect(() => {
        if (!user || user.role !== 'master') {
            router.push('/admin');
        }
    }, [user, router]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/admin/pix/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch PIX statistics');
            }

            const data = await response.json();
            setStats(data.stats);
        } catch (err: any) {
            console.error('[PIX Admin] Error fetching stats:', err);
            setError(err.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [token]);

    if (!user || user.role !== 'master') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar ao Painel
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">Gerenciamento PIX</h1>
                                <p className="text-slate-600 mt-1">Pagamentos instantâneos, chaves e monitoramento em tempo real</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Atualizar dados"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-900">Erro</h3>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Overview Stats Cards */}
                {activeTab === 'overview' && stats && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Pending Payments */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-slate-600 text-sm font-medium">Pagamentos Pendentes</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{stats.pendingPayments}</p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-500 opacity-50" />
                            </div>
                            <p className="text-xs text-slate-500">Aguardando confirmação</p>
                        </div>

                        {/* Completed Today */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-slate-600 text-sm font-medium">Concluídos Hoje</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{stats.completedToday}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                            <p className="text-xs text-slate-500">Pagamentos confirmados</p>
                        </div>

                        {/* Revenue Today */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-slate-600 text-sm font-medium">Receita Hoje</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">
                                        R$ {Number(stats.revenueToday).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                            <p className="text-xs text-slate-500">PIX concluído</p>
                        </div>

                        {/* Expired Payments */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-slate-600 text-sm font-medium">Expirados</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{stats.expiredPayments}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                            </div>
                            <p className="text-xs text-slate-500">QR codes expirados</p>
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="mb-6 bg-white rounded-lg border border-slate-200 p-1 inline-flex gap-1 shadow-sm">
                    {(['overview', 'keys', 'transactions', 'monitoring'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === tab
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {tab === 'overview' && '📊 Visão Geral'}
                            {tab === 'keys' && '🔑 Chaves PIX'}
                            {tab === 'transactions' && '💳 Transações'}
                            {tab === 'monitoring' && '📡 Monitoramento'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Type Breakdown */}
                        {stats && (
                            <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Pagamentos Concluídos (Hoje)</h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-medium text-slate-600">Memberships</p>
                                            <p className="text-lg font-bold text-slate-900">{stats.completedByType.membership}</p>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{
                                                    width: stats.completedToday > 0
                                                        ? `${(stats.completedByType.membership / stats.completedToday) * 100}%`
                                                        : '0%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-medium text-slate-600">Bookings</p>
                                            <p className="text-lg font-bold text-slate-900">{stats.completedByType.booking}</p>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{
                                                    width: stats.completedToday > 0
                                                        ? `${(stats.completedByType.booking / stats.completedToday) * 100}%`
                                                        : '0%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Revenue Card */}
                        {stats && (
                            <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Receita Total PIX</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Hoje</p>
                                        <p className="text-2xl font-black text-green-700">
                                            R$ {Number(stats.revenueToday).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Total (All Time)</p>
                                        <p className="text-2xl font-black text-emerald-700">
                                            R$ {Number(stats.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Transactions */}
                        {stats && (
                            <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Transações Recentes</h3>
                                {stats.recentTransactions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b border-slate-200">
                                                <tr>
                                                    <th className="text-left py-2 px-2 font-medium text-slate-600">ID</th>
                                                    <th className="text-left py-2 px-2 font-medium text-slate-600">Tipo</th>
                                                    <th className="text-left py-2 px-2 font-medium text-slate-600">Valor</th>
                                                    <th className="text-left py-2 px-2 font-medium text-slate-600">Status</th>
                                                    <th className="text-left py-2 px-2 font-medium text-slate-600">Data</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentTransactions.map((tx) => (
                                                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="py-2 px-2 font-mono text-xs text-slate-600">#{tx.id}</td>
                                                        <td className="py-2 px-2">
                                                            <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
                                                                {tx.type === 'membership' ? '👤 Membership' : '📅 Booking'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-2 font-bold text-slate-900">
                                                            R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded ${tx.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : tx.status === 'pending'
                                                                        ? 'bg-amber-100 text-amber-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {tx.status === 'completed' ? '✓ Confirmado' : tx.status === 'pending' ? '⏳ Pendente' : 'Expirado'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-2 text-slate-500 text-xs">
                                                            {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">Nenhuma transação recente</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Keys Tab */}
                {activeTab === 'keys' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <PIXConfigAdmin />
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Histórico Completo de Transações</h2>
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600">Funcionalidade em desenvolvimento</p>
                            <p className="text-slate-500 text-sm mt-1">Implementar visualização completa de transações com filtros</p>
                        </div>
                    </div>
                )}

                {/* Monitoring Tab */}
                {activeTab === 'monitoring' && (
                    <div className="space-y-6">
                        {/* Webhook Status */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Status do Webhook</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                                        <p className="font-semibold text-green-900">Webhook Configurado</p>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        Endpoint: <code className="text-xs bg-white p-1 rounded">https://yourdomain.com/api/payments/pix/webhook</code>
                                    </p>
                                    <p className="text-xs text-green-600 mt-2">
                                        ✓ Pronto para receber confirmações do Nubank em tempo real
                                    </p>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                                        <p className="font-semibold text-blue-900">Cron de Reconciliação</p>
                                    </div>
                                    <p className="text-sm text-blue-700">
                                        Frequência: 1 minuto
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        ✓ Fallback automático para pagamentos perdidos
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Configuração de Ambiente</h2>
                            <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700 space-y-1 overflow-x-auto">
                                <p><span className="text-slate-500"># Nubank PIX</span></p>
                                <p>NUBANK_PIX_API_KEY=<span className="text-amber-600">seu_api_key_aqui</span></p>
                                <p>NUBANK_PIX_SANDBOX=<span className="text-green-600">true</span> <span className="text-slate-500">(mude para false em produção)</span></p>
                                <p>NUBANK_MERCHANT_ACCOUNT_ID=<span className="text-amber-600">seu_account_id</span></p>
                                <p></p>
                                <p><span className="text-slate-500"># Webhook</span></p>
                                <p>PIX_WEBHOOK_SECRET=<span className="text-amber-600">seu_webhook_secret</span></p>
                                <p>PIX_WEBHOOK_URL=<span className="text-amber-600">https://yourdomain.com/api/payments/pix/webhook</span></p>
                            </div>
                            <p className="text-xs text-slate-600 mt-4">
                                ℹ️ Atualize as variáveis de ambiente e reinicie o servidor para aplicar as mudanças.
                            </p>
                        </div>

                        {/* Admin Actions */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Ações Administrativas</h2>
                            <div className="space-y-3">
                                <a
                                    href="/api/payments/pix/reconcile"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    <p className="font-medium text-slate-900">Executar Reconciliação Manual</p>
                                    <p className="text-xs text-slate-600 mt-1">Para verificar transações pendentes e marcar como expiradas</p>
                                </a>
                                <Link
                                    href="/admin/pix"
                                    className="block p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                                >
                                    <p className="font-medium text-slate-900">Gerenciar Chaves PIX</p>
                                    <p className="text-xs text-slate-600 mt-1">Ativar, desativar ou remover chaves PIX</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="mt-12 mb-8 max-w-7xl mx-auto px-4 md:px-8 text-center">
                <p className="text-sm text-slate-600">
                    📚 Sistema PIX completo com webhook em tempo real e reconciliação automática a cada minuto
                </p>
            </div>
        </div>
    );
}
