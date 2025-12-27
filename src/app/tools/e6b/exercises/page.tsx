'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import E6BDrills from '@/components/tools/E6BDrills';

export default function E6BExercisesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 h-12">
            <img src="/logo-pac.png" alt="Love to Fly" className="h-full w-auto object-contain" />
            <span className="font-black tracking-wide text-lg hidden md:inline">PORTAL LOVE TO FLY</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push('/tools/e6b')}
              className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50 text-sm"
            >
              ← E6B Hub
            </button>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50 text-sm"
            >
              Página Inicial
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Exercícios — Computador de Voo (E6B)</h1>
        <p className="text-sm text-slate-700 mb-4">Sequência de exercícios práticos para fixação. Não é simulado; foco em aprender o uso correto do E6B.</p>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <E6BDrills />
        </div>

        {/* Materiais de Apoio */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-blue-900 mb-3">Materiais de Apoio</h2>
          <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="font-bold text-slate-800">Guia de Uso (Resumo)</div>
              <p className="text-sm text-slate-600">Passo a passo para WCA, GS, TAS e conversões.</p>
              <a href="#" className="text-blue-700 text-sm mt-2 inline-block">Abrir</a>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="font-bold text-slate-800">Vídeo Aula: Deriva e Correções</div>
              <p className="text-sm text-slate-600">Exemplos de uso do lado de vento do E6B.</p>
              <a href="#" className="text-blue-700 text-sm mt-2 inline-block">Assistir</a>
            </div>
          </div>
        </section>

        {/* Espaços Relacionados */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-blue-900 mb-3">Objetos Relacionados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[ 'Checklist de Planejamento', 'Tabelas de Conversão', 'METAR/TAF Rápido' ].map((t, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="font-bold text-slate-800">{t}</div>
                <p className="text-sm text-slate-600">Placeholder para futuras integrações.</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="bg-slate-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300 text-sm">© 2025 Love To Fly Portal</p>
        </div>
      </div>
    </div>
  );
}
