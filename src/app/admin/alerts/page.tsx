"use client";

import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Eye, TrendingUp, UserX, XCircle, ArrowLeft } from 'lucide-react';

interface Alert {
    id: number;
    user_id: number;
    user_email: string;
    user_name: string;
    alert_type: string;
    severity: string;
    description: string;
    metadata: any;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    reviewed_by: number | null;
    resolution_notes: string | null;
}

type FilterType = 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed';
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function BadConductAlertsPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const role = user?.role as Role | undefined;

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<FilterType>('pending');
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchAlerts();
        }
    }, [token]);

    useEffect(() => {
        applyFilters();
    }, [alerts, statusFilter, severityFilter]);

    async function fetchAlerts() {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/alerts/bad-conduct', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    }

    function applyFilters() {
        let filtered = [...alerts];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        if (severityFilter !== 'all') {
            filtered = filtered.filter(a => a.severity === severityFilter);
        }

        setFilteredAlerts(filtered);
    }

    function openDetails(alert: Alert) {
        setSelectedAlert(alert);
        setResolutionNotes(alert.resolution_notes || '');
        setShowDetailsModal(true);
    }

    async function handleStatusUpdate(status: 'investigating' | 'resolved' | 'dismissed') {
        if (!token || !selectedAlert) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/alerts/bad-conduct/${selectedAlert.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    resolution_notes: resolutionNotes,
                    reviewed_by: user?.id,
                }),
            });

            if (res.ok) {
                alert('Status atualizado com sucesso!');
                setShowDetailsModal(false);
                await fetchAlerts();
            } else {
                const error = await res.json();
                alert(`Erro: ${error.message || 'Falha ao atualizar status'}`);
            }
        } catch (error) {
            console.error('Error updating alert:', error);
            alert('Erro ao atualizar alerta');
        } finally {
            setActionLoading(false);
        }
    }

    function getSeverityBadge(severity: string) {
        switch (severity) {
            case 'critical':
                return <span className="px-2 py-1 bg-red-700 text-white text-xs rounded font-bold">CRÍTICO</span>;
            case 'high':
                return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Alto</span>;
            case 'medium':
                return <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">Médio</span>;
            case 'low':
                return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">Baixo</span>;
            default:
                return <span className="px-2 py-1 bg-slate-400 text-white text-xs rounded">{severity}</span>;
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded flex items-center gap-1"><AlertTriangle size={12} /> Pendente</span>;
            case 'investigating':
                return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded flex items-center gap-1"><Eye size={12} /> Investigando</span>;
            case 'resolved':
                return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1"><CheckCircle size={12} /> Resolvido</span>;
            case 'dismissed':
                return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded flex items-center gap-1"><XCircle size={12} /> Dispensado</span>;
            default:
                return <span className="px-2 py-1 bg-slate-400 text-white text-xs rounded">{status}</span>;
        }
    }

    function getAlertTypeLabel(alertType: string) {
        const labels: { [key: string]: string } = {
            'multiple_failed_logins': 'Múltiplas Tentativas Falhas de Login',
            'suspicious_activity_pattern': 'Padrão de Atividade Suspeita',
            'rapid_content_creation': 'Criação Rápida de Conteúdo',
            'spam_detected': 'Spam Detectado',
            'policy_violation': 'Violação de Política',
            'multiple_reports': 'Múltiplas Denúncias',
            'account_sharing': 'Compartilhamento de Conta',
            'automated_behavior': 'Comportamento Automatizado',
            'excessive_moderation_actions': 'Ações de Moderação Excessivas',
        };
        return labels[alertType] || alertType;
    }

    if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_system'))) {
        return (
            <div className="text-red-600 p-8">
                <b>Acesso negado &mdash; Alertas de Má Conduta</b>
                <div className="mt-2 text-slate-700">
                    Apenas administradores master e moderadores podem acessar o sistema de alertas.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle size={32} className="text-red-700" />
                    Alertas de Má Conduta
                </h1>
                <p className="text-slate-700 mt-2">Monitoramento automático de comportamentos suspeitos e violações de política.</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={24} className="text-yellow-700" />
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">Pendentes</p>
                            <p className="text-2xl font-bold text-yellow-900">{alerts.filter(a => a.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <Eye size={24} className="text-blue-700" />
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Investigando</p>
                            <p className="text-2xl font-bold text-blue-900">{alerts.filter(a => a.status === 'investigating').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={24} className="text-red-700" />
                        <div>
                            <p className="text-sm text-red-700 font-medium">Alta/Crítica</p>
                            <p className="text-2xl font-bold text-red-900">
                                {alerts.filter(a => ['high', 'critical'].includes(a.severity)).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={24} className="text-green-700" />
                        <div>
                            <p className="text-sm text-green-700 font-medium">Resolvidos</p>
                            <p className="text-2xl font-bold text-green-900">{alerts.filter(a => a.status === 'resolved').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 rounded text-sm ${statusFilter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-3 py-1 rounded text-sm ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Pendentes
                            </button>
                            <button
                                onClick={() => setStatusFilter('investigating')}
                                className={`px-3 py-1 rounded text-sm ${statusFilter === 'investigating' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Investigando
                            </button>
                            <button
                                onClick={() => setStatusFilter('resolved')}
                                className={`px-3 py-1 rounded text-sm ${statusFilter === 'resolved' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Resolvidos
                            </button>
                            <button
                                onClick={() => setStatusFilter('dismissed')}
                                className={`px-3 py-1 rounded text-sm ${statusFilter === 'dismissed' ? 'bg-gray-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Dispensados
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Severidade</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setSeverityFilter('all')}
                                className={`px-3 py-1 rounded text-sm ${severityFilter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setSeverityFilter('critical')}
                                className={`px-3 py-1 rounded text-sm ${severityFilter === 'critical' ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Crítica
                            </button>
                            <button
                                onClick={() => setSeverityFilter('high')}
                                className={`px-3 py-1 rounded text-sm ${severityFilter === 'high' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Alta
                            </button>
                            <button
                                onClick={() => setSeverityFilter('medium')}
                                className={`px-3 py-1 rounded text-sm ${severityFilter === 'medium' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Média
                            </button>
                            <button
                                onClick={() => setSeverityFilter('low')}
                                className={`px-3 py-1 rounded text-sm ${severityFilter === 'low' ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                                Baixa
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Carregando alertas...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b">
                            <tr>
                                <th className="p-3 text-left">Severidade</th>
                                <th className="p-3 text-left">Tipo</th>
                                <th className="p-3 text-left">Usuário</th>
                                <th className="p-3 text-left">Descrição</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Criado em</th>
                                <th className="p-3 text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlerts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-600">
                                        Nenhum alerta encontrado com os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                            {filteredAlerts.map(alert => (
                                <tr key={alert.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3">{getSeverityBadge(alert.severity)}</td>
                                    <td className="p-3 text-sm">{getAlertTypeLabel(alert.alert_type)}</td>
                                    <td className="p-3">
                                        <div className="text-sm">
                                            <p className="font-medium">{alert.user_name}</p>
                                            <p className="text-slate-600 text-xs">{alert.user_email}</p>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm max-w-xs truncate" title={alert.description}>{alert.description}</td>
                                    <td className="p-3">{getStatusBadge(alert.status)}</td>
                                    <td className="p-3 text-sm">{new Date(alert.created_at).toLocaleString('pt-BR')}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => openDetails(alert)}
                                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
                                        >
                                            <Eye size={14} /> Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle size={24} className="text-red-600" />
                            Detalhes do Alerta #{selectedAlert.id}
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Severidade</label>
                                    {getSeverityBadge(selectedAlert.severity)}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Status</label>
                                    {getStatusBadge(selectedAlert.status)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Tipo de Alerta</label>
                                <p className="text-slate-900">{getAlertTypeLabel(selectedAlert.alert_type)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Usuário</label>
                                <p className="text-slate-900">{selectedAlert.user_name}</p>
                                <p className="text-sm text-slate-600">{selectedAlert.user_email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                                <p className="text-slate-900">{selectedAlert.description}</p>
                            </div>

                            {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Dados Adicionais</label>
                                    <div className="bg-slate-100 rounded p-3 text-sm">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedAlert.metadata, null, 2)}</pre>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Criado em</label>
                                <p className="text-slate-900">{new Date(selectedAlert.created_at).toLocaleString('pt-BR')}</p>
                            </div>

                            {selectedAlert.reviewed_at && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Revisado em</label>
                                    <p className="text-slate-900">{new Date(selectedAlert.reviewed_at).toLocaleString('pt-BR')}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notas de Resolução</label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Adicione notas sobre a investigação/resolução..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded"
                                />
                            </div>

                            {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'dismissed' && (
                                <div className="flex gap-2 pt-4 border-t">
                                    {selectedAlert.status === 'pending' && (
                                        <button
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                            disabled={actionLoading}
                                            onClick={() => handleStatusUpdate('investigating')}
                                        >
                                            Marcar como Investigando
                                        </button>
                                    )}
                                    <button
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate('resolved')}
                                    >
                                        Resolver
                                    </button>
                                    <button
                                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate('dismissed')}
                                    >
                                        Dispensar
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="mt-6 w-full bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <div className="text-center mt-8">
                <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 mx-auto">
                    <ArrowLeft size={20} /> Voltar ao Painel Admin
                </button>
            </div>
        </div>
    );
}
