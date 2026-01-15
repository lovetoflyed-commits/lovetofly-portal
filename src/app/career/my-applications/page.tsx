'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');

  const applications = [
    {
      id: 1,
      company: 'TAP Portugal',
      position: 'Piloto Comercial',
      salary: 'R$ 25.000 - R$ 35.000',
      appliedAt: '2025-12-15',
      status: 'Entrevista Marcada',
      stage: 3,
      nextStep: 'Entrevista técnica - 20/01/2026'
    },
    {
      id: 2,
      company: 'LATAM',
      position: 'Copiloto',
      salary: 'R$ 18.000 - R$ 25.000',
      appliedAt: '2025-12-20',
      status: 'Em Análise',
      stage: 2,
      nextStep: 'Análise de currículo'
    },
    {
      id: 3,
      company: 'Azul Linhas Aéreas',
      position: 'Piloto Comercial',
      salary: 'R$ 22.000 - R$ 32.000',
      appliedAt: '2025-12-10',
      status: 'Recusado',
      stage: 1,
      nextStep: 'Feedback disponível'
    },
    {
      id: 4,
      company: 'Gol Linhas Aéreas',
      position: 'Piloto Instrutor',
      salary: 'R$ 20.000 - R$ 30.000',
      appliedAt: '2025-12-22',
      status: 'Recebida',
      stage: 1,
      nextStep: 'Aguardando análise inicial'
    },
  ];

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
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStageIcon = (stage: number) => {
    const stages = ['📝', '👁️', '💬', '✅'];
    return stages[stage - 1] || '❓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
      <Sidebar onFeatureClick={() => {}} disabled={false} />

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
            className={`px-4 py-2 rounded-lg font-bold transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todas ({applications.length})
          </button>
          <button
            onClick={() => setFilterStatus('Recebida')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              filterStatus === 'Recebida'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Recebida ({applications.filter(a => a.status === 'Recebida').length})
          </button>
          <button
            onClick={() => setFilterStatus('Em Análise')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              filterStatus === 'Em Análise'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Em Análise ({applications.filter(a => a.status === 'Em Análise').length})
          </button>
          <button
            onClick={() => setFilterStatus('Entrevista Marcada')}
            className={`px-4 py-2 rounded-lg font-bold transition ${
              filterStatus === 'Entrevista Marcada'
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
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{getStageIcon(app.stage)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{app.position}</h3>
                            <p className="text-sm text-slate-600">{app.company}</p>
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
                        <p className="font-bold text-slate-900">{app.salary}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-1">DATA DE APLICAÇÃO</p>
                        <p className="font-bold text-slate-900">{app.appliedAt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-1">PRÓXIMO PASSO</p>
                        <p className="font-bold text-blue-600">{app.nextStep}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-600 mb-2">
                        <span>Progresso do Processo</span>
                        <span>{app.stage}/4</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(app.stage / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-bold transition">
                        📧 Enviar Mensagem
                      </button>
                      <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold transition">
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
    </div>
  );
}
