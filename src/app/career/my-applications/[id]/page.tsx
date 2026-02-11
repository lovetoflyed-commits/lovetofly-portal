'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface Application {
    id: number;
    jobId: number;
    jobTitle: string;
    description: string;
    candidateId: string;
    status: string;
    coverLetter: string | null;
    videoIntroUrl: string | null;
    expectedStartDate: string | null;
    salaryExpectationsMin: number | null;
    salaryExpectationsMax: number | null;
    relocationWilling: boolean;
    screeningNotes: string | null;
    interviewScheduledAt: string | null;
    interviewCompletedAt: string | null;
    simulatorCheckScheduledAt: string | null;
    simulatorCheckCompletedAt: string | null;
    offerExtendedAt: string | null;
    offerAcceptedAt: string | null;
    recruiterScore: number | null;
    chiefPilotScore: number | null;
    cultureFitScore: number | null;
    rejectionReason: string | null;
    rejectionDetails: string | null;
    withdrawnReason: string | null;
    credentialMatchPercentage: number | null;
    isFlagged: boolean;
    isRecommended: boolean;
    createdAt: string;
    updatedAt: string;
    appliedAt: string;
    companyName: string;
    companyLogoUrl: string | null;
    companyLocation: string;
    salaryMin: number | null;
    salaryMax: number | null;
}

interface ApplicationParams {
    id: string;
}

