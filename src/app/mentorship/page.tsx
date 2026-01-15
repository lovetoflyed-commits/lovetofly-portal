'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function MentorshipPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');

  const mentors = [
    {
      id: 1,
      name: 'Capitão Roberto Silva',
      specialty: 'Transporte Aéreo',
      experience: '25 anos',
      rating: 4.9,
      price: 'R$ 150/hora',
      avatar: '👨‍✈️'
    },
    {
      id: 2,
      name: 'Dra. Ana Costa',
      specialty: 'Aviação Geral',
      experience: '18 anos',
      rating: 4.8,
      price: 'R$ 120/hora',
      avatar: '👩‍✈️'
    },
    {
      id: 3,
      name: 'Engenheiro Marcos Santos',
      specialty: 'Aviônicos',
      experience: '20 anos',
      rating: 4.7,
      price: 'R$ 100/hora',
      avatar: '👨‍💼'
    },
    {
      id: 4,
      name: 'Instrutora Marina Oliveira',
      specialty: 'Procedimentos IFR',
      experience: '15 anos',
      rating: 4.9,
      price: 'R$ 130/hora',
      avatar: '👩‍🏫'
    },
  ];

  const myMentorships = user ? [
    {
      id: 1,
      mentor: 'Capitão Roberto Silva',
      specialty: 'Transporte Aéreo',
      sessions: 5,
      nextSession: '2026-01-20 14:00',
      status: 'Ativo'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex">
      <Sidebar onFeatureClick={() => {}} disabled={false} />
      
      <div className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">🤝 Mentoria Profissional</h1>
            <p className="text-lg text-slate-600">Conecte-se com pilotos e especialistas experientes</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold">
            ← Voltar
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-bold rounded-lg transition ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            🔍 Procurar Mentores
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('mysessions')}
              className={`px-6 py-3 font-bold rounded-lg transition ${
                activeTab === 'mysessions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              📅 Minhas Sessões
            </button>
          )}
        </div>

        {/* Browse Mentors */}
        {activeTab === 'browse' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por especialidade..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="text-5xl mb-4 text-center">{mentor.avatar}</div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{mentor.name}</h3>
                    <p className="text-sm text-blue-600 font-semibold mb-2">{mentor.specialty}</p>
                    <p className="text-sm text-slate-600 mb-4">✈️ {mentor.experience}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-yellow-500 font-bold">⭐ {mentor.rating}</span>
                      <span className="text-lg font-bold text-green-600">{mentor.price}</span>
                    </div>

                    <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition">
                      Agendar Sessão
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Sessions */}
        {activeTab === 'mysessions' && user && (
          <div>
            {myMentorships.length > 0 ? (
              <div className="space-y-4">
                {myMentorships.map((session) => (
                  <div key={session.id} className="bg-white border border-slate-200 rounded-lg p-6 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{session.mentor}</h3>
                      <p className="text-sm text-slate-600 mb-2">{session.specialty}</p>
                      <p className="text-sm text-blue-600">Próxima sessão: {session.nextSession}</p>
                      <p className="text-sm text-slate-600">Total de sessões: {session.sessions}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-slate-600 text-lg mb-4">Você ainda não tem nenhuma sessão de mentoria agendada</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                >
                  Encontrar um Mentor
                </button>
              </div>
            )}
          </div>
        )}

        {/* Not Logged In */}
        {!user && activeTab === 'mysessions' && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">Você precisa estar autenticado para acessar suas sessões</p>
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
