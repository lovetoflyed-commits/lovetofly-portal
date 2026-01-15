'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function SimulatorPage() {
  const [selectedSimulator, setSelectedSimulator] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const simulators = [
    {
      id: 'full-flight',
      name: 'Simulador de Voo Completo',
      description: 'Simulação realista de voo com dinâmica de aeronave e física completa',
      aircraft: ['B737', 'A320', 'B777'],
      icon: '🎮',
      difficulty: 'Avançado'
    },
    {
      id: 'procedural',
      name: 'Treinador de Procedimentos',
      description: 'Foco em checklist, procedimentos de emergência e gerenciamento de sistemas',
      aircraft: ['Genérico'],
      icon: '📋',
      difficulty: 'Intermediário'
    },
    {
      id: 'navigation',
      name: 'Treinador de Navegação',
      description: 'Praticar navegação VOR, NDB e procedimentos RNAV',
      aircraft: ['Genérico'],
      icon: '🧭',
      difficulty: 'Iniciante'
    },
    {
      id: 'emergency',
      name: 'Simulador de Emergências',
      description: 'Cenários de emergência e falhas de sistema para treinamento de resposta',
      aircraft: ['Genérico'],
      icon: '⚠️',
      difficulty: 'Avançado'
    },
    {
      id: 'approach',
      name: 'Simulador de Aproximação',
      description: 'Praticar diferentes tipos de aproximação e pouso em vários aeródromos',
      aircraft: ['Genérico'],
      icon: '📍',
      difficulty: 'Intermediário'
    },
    {
      id: 'weather',
      name: 'Treinador de Meteorologia',
      description: 'Entender e praticar voo em diferentes condições meteorológicas',
      aircraft: ['Genérico'],
      icon: '⛈️',
      difficulty: 'Intermediário'
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante':
        return 'bg-green-100 text-green-800';
      case 'Intermediário':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avançado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Sidebar onFeatureClick={() => {}} disabled={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">🎮 Simulador de Voo</h1>
            <p className="text-lg text-slate-600">Treinamento de voo com simuladores especializados</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold">
            ← Voltar
          </Link>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Centro de Treinamento em Simulador</h2>
          <p className="text-blue-100 mb-4">
            Acesse simuladores especializados para aprimorar suas habilidades de voo. De procedimentos básicos a emergências complexas.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold transition">
              📚 Guia de Início
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 font-bold transition">
              🎓 Certificações
            </button>
          </div>
        </div>

        {/* Simulators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {simulators.map((sim) => (
            <div key={sim.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="text-5xl mb-3">{sim.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{sim.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{sim.description}</p>

                <div className="mb-4 pb-4 border-b border-slate-200">
                  <p className="text-xs text-slate-600 font-bold mb-2">AERONAVES DISPONÍVEIS:</p>
                  <div className="flex flex-wrap gap-2">
                    {sim.aircraft.map((aircraft) => (
                      <span key={aircraft} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                        {aircraft}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(sim.difficulty)}`}>
                    {sim.difficulty}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSimulator(sim.id);
                      setShowSimulator(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition text-sm"
                  >
                    ▶️ Abrir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simulator Modal */}
        {showSimulator && selectedSimulator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {simulators.find(s => s.id === selectedSimulator)?.icon} {simulators.find(s => s.id === selectedSimulator)?.name}
                </h2>
                <button
                  onClick={() => setShowSimulator(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="p-6 bg-slate-900 text-white min-h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🛩️</div>
                  <p className="text-2xl font-bold mb-4">Simulador em Desenvolvimento</p>
                  <p className="text-lg text-slate-300 mb-8">
                    O simulador 3D avançado está sendo desenvolvido com tecnologia de ponta.<br />
                    Você pode começar com os cenários de treinamento estruturado enquanto isso.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                      📖 Material de Estudo
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
                      ✅ Teste de Conhecimento
                    </button>
                    <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold">
                      🏆 Ranking
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">Características do Simulador:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                  <li>✈️ Modelagem realista de aeronaves</li>
                  <li>🌍 Múltiplos aeródromos e ambientes</li>
                  <li>⛈️ Dinâmica meteorológica variável</li>
                  <li>🛰️ Sistemas de navegação RNAV/ILS</li>
                  <li>🔧 Falhas de sistema customizáveis</li>
                  <li>📊 Análise pós-voo detalhada</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📊 Seu Progresso</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-black text-blue-600 mb-2">0</div>
              <p className="text-slate-600">Horas de Simulador</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-black text-green-600 mb-2">0</div>
              <p className="text-slate-600">Sessões Completas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-black text-yellow-600 mb-2">0%</div>
              <p className="text-slate-600">Proficiência</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-black text-purple-600 mb-2">0</div>
              <p className="text-slate-600">Certificações</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
