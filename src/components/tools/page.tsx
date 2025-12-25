'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar'; // Ajuste o caminho conforme sua estrutura
import Header from '@/components/Header';   // Ajuste o caminho conforme sua estrutura
import E6BComputer from '@/components/tools/E6BComputer';

export default function E6BPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // --- LÓGICA DE VERIFICAÇÃO DE LOGIN ---
    // Aqui você deve verificar se o usuário está logado.
    // Exemplo: verificar se existe um token no localStorage ou cookie.
    const checkAuth = () => {
      const token = localStorage.getItem('token'); // OU use seu hook de contexto: const { user } = useAuth();

      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mantemos a Sidebar para navegação */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mantemos o Header */}
        <Header />

        <main className="flex-1 overflow-y-auto p-4 relative">

          {/* ESTADO DE CARREGAMENTO */}
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
          ) : isAuthenticated ? (

            /* --- USUÁRIO LOGADO: MOSTRA O COMPUTADOR --- */
            <div className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center justify-center gap-2">
                  ✈️ Computador de Voo Digital (E6B)
                </h2>
                <p className="text-slate-600">
                  Ferramenta oficial para cálculos de navegação e performance.
                </p>
              </div>
              <E6BComputer />
            </div>

          ) : (

            /* --- USUÁRIO NÃO LOGADO: MOSTRA BLOQUEIO --- */
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  🔒
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Acesso Restrito aos Pilotos
                </h2>

                <p className="text-slate-600 mb-8 leading-relaxed">
                  O <strong>Computador de Voo E6B</strong> é uma ferramenta avançada exclusiva para membros do portal <em>Love to Fly</em>. 
                  Para realizar seus cálculos de navegação com segurança, por favor, identifique-se.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/login" 
                    className="px-8 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Fazer Login
                  </Link>

                  <Link 
                    href="/register" 
                    className="px-8 py-3 bg-white text-blue-900 border-2 border-blue-900 font-bold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Criar Cadastro Grátis
                  </Link>
                </div>

                <p className="mt-6 text-xs text-slate-400">
                  Junte-se a milhares de aviadores e tenha acesso a ferramentas exclusivas.
                </p>
              </div>

              {/* Preview desfocado ao fundo (opcional, para dar vontade de usar) */}
              <div className="absolute -z-10 opacity-10 blur-sm scale-90 pointer-events-none select-none grayscale">
                 <E6BComputer />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
