'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import AuthContext

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth(); // Use AuthContext

  const handleLogout = () => {
    logout(); // Use AuthContext logout
    router.push('/'); // Redireciona para a Home após sair
  };

  return (
    <header className="bg-white shadow-md py-2 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 h-20">

      {/* 1. LOGO (Esquerda) */}
      <div className="flex-shrink-0">
        <Link href="/">
          <Image 
            src="/logo-pac.png" 
            alt="Logo Love to Fly" 
            width={80} 
            height={80} 
            className="object-contain h-16 w-auto"
            priority
          />
        </Link>
      </div>

      {/* 2. TEXTO CENTRAL (Centro) */}
      <div className="flex-1 text-center mx-4 hidden md:block">
        <h1 className="text-blue-900 font-black text-xl tracking-wider leading-tight">
          PORTAL LOVE TO FLY
        </h1>
        <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
          O SEU PORTAL DA AVIAÇÃO CIVIL
        </p>
      </div>

      {/* 3. ÁREA DO USUÁRIO (Direita) */}
      <div className="flex-shrink-0 flex items-center gap-4 justify-end">
        {user ? (
          /* --- USUÁRIO LOGADO --- */
          <div className="flex items-center gap-4">
            {/* Nome do Usuário */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Olá,</p>
              <p className="text-sm font-bold text-blue-900 leading-none">
                {user.name.split(' ')[0]}
              </p>
            </div>

            {/* Botão Sair */}
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors"
            >
              SAIR
            </button>
          </div>
        ) : (
          /* --- VISITANTE --- */
          <div className="flex gap-2">
            <Link 
              href="/login" 
              className="text-blue-900 font-bold text-sm hover:text-blue-700 px-3 py-2 transition-colors"
            >
              ENTRAR
            </Link>
            <Link 
              href="/register" 
              className="bg-blue-900 text-white font-bold text-sm px-5 py-2 rounded-full hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
            >
              CRIAR CONTA
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
