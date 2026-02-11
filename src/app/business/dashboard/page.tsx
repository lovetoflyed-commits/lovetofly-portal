'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
    activeJobs: number;
    totalApplications: number;
    pendingReview: number;
    totalViews: number;
    companyName: string;
    companyVerified: boolean;
}

export default function BusinessDashboardPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchDashboardStats();
    }, [user, router]);

    const fetchDashboardStats = async () => {
        try {
            if (!token) {
                setError('Token de autenticação não encontrado');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/business/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Dashboard stats fetch failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Por favor, faça login novamente.');
                } else if (response.status === 403) {
                    setError('Acesso negado. Você precisa ser uma empresa verificada.');
                } else {
                    setError(errorData.message || 'Erro ao carregar estatísticas do painel');
                }
                setLoading(false);
                return;
            }

            const data = await response.json();
            setStats(data.stats);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError('Erro ao carregar estatísticas do painel. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando painel...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Painel Empresarial
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {stats?.companyName || 'Sua Empresa'}
                                {stats?.companyVerified && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ✓ Verificada
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/business/jobs/create')}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            + Publicar Vaga
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Vagas Ativas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.activeJobs || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Candidaturas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.totalApplications || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.pendingReview || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">⏳</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Visualizações</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats?.totalViews || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👁️</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push('/business/jobs/create')}
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-xl">➕</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Publicar Nova Vaga</p>
                                <p className="text-sm text-gray-600">Criar anúncio de emprego</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/business/jobs')}
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-xl">📊</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Gerenciar Vagas</p>
                                <p className="text-sm text-gray-600">Ver todas as vagas</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/business/applications')}
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
                        >
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-xl">📥</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Ver Candidaturas</p>
                                <p className="text-sm text-gray-600">Revisar candidatos</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Company Setup Notice */}
                {!stats?.companyVerified && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                            ⚠️ Empresa Pendente de Verificação
                        </h3>
                        <p className="text-yellow-800 mb-4">
                            Sua empresa está em processo de verificação. Após aprovação, suas vagas terão maior visibilidade.
                        </p>
                        <button
                            onClick={() => router.push('/business/company/profile')}
                            className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
                        >
                            Ver Status da Verificação
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
