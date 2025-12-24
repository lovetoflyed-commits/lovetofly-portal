'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    anac_code: '', // CANAC
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem!");
      setLoading(false);
      return;
    }

    // Simulação de cadastro
    console.log('Dados do cadastro:', formData);

    setTimeout(() => {
      setLoading(false);
      // Redirecionar para login ou dashboard após sucesso
      router.push('/login'); 
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">

        <div className="bg-blue-900 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Crie sua conta</h2>
          <p className="text-blue-200 text-sm mt-2">Junte-se à comunidade Love to Fly</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* CANAC (Opcional ou Obrigatório dependendo da regra) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CANAC (Código ANAC)</label>
              <input
                type="text"
                name="anac_code"
                maxLength={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="000000"
                value={formData.anac_code}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-400 mt-1">Apenas números (6 dígitos)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex justify-center items-center"
              >
                {loading ? 'Criando conta...' : 'Cadastrar'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold">
              Faça Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
