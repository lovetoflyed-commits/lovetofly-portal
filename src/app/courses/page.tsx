'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Meus Cursos</h1>
          <p className="text-slate-500 mt-2">Acompanhe seu progresso e continue seus estudos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COURSES.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-48 overflow-hidden">
                {/* CORREÇÃO AQUI: Uso correto de crases (`) para template string */}
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className={`w-full h-full object-cover transition-opacity ${course.status === 'locked' ? 'opacity-30 grayscale' : 'opacity-80 group-hover:opacity-100'}`} 
                />

                {course.status === 'locked' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-slate-900/70 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Em Breve
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>

                {course.status === 'available' ? (
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                    Acessar Aula
                  </button>
                ) : (
                  <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                    Indisponível
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
