'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-black text-blue-900">404</h1>
          <p className="text-3xl font-bold text-slate-800 mt-4">Página não encontrada</p>
          <p className="text-lg text-slate-600 mt-2">Desculpe, a página que você está procurando não existe ou foi removida.</p>
        </div>

        <div className="space-y-4">
          <div className="space-x-4 flex justify-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Voltar
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors inline-block"
            >
              🏠 Home
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-300">
            <p className="text-sm text-slate-600 mb-4">Links Úteis:</p>
            <nav className="flex justify-center gap-6 flex-wrap">
              <Link href="/tools/e6b" className="text-blue-600 hover:underline font-medium">
                🧮 E6B Calculator
              </Link>
              <Link href="/hangarshare" className="text-blue-600 hover:underline font-medium">
                🛖 HangarShare
              </Link>
              <Link href="/forum" className="text-blue-600 hover:underline font-medium">
                💬 Forum
              </Link>
              <Link href="/logbook" className="text-blue-600 hover:underline font-medium">
                📔 Logbook
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
