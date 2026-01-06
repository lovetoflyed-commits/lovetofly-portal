'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-6xl font-black text-red-600">⚠️</h1>
          <p className="text-3xl font-bold text-slate-800 mt-4">Algo deu errado</p>
          <p className="text-lg text-slate-600 mt-2">Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-red-600 text-left">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Erro:</p>
          <p className="text-sm text-red-700 font-mono break-words">{error.message || 'Erro desconhecido'}</p>
          {error.digest && (
            <p className="text-xs text-slate-500 mt-2">ID: {error.digest}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Tentar Novamente
          </button>
          <Link
            href="/"
            className="block px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            🏠 Voltar à Home
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-300">
          <p className="text-xs text-slate-600">
            Se o problema persistir, entre em contato com o suporte através do{' '}
            <Link href="/forum" className="text-blue-600 hover:underline font-medium">
              Forum
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
