'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function IFRSimulatorPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const scenarios = [
    {
      id: 'approach-landing',
      name: 'Aproximação e Pouso IFR',
      difficulty: 'Intermediário',
      duration: '45 min',
      description: 'Praticar aproximação por instrumentos e procedimentos de pouso em condições IFR',
      icon: '📍'
    },
    {
      id: 'hold-procedure',
      name: 'Procedimento de Espera',
      difficulty: 'Iniciante',
      duration: '30 min',
      description: 'Dominar os procedimentos de espera em órbita',
      icon: '🔄'
    },
    {
      id: 'emergency-descent',
      name: 'Descida de Emergência',
      difficulty: 'Avançado',
      duration: '40 min',
      description: 'Procedimentos de descida de emergência com falhas de sistemas',
      icon: '⚠️'
    },
    {
      id: 'precision-approach',
      name: 'Aproximação de Precisão (ILS)',
      difficulty: 'Avançado',
      duration: '50 min',
      description: 'Sistema de pouso por instrumentos (ILS) em baixa visibilidade',
      icon: '🎯'
    },
    {
      id: 'radio-nav',
      name: 'Navegação por Rádio',
      difficulty: 'Iniciante',
      duration: '35 min',
      description: 'Uso de VOR, NDB e outros auxílios de navegação',
      icon: '📡'
    },
    {
      id: 'weather-diversion',
      name: 'Desvio por Clima Adverso',
      difficulty: 'Intermediário',
      duration: '45 min',
      description: 'Tomada de decisão com condições meteorológicas adversas',
      icon: '⛈️'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Sidebar onFeatureClick={() => {}} disabled={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">🎮 Simulador IFR</h1>
            <p className="text-lg text-slate-600">Treinamento de procedimentos de voo por instrumentos</p>
          </div>
          <Link href="/tools" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold">
            ← Voltar
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-blue-900 mb-2">ℹ️ O que é este simulador?</h2>
          <p className="text-blue-800">
            Este é um simulador de procedimentos IFR interativo que ajuda você a praticar navegação por instrumentos, 
            aproximações de precisão, procedimentos de espera e muito mais. Ideal para pilotos em treinamento ou reciclagem.
          </p>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <div className="p-6">
                <div className="text-5xl mb-4">{scenario.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{scenario.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{scenario.description}</p>

                <div className="flex justify-between text-xs text-slate-600 mb-4 py-2 border-t border-b border-slate-200">
                  <div>
                    <span className="font-bold">⏱️ {scenario.duration}</span>
                  </div>
                  <div>
                    <span className={`font-bold px-2 py-1 rounded text-white ${
                      scenario.difficulty === 'Iniciante' ? 'bg-green-600' :
                      scenario.difficulty === 'Intermediário' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedScenario(scenario.id);
                    setShowSimulator(true);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition"
                >
                  ▶️ Começar Cenário
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Simulator Modal */}
        {showSimulator && selectedScenario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  🎮 {scenarios.find(s => s.id === selectedScenario)?.name}
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
                  <p className="text-lg text-slate-300 mb-6">
                    O simulador interativo com gráficos 3D está sendo desenvolvido.<br />
                    Enquanto isso, você pode estudar os procedimentos nos materiais de suporte.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                      📚 Estudar Procedimentos
                    </button>
                    <button className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-bold">
                      🎓 Lições de Voo
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">Objetivos da Prática:</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li>Dominar a navegação por instrumentos</li>
                  <li>Praticar procedimentos de aproximação</li>
                  <li>Aprender resposta a emergências</li>
                  <li>Melhorar precisão e tomada de decisão</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">6</div>
            <p className="text-blue-100">Cenários Disponíveis</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">45+</div>
            <p className="text-green-100">Horas de Prática</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">100%</div>
            <p className="text-purple-100">Procedimentos ANAC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
