'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Job {
    id: number;
    title: string;
    category: string;
    base_location: string;
    status: string;
    view_count: number;
    application_count: number;
    posted_at: string;
    salary_min_usd: number;
    salary_max_usd: number;
}

export default function BusinessJobsPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchJobs();
    }, [user, router]);

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/career/jobs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch jobs');
            }

            const data = await response.json();
            setJobs(data.jobs || []);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Erro ao carregar vagas');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (jobId: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/career/jobs/${jobId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update job status');
            }

            // Refresh jobs list
            fetchJobs();
        } catch (err) {
            console.error('Error updating job status:', err);
            alert('Erro ao atualizar status da vaga');
        }
    };

    const handleDeleteJob = async (jobId: number) => {
        if (!confirm('Tem certeza que deseja arquivar esta vaga?')) {
            return;
        }

        try {
            const response = await fetch(`/api/career/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete job');
            }

            alert('Vaga arquivada com sucesso');
            fetchJobs();
        } catch (err) {
            console.error('Error deleting job:', err);
            alert('Erro ao arquivar vaga');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            open: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            filled: 'bg-blue-100 text-blue-800',
            'on-hold': 'bg-yellow-100 text-yellow-800',
            archived: 'bg-red-100 text-red-800'
        };

        const labels: { [key: string]: string } = {
            open: 'Aberta',
            closed: 'Fechada',
            filled: 'Preenchida',
            'on-hold': 'Em Espera',
            archived: 'Arquivada'
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.open}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredJobs = selectedStatus === 'all'
        ? jobs
        : jobs.filter(job => job.status === selectedStatus);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando vagas...</p>
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
                            <button
                                onClick={() => router.push('/business/dashboard')}
                                className="text-blue-600 hover:text-blue-700 font-medium mb-2"
                            >
                                ← Voltar ao Painel
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gerenciar Vagas
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {jobs.length} {jobs.length === 1 ? 'vaga' : 'vagas'} no total
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/business/jobs/create')}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            + Nova Vaga
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Todas ({jobs.length})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('open')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'open'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Abertas ({jobs.filter(j => j.status === 'open').length})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('closed')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'closed'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Fechadas ({jobs.filter(j => j.status === 'closed').length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📋</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma vaga encontrada
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {selectedStatus === 'all'
                                ? 'Comece publicando sua primeira vaga de emprego.'
                                : `Você não tem vagas com status "${selectedStatus}".`}
                        </p>
                        {selectedStatus === 'all' && (
                            <button
                                onClick={() => router.push('/business/jobs/create')}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                                Publicar Primeira Vaga
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {job.title}
                                            </h3>
                                            {getStatusBadge(job.status)}
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                                            <span>📍 {job.base_location || 'Localização não especificada'}</span>
                                            <span>📂 {job.category}</span>
                                            {job.salary_min_usd && job.salary_max_usd && (
                                                <span>
                                                    💰 ${job.salary_min_usd.toLocaleString()} - ${job.salary_max_usd.toLocaleString()} USD
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-6 text-sm">
                                            <div className="flex items-center space-x-1">
                                                <span className="text-gray-500">👁️</span>
                                                <span className="text-gray-700 font-medium">{job.view_count}</span>
                                                <span className="text-gray-500">visualizações</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-gray-500">📥</span>
                                                <span className="text-gray-700 font-medium">{job.application_count}</span>
                                                <span className="text-gray-500">candidaturas</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-gray-500">📅</span>
                                                <span className="text-gray-500">
                                                    Publicada em {new Date(job.posted_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => router.push(`/business/jobs/${job.id}/edit`)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                                        >
                                            ✏️ Editar
                                        </button>

                                        {job.status === 'open' && (
                                            <button
                                                onClick={() => handleStatusChange(job.id, 'closed')}
                                                className="px-4 py-2 bg-yellow-100 text-yellow-700 font-medium rounded-lg hover:bg-yellow-200 transition"
                                            >
                                                Fechar
                                            </button>
                                        )}

                                        {job.status === 'closed' && (
                                            <button
                                                onClick={() => handleStatusChange(job.id, 'open')}
                                                className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition"
                                            >
                                                Reabrir
                                            </button>
                                        )}

                                        <button
                                            onClick={() => router.push(`/business/jobs/${job.id}/applications`)}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition"
                                        >
                                            Ver Candidatos
                                        </button>

                                        <button
                                            onClick={() => handleDeleteJob(job.id)}
                                            className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition"
                                            title="Arquivar vaga"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
