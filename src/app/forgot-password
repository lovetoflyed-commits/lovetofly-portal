'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    try {
      // Simulação de envio para API
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Em um cenário real, verificaríamos res.ok
      // Aqui simulamos sucesso para o mockup visual
      setTimeout(() => {
        setStatus({ loading: false, error: '', success: true });
      }, 1500);

    } catch (error) {
      setStatus({ loading: false, error: 'Erro ao conectar com o servidor.', success: false });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-200 
relative overflow-hidden">

      {/* Fundo Decorativo */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 
to-transparent opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl 
overflow-hidden relative z-10"
      >
        <div className="p-8 pb-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border 
border-slate-800 mb-4 shadow-inner">
             <Mail className="text-blue-500" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recuperar Acesso</h2>
          <p className="text-slate-500 text-sm mt-2 text-center">
            Informe seu e-mail para receber as instruções.
          </p>
        </div>

        {!status.success ? (
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail 
Cadastrado</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-500 
transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 
text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
transition-all"
                  required
                />
              </div>
            </div>

            {status.error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={16} />
                <p className="text-xs text-red-200">{status.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all 
shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {status.loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ENVIAR LINK <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-slate-500 hover:text-white flex items-center 
justify-center gap-1 transition-colors">
                <ArrowLeft size={12} /> Voltar para Login
              </Link>
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-8 pb-8 text-center space-y-4"
          >
            <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4 flex flex-col items-center 
gap-2">
              <CheckCircle2 className="text-green-500" size={32} />
              <h3 className="text-white font-bold">E-mail Enviado!</h3>
              <p className="text-xs text-slate-400">
                Verifique sua caixa de entrada (e spam) para redefinir sua senha.
              </p>
            </div>
            <Link 
              href="/login"
              className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg 
transition-colors text-sm"
            >
              Voltar para Login
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

