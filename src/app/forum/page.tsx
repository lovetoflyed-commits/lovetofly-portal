'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, MessageCircle, Eye, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

// Dados mockados de tópicos
const TOPICS = [
  {
    id: 1,
    title: 'Dúvida sobre regulamento de Voo VFR Noturno',
    author: 'Cmte. Silva',
    category: 'Regulamentos',
    replies: 12,
    views: 340,
    likes: 5,
    time: '2h atrás',
    avatar: 'S'
  },
  {
    id: 2,
    title: 'Melhor escola para fazer o curso de INVA em SP?',
    author: 'Aluno João',
    category: 'Formação',
    replies: 28,
    views: 890,
    likes: 15,
    time: '5h atrás',
    avatar: 'J'
  },
  {
    id: 3,
    title: 'Relato de pane de rádio próximo a SBMT',
    author: 'Cmte. Oliveira',
    category: 'Segurança',
    replies: 45,
    views: 1200,
    likes: 32,
    time: '1d atrás',
    avatar: 'O'
  },
  {
    id: 4,
    title: 'Alguém vendendo Bose A20 usado?',
    author: 'Piloto Marcos',
    category: 'Classificados',
    replies: 8,
    views: 150,
    likes: 2,
    time: '2d atrás',
    avatar: 'M'
  },
  {
    id: 5,
    title: 'Dicas para a banca da ANAC de Navegação',
    author: 'Estudante Ana',
    category: 'Estudos',
    replies: 56,
    views: 2100,
    likes: 48,
    time: '3d atrás',
    avatar: 'A'
  }
];

export default function ForumPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span className="text-lg">←</span>
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Fórum da Comunidade</h1>
                <p className="text-blue-100">
                  Participe das discussões e tire suas dúvidas com outros pilotos
                </p>
              </div>
              <button className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                <Plus size={18} /> Novo Tópico
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Total de Tópicos</div>
              <div className="text-2xl font-bold text-gray-900">1,234</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Respostas</div>
              <div className="text-2xl font-bold text-gray-900">8,567</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Membros Ativos</div>
              <div className="text-2xl font-bold text-gray-900">432</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Hoje</div>
              <div className="text-2xl font-bold text-gray-900">28</div>
            </div>
          </div>

          {/* Topics List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Discussões Recentes</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {TOPICS.map((topic) => (
                <div key={topic.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                      {topic.avatar}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {topic.title}
                        </h3>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {topic.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                          {topic.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          por <span className="font-medium text-gray-900">{topic.author}</span>
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-6 text-gray-500">
                        <div className="flex items-center gap-2 text-sm">
                          <MessageCircle size={16} />
                          <span>{topic.replies} respostas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Eye size={16} />
                          <span>{topic.views} visualizações</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <ThumbsUp size={16} />
                          <span>{topic.likes} curtidas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

