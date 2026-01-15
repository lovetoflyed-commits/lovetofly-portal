"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.email !== 'lovetofly.ed@gmail.com')) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-4xl font-black text-blue-900 mb-4">Staff Dashboard</h1>
      <p className="text-lg text-slate-700 mb-8">Bem-vindo à área de staff do portal!</p>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <ul className="space-y-4">
          <li>
            <a href="/staff/verifications" className="block p-4 bg-blue-100 rounded hover:bg-blue-200 transition font-semibold text-blue-900">
              Aprovar verificações de usuários
            </a>
          </li>
          <li>
            <a href="/staff/reservations" className="block p-4 bg-blue-100 rounded hover:bg-blue-200 transition font-semibold text-blue-900">
              Gerenciar reservas e listagens
            </a>
          </li>
          <li>
            <a href="/staff/reports" className="block p-4 bg-blue-100 rounded hover:bg-blue-200 transition font-semibold text-blue-900">
              Acessar relatórios e estatísticas
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