export default function ApplicationDetailPage({ params }: { params: ApplicationParams }) {
    const router = useRouter();
    const { user, token } = useAuth();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchApplication = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/career/applications/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Candidatura não encontrada');
                    } else {
                        setError('Erro ao carregar candidatura');
                    }
                    return;
                }

                const data = await response.json();
                setApplication(data.data);
                setNewStatus(data.data.status);
            } catch (err) {
                console.error('Error fetching application:', err);
                setError('Erro ao carregar candidatura');
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [params.id, token, router]);

    const handleStatusUpdate = async () => {
        if (!application || !newStatus || newStatus === application.status) {
            return;
        }

        try {
            setUpdatingStatus(true);
            const response = await fetch(`/api/career/applications/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                alert('Erro ao atualizar status');
                return;
            }

            const data = await response.json();
            setApplication(data.data);
            alert('Status atualizado com sucesso');
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm('Tem certeza que deseja desistir desta candidatura? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            setUpdatingStatus(true);
            const response = await fetch(`/api/career/applications/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: 'withdrawn',
                    withdrawnReason: 'Candidato desistiu',
                }),
            });

            if (!response.ok) {
                alert('Erro ao desistir da candidatura');
                return;
            }

            alert('Você desistiu da candidatura com sucesso');
            router.push('/career/my-applications');
        } catch (err) {
            console.error('Error withdrawing application:', err);
            alert('Erro ao desistir da candidatura');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied':
                return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Candidatura Enviada' };
            case 'screening':
                return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Em Análise' };
            case 'interview':
                return { bg: 'bg-green-100', text: 'text-green-800', label: 'Entrevista Marcada' };
            case 'simulator':
                return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Check do Simulador' };
            case 'offer':
                return { bg: 'bg-lime-100', text: 'text-lime-800', label: 'Oferta Estendida' };
            case 'hired':
                return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Contratado' };
            case 'rejected':
                return { bg: 'bg-red-100', text: 'text-red-800', label: 'Recusado' };
            case 'withdrawn':
                return { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Desistência' };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-800', label: status };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Não informado';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 text-lg mb-4">Você precisa estar autenticado</p>
                    <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                        Fazer Login
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
                <Sidebar onFeatureClick={() => { }} disabled={false} />
                <div className="flex-1 px-4 py-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Carregando candidatura...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
                <Sidebar onFeatureClick={() => { }} disabled={false} />
                <div className="flex-1 px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                            <p className="text-red-700 text-lg mb-4">{error || 'Candidatura não encontrada'}</p>
                            <Link
                                href="/career/my-applications"
                                className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold"
                            >
                                ← Voltar para Minhas Candidaturas
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusColor(application.status);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
            <Sidebar onFeatureClick={() => { }} disabled={false} />

            <div className="flex-1 px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <Link
                                href="/career/my-applications"
                                className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block"
                            >
                                ← Voltar para Minhas Candidaturas
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900 mb-2">{application.jobTitle}</h1>
                            <p className="text-lg text-slate-600">{application.companyName}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full font-bold text-sm ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                        </span>
                    </div>

                    {/* Status Update */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">📊 Status da Candidatura</h2>
                        <div className="flex items-center gap-4 flex-wrap">
                            <select
                                value={newStatus || ''}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                                <option value="applied">Candidatura Enviada</option>
                                <option value="screening">Em Análise</option>
                                <option value="interview">Entrevista Marcada</option>
                                <option value="simulator">Check do Simulador</option>
                                <option value="offer">Oferta Estendida</option>
                                <option value="hired">Contratado</option>
                                <option value="rejected">Recusado</option>
                                <option value="withdrawn">Desistência</option>
                            </select>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={updatingStatus || newStatus === application.status}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingStatus ? 'Atualizando...' : 'Atualizar Status'}
                            </button>
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">VAGA</h3>
                                <p className="text-xl font-bold text-slate-900">{application.jobTitle}</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">EMPRESA</h3>
                                <p className="text-xl font-bold text-slate-900">{application.companyName}</p>
                                {application.companyLocation && (
                                    <p className="text-sm text-slate-600 mt-1">📍 {application.companyLocation}</p>
                                )}
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">FAIXA SALARIAL</h3>
                                <p className="text-xl font-bold text-slate-900">
                                    R$ {application.salaryMin?.toLocaleString('pt-BR')} - R$ {application.salaryMax?.toLocaleString('pt-BR')}
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">DATA DE APLICAÇÃO</h3>
                                <p className="text-lg font-bold text-slate-900">{formatDate(application.appliedAt)}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {application.expectedStartDate && (
                                <div className="bg-white border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-sm font-semibold text-slate-600 mb-2">DATA DE INÍCIO ESPERADA</h3>
                                    <p className="text-lg font-bold text-slate-900">{formatDate(application.expectedStartDate)}</p>
                                </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">DISPONIBILIDADE PARA MUDANÇA</h3>
                                <p className="text-lg font-bold text-slate-900">
                                    {application.relocationWilling ? '✅ Sim' : '❌ Não'}
                                </p>
                            </div>

                            {application.credentialMatchPercentage !== null && (
                                <div className="bg-white border border-slate-200 rounded-lg p-6">
                                    <h3 className="text-sm font-semibold text-slate-600 mb-2">COMPATIBILIDADE DE PERFIL</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="w-full bg-slate-200 rounded-full h-3">
                                                <div
                                                    className="bg-green-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${application.credentialMatchPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="text-xl font-bold text-slate-900">{application.credentialMatchPercentage}%</span>
                                    </div>
                                </div>
                            )}

                            {application.isRecommended && (
                                <div className="bg-lime-50 border border-lime-200 rounded-lg p-6">
                                    <p className="text-lime-800 font-semibold">⭐ Candidato Recomendado</p>
                                </div>
                            )}

                            {application.isFlagged && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                                    <p className="text-orange-800 font-semibold">🚩 Candidatura Marcada</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interview Timeline */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">📅 Linha do Tempo</h2>
                        <div className="space-y-4">
                            {application.interviewScheduledAt && (
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    <span className="text-2xl">🗓️</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Entrevista Agendada</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.interviewScheduledAt)}</p>
                                    </div>
                                </div>
                            )}
                            {application.interviewCompletedAt && (
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Entrevista Realizada</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.interviewCompletedAt)}</p>
                                    </div>
                                </div>
                            )}
                            {application.simulatorCheckScheduledAt && (
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    <span className="text-2xl">✈️</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Check do Simulador Agendado</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.simulatorCheckScheduledAt)}</p>
                                    </div>
                                </div>
                            )}
                            {application.simulatorCheckCompletedAt && (
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Check do Simulador Realizado</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.simulatorCheckCompletedAt)}</p>
                                    </div>
                                </div>
                            )}
                            {application.offerExtendedAt && (
                                <div className="flex gap-4 pb-4 border-b border-slate-200">
                                    <span className="text-2xl">💼</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Oferta Estendida</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.offerExtendedAt)}</p>
                                    </div>
                                </div>
                            )}
                            {application.offerAcceptedAt && (
                                <div className="flex gap-4">
                                    <span className="text-2xl">🎉</span>
                                    <div>
                                        <p className="font-semibold text-slate-900">Oferta Aceita</p>
                                        <p className="text-sm text-slate-600">{formatDate(application.offerAcceptedAt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Application Documents */}
                    {(application.coverLetter || application.videoIntroUrl) && (
                        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">📄 Documentos da Candidatura</h2>
                            <div className="space-y-4">
                                {application.coverLetter && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-900 mb-2">Carta de Apresentação</p>
                                        <p className="text-slate-700 whitespace-pre-wrap">{application.coverLetter}</p>
                                    </div>
                                )}
                                {application.videoIntroUrl && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-slate-900 mb-2">Vídeo de Apresentação</p>
                                        <a
                                            href={application.videoIntroUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-semibold break-all"
                                        >
                                            {application.videoIntroUrl}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Scores */}
                    {(application.recruiterScore || application.chiefPilotScore || application.cultureFitScore) && (
                        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">⭐ Avaliações</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {application.recruiterScore && (
                                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                                        <p className="font-semibold text-slate-900 mb-2">Avaliação de RH</p>
                                        <div className="text-3xl font-bold text-blue-600">{application.recruiterScore}/10</div>
                                    </div>
                                )}
                                {application.chiefPilotScore && (
                                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                                        <p className="font-semibold text-slate-900 mb-2">Avaliação Técnica</p>
                                        <div className="text-3xl font-bold text-purple-600">{application.chiefPilotScore}/10</div>
                                    </div>
                                )}
                                {application.cultureFitScore && (
                                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                                        <p className="font-semibold text-slate-900 mb-2">Encaixe Cultura</p>
                                        <div className="text-3xl font-bold text-green-600">{application.cultureFitScore}/10</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Rejection Details */}
                    {application.status === 'rejected' && (application.rejectionReason || application.rejectionDetails) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-bold text-red-800 mb-4">❌ Motivo da Recusa</h2>
                            {application.rejectionReason && (
                                <p className="font-semibold text-red-800 mb-2">{application.rejectionReason}</p>
                            )}
                            {application.rejectionDetails && (
                                <p className="text-red-700 whitespace-pre-wrap">{application.rejectionDetails}</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">🎯 Ações</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    /* TODO: Implement messaging feature */
                                    alert('Funcionalidade de mensagem em desenvolvimento');
                                }}
                                className="px-6 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-bold transition"
                            >
                                📧 Enviar Mensagem
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={updatingStatus}
                                className="px-6 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingStatus ? 'Desistindo...' : '❌ Desistir da Candidatura'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
