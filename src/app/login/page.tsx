'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header'; // 1. Importando o Header

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao entrar');
      }

      // Login bem-sucedido
      router.push('/'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 2. ADICIONADO: O Header no topo da página para teste */}
      <Header />

      <div className="flex items-center justify-center p-4 mt-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">

          {/* 3. REMOVIDO: O bloco da imagem grande centralizada foi retirado daqui */}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Bem-vindo de volta</h1>
            <p className="text-slate-500 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">CANAC ou Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                placeholder="Digite seu acesso"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex justify-center items-center"
            >
              {loading ? 'Carregando...' : 'ENTRAR'}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
