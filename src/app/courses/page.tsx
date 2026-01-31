'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });

// Dados simulados dos cursos
const COURSES = [
  {
    id: 'pp-teorico',
    title: 'Piloto Privado Teórico',
    description: 'Prepare-se para a banca da ANAC com o curso completo de PP.',
    image: 'https://images.unsplash.com/photo-1559627755-6f2650506fcd?auto=format&fit=crop&q=80&w=800',
    status: 'available',
    progress: 0,
  },
  {
    id: 'pc-teorico',
    title: 'Piloto Comercial',
    description: 'O próximo passo na sua carreira. Formação teórica completa para PC.',
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&q=80&w=800',
    status: 'locked',
    progress: 0,
  },
  {
    id: 'jet-training',
    title: 'Jet Training',
    description: 'Adaptação para aeronaves a jato e operação em alta performance.',
    image: 'https://images.unsplash.com/photo-1583068725350-599923cc0d23?auto=format&fit=crop&q=80&w=800',
    status: 'locked',
    progress: 0,
  }
];

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 py-4 px-8">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <span className="text-lg">←</span>
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Meus Cursos</h1>
            <p className="text-indigo-100">
              Acompanhe seu progresso e continue seus estudos
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COURSES.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className={`w-full h-full object-cover transition-all ${course.status === 'locked' ? 'opacity-30 grayscale' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`} 
                  />

                  {course.status === 'locked' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30">
                      <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                        Em Breve
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                  {course.status === 'available' ? (
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                      Acessar Aula
                    </button>
                  ) : (
                    <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-semibold rounded-lg cursor-not-allowed">
                      Indisponível
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
