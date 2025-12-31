'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, MessageCircle, Eye, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="h-screen w-full bg-slate-900 text-slate-200 overflow-hidden flex flex-col font-sans"
    >
      <Header />

      <main className="flex-1 p-3 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden relative">

        <Sidebar />

        <section className="col-span-1 md:col-span-9 flex flex-col gap-3 overflow-hidden h-full">

          {/* Cabeçalho */}
          <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 flex justify-between 
items-center backdrop-blur-sm shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Fórum da Comunidade</h2>
              <p className="text-xs text-slate-400">Participe das discussões e tire suas dúvidas.</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 
rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-900/20">
              <Plus size={14} /> NOVO TÓPICO
            </button>
          </div>

          {/* Lista de Tópicos */}
          <div className="flex-1 bg-slate-800/40 rounded-lg border border-slate-700/50 overflow-hidden flex 
flex-col">
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
              {TOPICS.map((topic) => (
                <div key={topic.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg 
hover:border-blue-500/30 hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center 
font-bold text-slate-400 border border-slate-700 group-hover:border-blue-500/50 group-hover:text-blue-400 
transition-colors">
                      {topic.avatar}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-white mb-1">
                          {topic.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap 
ml-2">{topic.time}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border 
border-slate-700">
                          {topic.category}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          por <span className="text-slate-400 font-medium">{topic.author}</span>
                        </span>
                      </div>

                      {/* Métricas */}
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1 text-[10px]">
                          <MessageCircle size={12} /> {topic.replies} respostas
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <Eye size={12} /> {topic.views} views
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <ThumbsUp size={12} /> {topic.likes}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </main>
    </motion.div>
  );
}

