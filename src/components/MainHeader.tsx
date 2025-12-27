"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MainHeader() {
  const { user, userPlan, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Primeira coluna: Logo 4cm x 4cm centralizada */}
        <div
          className="flex items-center justify-center"
          style={{ height: '3.2cm', minWidth: '8cm', width: '8cm' }}
          onClick={() => router.push("/")}
        >
          <img
            src="/logo-pac.png"
            alt="Love to Fly"
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
          />
        </div>
        {/* Segunda coluna: Título e Subtítulo */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="font-black text-3xl md:text-4xl tracking-wide text-white text-center">PORTAL DA AVIAÇÃO CIVIL</h1>
          <p className="text-sm uppercase tracking-[0.2em] text-white font-semibold mt-1">O SEU PORTAL DA AVIAÇÃO CIVIL</p>
        </div>
        {/* Terceira coluna: Botões */}
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-bold uppercase">{userPlan}</span>
          )}
          {user && (
            <span className="text-sm hidden sm:inline text-gray-800">Olá, {user.name}</span>
          )}
          {user ? (
            <button onClick={logout} className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">Sair</button>
          ) : (
            <>
              <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">Entrar</button>
              <button onClick={() => router.push('/register')} className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm">Cadastrar</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
