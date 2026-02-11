'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Application {
    id: number;
    job_id: number;
    candidate_id: number;
    status: string;
    cover_letter: string;
    video_intro_url: string;
    expected_start_date: string;
    salary_expectations_min: number;
    salary_expectations_max: number;
    relocation_willing: boolean;
    applied_at: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    resume_url: string;
    total_flight_hours: number;
    pic_hours: number;
    certifications: string;
    type_ratings: string;
    languages: string;
    availability_date: string;
}

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const { user, token } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchApplications();
    }, [user, router, jobId]);

    const fetchApplications = async () => {
        try {
            const response = await fetch(`/api/career/jobs/${jobId}/applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch applications');
            }

            const data = await response.json();
            setApplications(data.applications || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Erro ao carregar candidaturas');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/business/applications/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update application status');
            }

            // Refresh applications list
            fetchApplications();
            alert('Status atualizado com sucesso');
        } catch (err) {
            console.error('Error updating application status:', err);
            alert('Erro ao atualizar status');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewing: 'bg-blue-100 text-blue-800',
            interview: 'bg-purple-100 text-purple-800',
            offer: 'bg-green-100 text-green-800',
            accepted: 'bg-green-600 text-white',
            rejected: 'bg-red-100 text-red-800'
        };

        const labels: { [key: string]: string } = {
            pending: 'Pendente',
            reviewing: 'Em Revisão',
            interview: 'Entrevista',
            offer: 'Oferta',
            accepted: 'Aceito',
            rejected: 'Rejeitado'
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredApplications = selectedStatus === 'all'
        ? applications
        : applications.filter(app => app.status === selectedStatus);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando candidaturas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => router.push('/business/jobs')}
                        className="text-blue-600 hover:text-blue-700 font-medium mb-2"
                    >
                        ← Voltar às Vagas
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Candidaturas
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {applications.length} {applications.length === 1 ? 'candidatura' : 'candidaturas'} no total
                    </p>
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
                    <div className="flex items-center space-x-4 flex-wrap">
                        <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
                        <div className="flex space-x-2 flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedStatus('all')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Todas ({applications.length})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('pending')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pendentes ({applications.filter(a => a.status === 'pending').length})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('reviewing')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'reviewing'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Revisão ({applications.filter(a => a.status === 'reviewing').length})
                            </button>
                            <button
                                onClick={() => setSelectedStatus('interview')}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedStatus === 'interview'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Entrevista ({applications.filter(a => a.status === 'interview').length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📥</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma candidatura encontrada
                        </h3>
                        <p className="text-gray-600">
                            {selectedStatus === 'all'
                                ? 'Ainda não há candidaturas para esta vaga.'
                                : `Não há candidaturas com status "${selectedStatus}".`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map((app) => (
                            <div
                                key={app.id}
                                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {app.first_name} {app.last_name}
                                            </h3>
                                            {getStatusBadge(app.status)}
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center space-x-4">
                                                <span>📧 {app.email}</span>
                                                {app.phone && <span>📱 {app.phone}</span>}
                                            </div>

                                            {app.total_flight_hours && (
                                                <div className="flex items-center space-x-4">
                                                    <span>✈️ {app.total_flight_hours} horas de voo</span>
                                                    {app.pic_hours && <span>👨‍✈️ {app.pic_hours} horas PIC</span>}
                                                </div>
                                            )}

                                            {app.certifications && (
                                                <div>
                                                    <span className="font-medium">Certificações:</span> {app.certifications}
                                                </div>
                                            )}

                                            {app.type_ratings && (
                                                <div>
                                                    <span className="font-medium">Type Ratings:</span> {app.type_ratings}
                                                </div>
                                            )}

                                            {app.cover_letter && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-medium mb-1">Carta de Apresentação:</p>
                                                    <p className="text-gray-700">{app.cover_letter}</p>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 mt-2">
                                                Candidatura enviada em {new Date(app.applied_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-2 ml-4">
                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition"
                                        >
                                            Ver Detalhes
                                        </button>

                                        {app.resume_url && (
                                            <a
                                                href={app.resume_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition"
                                            >
                                                📄 Currículo
                                            </a>
                                        )}

                                        <select
                                            value={app.status}
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pendente</option>
                                            <option value="reviewing">Em Revisão</option>
                                            <option value="interview">Entrevista</option>
                                            <option value="offer">Oferta</option>
                                            <option value="accepted">Aceito</option>
                                            <option value="rejected">Rejeitado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Detail Modal (optional - could be expanded) */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedApp.first_name} {selectedApp.last_name}
                            </h2>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Email:</p>
                                <p className="text-gray-900">{selectedApp.email}</p>
                            </div>

                            {selectedApp.phone && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Telefone:</p>
                                    <p className="text-gray-900">{selectedApp.phone}</p>
                                </div>
                            )}

                            {selectedApp.total_flight_hours && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Horas de Voo:</p>
                                    <p className="text-gray-900">{selectedApp.total_flight_hours} horas totais, {selectedApp.pic_hours} horas PIC</p>
                                </div>
                            )}

                            {selectedApp.cover_letter && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Carta de Apresentação:</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedApp.cover_letter}</p>
                                </div>
                            )}

                            <div className="pt-4 flex space-x-3">
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                                >
                                    Fechar
                                </button>
                                {selectedApp.resume_url && (
                                    <a
                                        href={selectedApp.resume_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Ver Currículo Completo
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
