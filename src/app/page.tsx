'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header Importado */}
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative bg-blue-900 text-white py-16 md:py-24 overflow-hidden">

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">

              {/* Texto e Botões */}
              <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-800 border border-blue-700 text-blue-200 text-xs font-bold uppercase mb-2">
                  Bem-vindo a bordo
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                  Sua Jornada na <br/>
                  <span className="text-blue-200">Aviação Civil</span>
                </h1>

                <p className="text-lg text-blue-100 max-w-xl mx-auto md:mx-0">
                  O portal completo para pilotos, estudantes e entusiastas. Notícias, regulamentações, cursos e simulados em um só lugar.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                  <Link href="/register" className="px-8 py-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all text-center">
                    Criar Conta Grátis
                  </Link>
                  <Link href="/login" className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-center">
                    Fazer Login
                  </Link>
                </div>
              </div>

              {/* Imagem do Escudo - Tamanho fixo mantido */}
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                 <Image 
                   src="/logo-pac.png" 
                   alt="Portal da Aviação Civil" 
                   width={400} 
                   height={400}
                   className="object-contain drop-shadow-2xl"
                   priority 
                 />
              </div>

            </div>
          </div>
        </section>

        {/* CARDS DE SERVIÇOS - Atualizados para o novo escopo */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Card 1: Notícias */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white transition-colors">📰</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Notícias & ANAC</h3>
                <p className="text-slate-500 leading-relaxed">Mantenha-se atualizado com as últimas RBACs, IS e novidades do setor aéreo.</p>
              </div>

              {/* Card 2: Formação */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white transition-colors">🎓</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Cursos & Formação</h3>
                <p className="text-slate-500 leading-relaxed">Conteúdos para entusiastas e cursos preparatórios para futuras habilitações.</p>
              </div>

              {/* Card 3: Simulados (Substituindo Diário de Bordo) */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white transition-colors">📝</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Simulados & Testes</h3>
                <p className="text-slate-500 leading-relaxed">Teste seus conhecimentos com bancos de questões e prepare-se para as provas.</p>
              </div>

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
