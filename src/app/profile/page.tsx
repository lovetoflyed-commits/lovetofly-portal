'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Definindo a interface completa com todos os campos que o banco possui
interface UserProfile {
  id: string;
  name: string;
  email: string;
  anac_code: string;
  role: string;
  phone_number?: string;
  address?: string;
  course_type?: string;
  current_license?: string;
  current_ratings?: string;
  total_flight_hours?: number | string;
  transferred_from_ciac?: boolean;
  previous_ciac_name?: string;
  observations?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se não tiver usuário logado, redireciona para login
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    // Carregar dados do perfil
    if (user) {
      // Fazemos um cast seguro para UserProfile para o TypeScript aceitar os campos extras
      setProfileData(user as unknown as UserProfile);
      setLoading(false);
    } else {
      // Pequeno delay para garantir que o AuthContext carregou
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, router, loading]);

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">

          {/* --- CABEÇALHO DO PERFIL --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-sm">
              {profileData.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{profileData.name}</h1>
              <p className="text-slate-500 font-medium tracking-wide">CANAC: {profileData.anac_code}</p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase border border-blue-100">
                  {profileData.role || 'Piloto'}
                </span>
                {profileData.current_license && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase border border-green-100">
                    {profileData.current_license}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => router.push('/profile/edit')}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Editar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* --- COLUNA ESQUERDA: DADOS PESSOAIS --- */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <span>👤</span> Dados Pessoais
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                    <p className="text-slate-700 font-medium break-all">{profileData.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <p className="text-slate-700 font-medium">{profileData.phone_number || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Endereço</label>
                    <p className="text-slate-700 font-medium">{profileData.address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- COLUNA DIREITA: DADOS TÉCNICOS --- */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <span>✈️</span> Qualificações & Voo
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Licença Atual</label>
                    <p className="text-lg font-bold text-slate-800">{profileData.current_license || '-'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Habilitações</label>
                    <p className="text-lg font-bold text-slate-800">{profileData.current_ratings || '-'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Horas Totais</label>
                    <p className="text-lg font-bold text-slate-800">{profileData.total_flight_hours || '0'}h</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Curso Atual</label>
                    <p className="text-lg font-bold text-slate-800">{profileData.course_type || '-'}</p>
                  </div>
                </div>

                {profileData.observations && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {profileData.observations}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
