'use client';

/**
 * PIX Transaction Monitor Component
 * Real-time monitoring of PIX transactions
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface Transaction {
    id: number;
    userId: string;
    amount: string;
    status: 'pending' | 'completed' | 'expired' | 'failed';
    type: 'membership' | 'booking';
    completedAt: string | null;
    createdAt: string;
}

interface PIXMonitorStats {
    pendingPayments: number;
    completedToday: number;
    revenueToday: string;
    totalRevenue: string;
    expiredPayments: number;
    completedByType: {
        membership: number;
        booking: number;
    };
    recentTransactions: Transaction[];
}

interface PIXTransactionMonitorProps {
    token: string;
}

export const PIXTransactionMonitor: React.FC<PIXTransactionMonitorProps> = ({ token }) => {
    const [stats, setStats] = useState<PIXMonitorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        if (!token) return;

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
                throw new Error('Failed to fetch PIX stats');
            }

            const data = await response.json();
            setStats(data.stats);
        } catch (err: any) {
            console.error('[PIX Monitor] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Carregando...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8 text-slate-500">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Pendentes</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.pendingPayments}</p>
                        </div>
                        <Clock className="h-5 w-5 text-amber-600 opacity-50" />
                    </div>
                </div>

                {/* Completed Today */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Concluídos Hoje</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{stats.completedToday}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600 opacity-50" />
                    </div>
                </div>

                {/* Revenue Today */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Receita Hoje</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                R$ {Number(stats.revenueToday).toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <span className="text-xl">📈</span>
                    </div>
                </div>

                {/* Expired */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Expirados</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">{stats.expiredPayments}</p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-600 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Transações Recentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentTransactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono text-xs text-slate-600">#{tx.id}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${tx.type === 'membership'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {tx.type === 'membership' ? '👤 Membership' : '📅 Booking'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-bold text-slate-900">
                                        R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${tx.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : tx.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : tx.status === 'expired'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {tx.status === 'completed' && '✓ Confirmado'}
                                            {tx.status === 'pending' && '⏳ Pendente'}
                                            {tx.status === 'expired' && '⏰ Expirado'}
                                            {tx.status === 'failed' && '✕ Falhou'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">
                                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PIXTransactionMonitor;
