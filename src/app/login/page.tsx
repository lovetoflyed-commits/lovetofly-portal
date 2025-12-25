'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Envia 'password' (texto puro) para a API.
      // A API vai comparar isso com o 'password_hash' no banco Neon.
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // --- CORREÇÃO CRÍTICA PARA O LOGIN FUNCIONAR ---
      // Salva o usuário no navegador para que o Header reconheça o login
      localStorage.setItem('user', JSON.stringify(data.user));

      // Dispara eventos para atualizar a tela imediatamente
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('user-login'));

      // Redireciona para a página principal
      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-900">Bem-vindo de volta!</h2>
          <p className="text-slate-500 mt-2">Acesse sua conta para continuar.</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
