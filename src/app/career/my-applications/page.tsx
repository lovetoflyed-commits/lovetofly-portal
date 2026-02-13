'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface Application {
  id: number;
  jobTitle: string;
  companyName: string;
  salaryMin: number | null;
  salaryMax: number | null;
  appliedAt: string;
  status: string;
  credentialMatchPercentage: number | null;
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/career/applications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setError('Erro ao carregar candidaturas');
          return;
        }

        const data = await response.json();
        // Transform API response to match the expected format
        const transformedApplications = data.data.map((app: any) => ({
          id: app.id,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
          salaryMin: app.salaryMin,
          salaryMax: app.salaryMax,
          appliedAt: app.appliedAt,
          status: convertStatusToPortuguese(app.status),
          credentialMatchPercentage: app.credentialMatchPercentage,
        }));
        setApplications(transformedApplications);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Erro ao carregar candidaturas');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token]);

  const convertStatusToPortuguese = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      applied: 'Recebida',
      screening: 'Em Análise',
      interview: 'Entrevista Marcada',
      simulator: 'Check Simulador',
      offer: 'Oferta Estendida',
      hired: 'Contratado',
      rejected: 'Recusado',
      withdrawn: 'Desistência',
    };
    return statusMap[status] || status;
  };

  const getStageFromStatus = (status: string): number => {
    const stageMap: { [key: string]: number } = {
      'Recebida': 1,
      'Em Análise': 2,
      'Entrevista Marcada': 3,
      'Check Simulador': 3,
      'Oferta Estendida': 4,
      'Contratado': 4,
      'Recusado': 1,
      'Desistência': 1,
    };
    return stageMap[status] || 1;
  };

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entrevista Marcada':
        return 'bg-green-100 text-green-800';
      case 'Em Análise':
        return 'bg-blue-100 text-blue-800';
      case 'Recebida':
        return 'bg-yellow-100 text-yellow-800';
      case 'Recusado':
        return 'bg-red-100 text-red-800';
      case 'Contratado':
        return 'bg-emerald-100 text-emerald-800';
      case 'Oferta Estendida':
        return 'bg-lime-100 text-lime-800';
      case 'Check Simulador':
        return 'bg-orange-100 text-orange-800';
      case 'Desistência':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStageIcon = (stage: number) => {
    const stages = ['📝', '👁️', '💬', '✅'];
    return stages[stage - 1] || '❓';
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Confidencial';
    if (min && max) {
      return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`;
    }
    return `R$ ${(min || max)?.toLocaleString('pt-BR')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleOpenMessageModal = (app: Application) => {
    setSelectedApplication(app);
    setMessageSubject(`Sobre minha candid atura para ${app.jobTitle}`);
    setMessageContent('');
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!token || !selectedApplication) return;

    if (!messageSubject.trim() || !messageContent.trim()) {
      alert('Por favor, preencha o assunto e a mensagem.');
      return;
    }

    setSendingMessage(true);
    try {
      // First, get company/job information to find the recipient
      const jobResponse = await fetch(`/api/career/applications/${selectedApplication.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!jobResponse.ok) {
        throw new Error('Não foi possível obter informações da vaga');
      }

      const jobData = await jobResponse.json();
      const companyUserId = jobData.data?.company_user_id;

      if (!companyUserId) {
        throw new Error('Não foi possível identificar o destinatário');
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: companyUserId,
          module: 'career',
          subject: messageSubject,
          message: messageContent,
          priority: 'normal',
          relatedEntityType: 'job_application',
          relatedEntityId: selectedApplication.id,
        }),
      });

      if (response.ok) {
        alert('Mensagem enviada com sucesso!');
        setShowMessageModal(false);
        setMessageSubject('');
        setMessageContent('');
        setSelectedApplication(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Não foi possível enviar a mensagem.');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
      <Sidebar onFeatureClick={() => { }} disabled={false} />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">📋 Minhas Candidaturas</h1>
              <p className="text-lg text-slate-600">Acompanhe o status das suas aplicações</p>
            </div>
            <Link href="/career" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold">
              ← Voltar
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-bold transition ${filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Todas ({applications.length})
            </button>
            <button
              onClick={() => setFilterStatus('Recebida')}
              className={`px-4 py-2 rounded-lg font-bold transition ${filterStatus === 'Recebida'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Recebida ({applications.filter(a => a.status === 'Recebida').length})
            </button>
            <button
              onClick={() => setFilterStatus('Em Análise')}
              className={`px-4 py-2 rounded-lg font-bold transition ${filterStatus === 'Em Análise'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Em Análise ({applications.filter(a => a.status === 'Em Análise').length})
            </button>
            <button
              onClick={() => setFilterStatus('Entrevista Marcada')}
              className={`px-4 py-2 rounded-lg font-bold transition ${filterStatus === 'Entrevista Marcada'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Entrevista ({applications.filter(a => a.status === 'Entrevista Marcada').length})
            </button>
          </div>

          {/* Applications List */}
          {user ? (
            <div className="space-y-4">
              {loading ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 text-lg">Carregando candidaturas...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center">
                  <p className="text-red-700 text-lg mb-4">{error}</p>
                  <Link
                    href="/career/jobs"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                  >
                    Ver Vagas Disponíveis
                  </Link>
                </div>
              ) : filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{getStageIcon(getStageFromStatus(app.status))}</span>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{app.jobTitle}</h3>
                              <p className="text-sm text-slate-600">{app.companyName}</p>
                            </div>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">SALÁRIO</p>
                          <p className="font-bold text-slate-900">{formatSalary(app.salaryMin, app.salaryMax)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">DATA DE APLICAÇÃO</p>
                          <p className="font-bold text-slate-900">{formatDate(app.appliedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">COMPATIBILIDADE</p>
                          <p className="font-bold text-blue-600">
                            {app.credentialMatchPercentage ? `${app.credentialMatchPercentage}%` : 'Pendente'}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-2">
                          <span>Progresso do Processo</span>
                          <span>{getStageFromStatus(app.status)}/4</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(getStageFromStatus(app.status) / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenMessageModal(app)}
                          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-bold transition"
                        >
                          📧 Enviar Mensagem
                        </button>
                        <button
                          onClick={() => router.push(`/career/my-applications/${app.id}`)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold transition"
                        >
                          📄 Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
                  <p className="text-slate-600 text-lg mb-4">Nenhuma candidatura com esse status</p>
                  <Link
                    href="/career/jobs"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                  >
                    Ver Vagas Disponíveis
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
              <p className="text-slate-600 text-lg mb-4">Você precisa estar autenticado para acessar suas candidaturas</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
              >
                Fazer Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-900">Enviar Mensagem à Empresa</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                  disabled={sendingMessage}
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Enviando para: <span className="font-bold">{selectedApplication.companyName}</span>
              </p>
              <p className="text-sm text-slate-600">
                Referente à: <span className="font-bold">{selectedApplication.jobTitle}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre o processo seletivo"
                  maxLength={255}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageSubject.length}/255 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem...\n\nEx: Olá, gostaria de obter mais informações sobre o processo seletivo e próximas etapas."
                  rows={8}
                  maxLength={10000}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {messageContent.length}/10000 caracteres
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <span className="font-bold">Dica:</span> Seja profissional e objetivo. Evite enviar múltiplas mensagens sobre a mesma dúvida.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition"
                disabled={sendingMessage}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageSubject.trim() || !messageContent.trim()}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                {sendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
