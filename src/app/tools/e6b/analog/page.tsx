'use client';

import { useAuth } from '@/context/AuthContext';
import E6BAnalogImage from '@/components/tools/E6BAnalogImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function E6BAnalogPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 h-12">
            <Image src="/logo-pac.png" alt="Love to Fly" width={120} height={48} className="h-full w-auto object-contain" />
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
      {user ? (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">E6B Analógico</h1>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex items-center justify-center">
            {/* Centered Analog Image Overlay */}
            <div className="max-w-3xl w-full mx-auto">
              <E6BAnalogImage />
            </div>
          </div>

          {/* Ads: Aeroclubes e Escolas de Aviação */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Anúncios — Aeroclubes e Escolas de Aviação</h2>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Aeroclube XYZ', city: 'Belo Horizonte', link: '#', badge: '/LOGOS_LTF/Badge_PP_2.png' },
                  { name: 'Escola Bravo', city: 'Curitiba', link: '#', badge: '/LOGOS_LTF/Badge_PC_IFR_MLTE.png' },
                  { name: 'Aviation School Delta', city: 'Porto Alegre', link: '#', badge: '/LOGOS_LTF/Badge_1o_Solo.png' },
                ].map((a, i) => (
                  <a key={i} href={a.link} className="block border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      {a.badge && (
                        <Image src={a.badge} alt="Badge" width={80} height={80} className="w-20 h-20 object-contain" />
                      )}
                      <div className="font-bold text-slate-800">{a.name}</div>
                    </div>
                    <div className="text-sm text-slate-600">{a.city}</div>
                    <div className="text-xs text-blue-700 mt-2">Saiba mais →</div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Materiais de Apoio */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Materiais de Apoio</h2>
            <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-bold text-slate-800">Guia de Vento e Deriva</div>
                <p className="text-sm text-slate-600">Procedimentos para WCA e GS.</p>
                <a href="#" className="text-blue-700 text-sm mt-2 inline-block">Baixar PDF</a>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="font-bold text-slate-800">Vídeo: Uso do Disco</div>
                <p className="text-sm text-slate-600">Demonstração com E6B tradicional.</p>
                <a href="#" className="text-blue-700 text-sm mt-2 inline-block">Assistir</a>
              </div>
            </div>
          </section>

          {/* Espaços Relacionados */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-3">Objetos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[ 'Clocks UTC/Local', 'Weather Widget', 'NAVAIDs Map' ].map((t, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="font-bold text-slate-800">{t}</div>
                  <p className="text-sm text-slate-600">Espaço reservado para integração.</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🔒</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso exclusivo</h2>
            <p className="text-slate-600 mb-6">Faça login para usar o E6B Analógico.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="px-6 py-2 bg-blue-900 text-white rounded-lg font-bold">Login</Link>
              <Link href="/register" className="px-6 py-2 bg-white text-blue-900 border-2 border-blue-900 rounded-lg font-bold">Criar Conta</Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-800 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300 text-sm">© 2025 Love To Fly Portal</p>
        </div>
      </div>
    </div>
  );
}
