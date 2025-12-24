'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header com a logo pequena e botões */}
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION - O Fundo Azul com o Escudo */}
        <section className="relative bg-blue-900 text-white py-20 overflow-hidden">
          {/* Elementos de fundo decorativos */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>

          <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2 space-y-6">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wider uppercase">
                Bem-vindo a bordo
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Sua Jornada na <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                  Aviação Civil
                </span>
              </h1>
              <p className="text-lg text-blue-100 max-w-lg leading-relaxed">
                Acesse notícias, regulamentações da ANAC, cursos de formação e gerencie suas horas de voo em um único lugar.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/register" className="px-8 py-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-1">
                  Começar Agora
                </Link>
                <button className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                  Saiba Mais
                </button>
              </div>
            </div>

            {/* Ilustração Hero - O Escudo do Portal */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                 {/* Aqui o Next.js vai buscar a imagem logo-pac.png na pasta public */}
                 <div className="relative w-full h-full">
                    <Image 
                      src="/logo-pac.png" 
                      alt="Portal Shield" 
                      fill
                      className="object-contain drop-shadow-2xl" 
                    />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* CARDS DE SERVIÇOS */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <span className="text-2xl">✈️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Notícias & ANAC</h3>
              <p className="text-slate-500 leading-relaxed">Mantenha-se atualizado com as últimas RBACs, IS e notícias do setor aéreo.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Formação</h3>
              <p className="text-slate-500 leading-relaxed">Cursos preparatórios para bancas da ANAC, IFR e aprimoramento técnico.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Diário de Bordo</h3>
              <p className="text-slate-500 leading-relaxed">Digitalize suas horas de voo e mantenha seu CIV organizado e seguro.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 Portal da Aviação Civil. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
