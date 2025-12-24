'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    // Altura aumentada para h-44 (176px) para comportar a logo de 4cm
    <header className="bg-white shadow-md sticky top-0 z-50 h-44 transition-all">
      <div className="container mx-auto px-4 h-full flex items-center justify-between relative">

        {/* 1. LOGO À ESQUERDA (Aumentada para 150px ~ 4cm) */}
        <div className="flex-shrink-0 z-20">
          <Link href="/">
            <div className="relative w-[150px] h-[150px]">
              <Image 
                src="/logo-pac.png" 
                alt="Portal Love to Fly" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* 2. TÍTULO E SUBTÍTULO CENTRALIZADOS */}
        {/* Usamos absolute para garantir que fique EXATAMENTE no centro da tela */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center hidden md:flex flex-col items-center justify-center w-full pointer-events-none">
          <span className="text-blue-900 font-extrabold text-4xl leading-tight tracking-tight drop-shadow-sm">
            PORTAL LOVE TO FLY
          </span>
          <span className="text-blue-500 text-lg font-bold tracking-[0.2em] uppercase mt-2">
            O Seu Portal da Aviação Civil
          </span>
        </div>

        {/* 3. BOTÕES À DIREITA */}
        <nav className="flex items-center gap-4 z-20">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Meu Perfil
              </Link>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">CANAC: {user.anac_code}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link 
                href="/login" 
                className="text-blue-600 font-bold text-xl hover:text-blue-800 transition-colors px-2"
              >
                Entrar
              </Link>
              <Link 
                href="/register" 
                className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Criar Conta
              </Link>
            </div>
          )}

          {/* Botão Mobile */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* MENU MOBILE DROPDOWN (Ajustado top-44) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-lg absolute w-full left-0 top-44 z-40">
          <div className="text-center pb-4 border-b border-slate-100 mb-2">
             <p className="text-blue-900 font-bold text-lg">PORTAL LOVE TO FLY</p>
          </div>

          {user ? (
            <>
              <Link href="/profile" className="block text-slate-600 font-medium p-3 hover:bg-slate-50 rounded-lg text-lg">
                Meu Perfil
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left p-3 text-red-600 font-bold hover:bg-red-50 rounded-lg text-lg"
              >
                Sair
              </button>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <Link 
                href="/login" 
                className="text-center py-4 border border-slate-200 text-slate-700 font-bold rounded-xl text-lg"
              >
                Entrar
              </Link>
              <Link 
                href="/register" 
                className="text-center py-4 bg-blue-600 text-white font-bold rounded-xl text-lg"
              >
                Criar Conta
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
