'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatBrazilianPhone } from '@/utils/phoneFormat';

// Definindo a interface completa com todos os campos que o banco possui
interface UserProfile {
  id: string;
  name: string;
  email: string;
  anac_code: string;
  role: string;
  mobilePhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  aviationRole?: string;
  aviationRoleOther?: string;
  course_type?: string;
  current_license?: string;
  current_ratings?: string;
  licencas?: string;
  habilitacoes?: string;
  curso_atual?: string;
  total_flight_hours?: number | string;
  transferred_from_ciac?: boolean;
  previous_ciac_name?: string;
  observations?: string;
  created_at?: string;
  avatarUrl?: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/user/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // merge name for backward compatibility
          const merged: UserProfile = {
            ...data,
            name: (user.name || `${(data.firstName||'').trim()} ${(data.lastName||'').trim()}`.trim()),
          } as any;
          setProfileData(merged);
        } else {
          // fallback to context user
          setProfileData(user as unknown as UserProfile);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, router]);

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
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-100 flex items-center justify-center">
              {profileData.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 text-3xl font-bold">
                  {profileData.name?.charAt(0).toUpperCase() || 'P'}
                </span>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{profileData.name}</h1>
              {(profileData.aviationRole || profileData.aviationRoleOther) && (
                <p className="text-slate-500 font-medium tracking-wide">
                  {profileData.aviationRole === 'Outro' && profileData.aviationRoleOther 
                    ? profileData.aviationRoleOther 
                    : profileData.aviationRole}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase border border-blue-100">
                  {profileData.role || 'Piloto'}
                </span>
                {profileData.licencas && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                    {profileData.licencas}
                  </span>
                )}
                {profileData.habilitacoes && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
                    {profileData.habilitacoes}
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
                    <p className="text-slate-700 font-medium">{formatBrazilianPhone(profileData.mobilePhone) || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Endereço</label>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {(() => {
                        const parts = [];
                        if (profileData.addressStreet) {
                          parts.push(`${profileData.addressStreet}${profileData.addressNumber ? ', ' + profileData.addressNumber : ''}`);
                        }
                        if (profileData.addressComplement) {
                          parts.push(profileData.addressComplement);
                        }
                        if (profileData.addressNeighborhood) {
                          parts.push(profileData.addressNeighborhood);
                        }
                        if (profileData.addressCity && profileData.addressState) {
                          parts.push(`${profileData.addressCity} - ${profileData.addressState}`);
                        } else if (profileData.addressCity) {
                          parts.push(profileData.addressCity);
                        }
                        if (profileData.addressZip) {
                          parts.push(`CEP: ${profileData.addressZip}`);
                        }
                        return parts.length > 0 ? parts.join(', ') : 'Não informado';
                      })()}
                    </p>
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

                <div className="space-y-4">
                  {profileData.licencas && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Licenças</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.licencas}</p>
                    </div>
                  )}

                  {profileData.habilitacoes && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Habilitações</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.habilitacoes}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Horas Totais de Voo</label>
                    <p className="text-2xl font-bold text-blue-800">{profileData.total_flight_hours || '0'}h</p>
                    <p className="text-xs text-blue-600 mt-1">Calculado automaticamente do seu logbook</p>
                  </div>

                  {profileData.curso_atual && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Curso Atual</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.curso_atual}</p>
                    </div>
                  )}

                  {!profileData.licencas && !profileData.habilitacoes && !profileData.curso_atual && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="mb-2">📝 Nenhuma qualificação cadastrada</p>
                      <button 
                        onClick={() => router.push('/profile/edit')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Adicionar qualificações
                      </button>
                    </div>
                  )}
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
