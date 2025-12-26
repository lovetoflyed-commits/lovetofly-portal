'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleAd from '@/components/ads/GoogleAd';

export default function E6BPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header do Portal - Mesmo estilo da página principal */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 h-12">
            <img src="/logo-pac.png" alt="Love to Fly" className="h-full w-auto object-contain" />
            <span className="font-black tracking-wide text-lg hidden md:inline">PORTAL LOVE TO FLY</span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50 text-sm"
          >
            ← Voltar
          </button>
        </div>
      </header>

      {/* Hub de Ferramentas E6B */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-4">E6B — Escolha sua Ferramenta</h1>
        {/* Botões de acesso rápido */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/tools/e6b/digital" className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800">E6B Digital</Link>
          <Link href="/tools/e6b/analog" className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800">E6B Analógico</Link>
          <Link href="/tools/e6b/exercises" className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800">Exercícios</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/tools/e6b/digital" className="block bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition">
            <img src="/thumbnails/e6b-digital.svg" alt="E6B Digital" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
            <h2 className="text-xl font-bold text-slate-900 mt-2">E6B Digital</h2>
            <p className="text-slate-600 mt-1">Calculadora eletrônica centrada, ideal para provas e planejamento.</p>
            <div className="mt-4 text-blue-700 text-sm font-bold">Abrir →</div>
          </Link>
          <Link href="/tools/e6b/analog" className="block bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition">
            <img src="/thumbnails/e6b-analog.svg" alt="E6B Analógico" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
            <h2 className="text-xl font-bold text-slate-900 mt-2">E6B Analógico</h2>
            <p className="text-slate-600 mt-1">Disco e régua com imagens, modo vento e conversor.</p>
            <div className="mt-4 text-blue-700 text-sm font-bold">Abrir →</div>
          </Link>
          <Link href="/tools/e6b/exercises" className="block bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition">
            <img src="/thumbnails/e6b-exercises.svg" alt="Exercícios E6B" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
            <h2 className="text-xl font-bold text-slate-900 mt-2">Exercícios (Fixação)</h2>
            <p className="text-slate-600 mt-1">Treinos passo a passo para consolidar uso do E6B.</p>
            <div className="mt-4 text-blue-700 text-sm font-bold">Abrir →</div>
          </Link>
        </div>
        <div className="mt-10 bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-3">Materiais e Espaços Relacionados</h3>
          <p className="text-sm text-slate-600">Acesse materiais de apoio e espaços para objetos relacionados em cada página.</p>
        </div>
      </div>

      {/* Info curta */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-blue-900 mb-3">Sobre o E6B</h2>
          <p className="text-sm text-slate-700">Use o E6B Digital para cálculos rápidos e o E6B Analógico para treinar conceitos de vento e deriva.</p>
        </div>
        <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="text-xs text-slate-400 mb-2">Patrocínio</div>
          <div className="flex justify-center">
            <GoogleAd slot="5734627033" format="auto" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300 text-sm">
            © 2025 Love To Fly Portal | Ferramentas de Aviação Profissionais
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Desenvolvido para pilotos, por pilotos ✈️
          </p>
        </div>
      </div>
    </div>
  );
}
