'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { maskCEP } from '@/utils/masks';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
  user: any;
  access: any;
  moderation: any[];
  activities: any[];
  hangarOwner: any;
  businessUser: any;
  stats: any;
}

// Reset Password Button Component
function ResetPasswordButton({
  userId,
  userEmail,
  token,
}: {
  userId: string;
  userEmail: string;
  token: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to generate reset code');
        return;
      }

      setMessage(`Reset code sent to ${userEmail}. Code expires in 15 minutes.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm">
          {message}
        </div>
      )}
      <button
        onClick={handleResetPassword}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          '📧 Send Password Reset Code'
        )}
      </button>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('moderation');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingHangar, setIsEditingHangar] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editHangar, setEditHangar] = useState<any>(null);
  const [editBusiness, setEditBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState('');
  const [businessCepLoading, setBusinessCepLoading] = useState(false);
  const [businessCepStatus, setBusinessCepStatus] = useState('');
  const hasFetchedRef = useRef(false);
  const inFlightRef = useRef(false);

  // Activity log pagination and filters
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('all');
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const activitiesPerPage = 20;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  const fetchProfile = useCallback(async (force = false) => {
    if (typeof window === 'undefined') return;

    if (inFlightRef.current) {
      return;
    }

    if (!force && hasFetchedRef.current) {
      setLoading(false);
      return;
    }

    try {
      inFlightRef.current = true;
      if (!force) {
        setLoading(true);
      }
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.user) {
      setEditUser(profile.user);
    }
    if (profile?.hangarOwner) {
      setEditHangar(profile.hangarOwner);
    }
    if (profile?.businessUser) {
      setEditBusiness(profile.businessUser);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.user) {
      if (profile.user.user_type === 'business' && profile.businessUser) {
        setActiveTab('business');
      } else if (profile.user.user_type !== 'business') {
        setActiveTab('information');
      }
    }
  }, [profile?.user]);

  const fetchAddressByCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    setCepLoading(true);
    setCepStatus('Buscando CEP...');

    try {
      const response = await fetch(`/api/address/cep?code=${cleaned}`);
      if (!response.ok) throw new Error('CEP lookup failed');

      const data = await response.json();
      if (data.error || !data.success) {
        setCepStatus('CEP não encontrado.');
        setCepLoading(false);
        return;
      }

      setEditUser((prev: any) => ({
        ...prev,
        address_zip: maskCEP(cleaned),
        address_street: data.street || prev.address_street,
        address_neighborhood: data.neighborhood || prev.address_neighborhood,
        address_city: data.city || prev.address_city,
        address_state: data.state || prev.address_state,
      }));

      setCepStatus('Endereço preenchido automaticamente.');
    } catch (err) {
      console.error('Failed to fetch address by CEP:', err);
      setCepStatus('Não foi possível buscar o CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const fetchBusinessAddressByCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    setBusinessCepLoading(true);
    setBusinessCepStatus('Buscando CEP...');

    try {
      const response = await fetch(`/api/address/cep?code=${cleaned}`);
      if (!response.ok) throw new Error('CEP lookup failed');

      const data = await response.json();
      if (data.error || !data.success) {
        setBusinessCepStatus('CEP não encontrado.');
        setBusinessCepLoading(false);
        return;
      }

      setEditBusiness((prev: any) => ({
        ...prev,
        headquarters_zip: maskCEP(cleaned),
        headquarters_street: data.street || prev.headquarters_street,
        headquarters_neighborhood: data.neighborhood || prev.headquarters_neighborhood,
        headquarters_city: data.city || prev.headquarters_city,
        headquarters_state: data.state || prev.headquarters_state,
      }));

      setBusinessCepStatus('Endereço preenchido automaticamente.');
    } catch (err) {
      console.error('Failed to fetch business address by CEP:', err);
      setBusinessCepStatus('Não foi possível buscar o CEP.');
    } finally {
      setBusinessCepLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user: editUser })
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }

        console.error('User profile save failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });

        throw new Error(errorData.message || 'Falha ao salvar perfil');
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, user: data.user || prev.user } : prev);
      await fetchProfile(true);
      setIsEditingUser(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHangar = async () => {
    if (!editHangar) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ hangarOwner: editHangar })
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }

        console.error('Hangar owner save failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });

        throw new Error(errorData.message || 'Falha ao salvar dados do hangar');
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, hangarOwner: data.hangarOwner || prev.hangarOwner } : prev);
      await fetchProfile(true);
      setIsEditingHangar(false);
    } catch (error) {
      console.error('Error saving hangar owner:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar dados do hangar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!editBusiness) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ businessUser: editBusiness })
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }

        console.error('Business profile save failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });

        throw new Error(errorData.message || 'Falha ao salvar perfil da empresa');
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, businessUser: data.businessUser || prev.businessUser } : prev);
      await fetchProfile(true);
      setIsEditingBusiness(false);
    } catch (error) {
      console.error('Error saving business profile:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar perfil da empresa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando perfil do usuário...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Usuário não encontrado</p>
          <Link href="/admin/users" className="mt-4 inline-block text-blue-600 hover:underline">
            Voltar para Usuários
          </Link>
        </div>
      </div>
    );
  }

  const { user, access, moderation, activities, hangarOwner, businessUser, stats } = profile;
  const accessLevelColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    restricted: 'bg-orange-100 text-orange-800 border-orange-300',
    suspended: 'bg-red-100 text-red-800 border-red-300',
    banned: 'bg-gray-800 text-white border-gray-900'
  };

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-800',
    standard: 'bg-slate-100 text-slate-800',
    premium: 'bg-yellow-100 text-yellow-800',
    pro: 'bg-blue-100 text-blue-800'
  };

  const roleColors: Record<string, string> = {
    user: 'bg-gray-100 text-gray-800',
    admin: 'bg-red-100 text-red-800',
    master: 'bg-purple-100 text-purple-800'
  };

  const actionTypeColors: Record<string, string> = {
    warning: 'bg-yellow-100 text-yellow-800',
    strike: 'bg-orange-100 text-orange-800',
    suspend: 'bg-red-100 text-red-800',
    ban: 'bg-gray-900 text-white',
    restore: 'bg-green-100 text-green-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin/users" className="flex items-center gap-2 text-blue-600 hover:underline">
          ← Voltar para Usuários
        </Link>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.user_type === 'business' && businessUser ? businessUser.business_name : user.name}
          </h1>
          <p className="text-gray-600">{user.email}</p>
          {user.user_type === 'business' && (
            <p className="text-sm text-gray-500 mt-1">
              {businessUser?.legal_name} • CNPJ: {businessUser?.cnpj}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-lg">🔐</span>
            <span className="text-sm font-semibold">Nível de Acesso</span>
          </div>
          <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${accessLevelColors[access?.access_level || 'active']}`}>
            {(access?.access_level || 'active').toUpperCase()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-semibold">Problemas Ativos</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.active_infractions || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-lg">🔑</span>
            <span className="text-sm font-semibold">Logins</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.login_count || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-lg">📅</span>
            <span className="text-sm font-semibold">Última Atividade</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString('pt-BR') : 'Nunca'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {[...(businessUser ? ['business'] : ['information']), 'moderation', 'activities', 'hangar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab === 'information' && 'Information'}
              {tab === 'moderation' && 'Moderation'}
              {tab === 'activities' && 'Activities'}
              {tab === 'business' && 'Business Profile'}
              {tab === 'hangar' && 'Hangar Owner'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Information Tab (Individual Users) */}
          {activeTab === 'information' && !businessUser && (
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  👤 Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">First Name</label>
                    <p className="text-gray-900">{user.first_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                    <p className="text-gray-900">{user.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Phone</label>
                    <p className="text-gray-900">{user.mobile_phone || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">CPF</label>
                    <p className="text-gray-900 font-mono">{user.cpf || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Birth Date</label>
                    <p className="text-gray-900">{user.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Account Information Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔐 Account Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Role</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}>
                      {user.role.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Plan</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${planColors[user.plan]}`}>
                      {user.plan.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">User Type</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.user_type === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.user_type?.toUpperCase() || 'INDIVIDUAL'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Type Verified</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.user_type_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.user_type_verified ? '✓ VERIFIED' : '✗ PENDING'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Access Level</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${accessLevelColors[access?.access_level || 'active']}`}>
                      {(access?.access_level || 'active').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Hangar Owner</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.is_hangar_owner ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.is_hangar_owner ? '✓ YES' : '✗ NO'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviation Information Section */}
              {(user.aviation_role || user.licencas || user.habilitacoes || user.curso_atual) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    ✈️ Aviation Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {user.aviation_role && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Aviation Role</label>
                        <p className="text-gray-900">{user.aviation_role}</p>
                      </div>
                    )}
                    {user.licencas && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Licenses</label>
                        <p className="text-gray-900">{user.licencas}</p>
                      </div>
                    )}
                    {user.habilitacoes && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Ratings</label>
                        <p className="text-gray-900">{user.habilitacoes}</p>
                      </div>
                    )}
                    {user.curso_atual && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Current Course</label>
                        <p className="text-gray-900">{user.curso_atual}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Information Section */}
              {(user.address_street || user.address_city) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    📍 Address Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {user.address_street && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Street</label>
                        <p className="text-gray-900">{user.address_street}</p>
                      </div>
                    )}
                    {user.address_number && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Number</label>
                        <p className="text-gray-900">{user.address_number}</p>
                      </div>
                    )}
                    {user.address_complement && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Complement</label>
                        <p className="text-gray-900">{user.address_complement}</p>
                      </div>
                    )}
                    {user.address_neighborhood && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Neighborhood</label>
                        <p className="text-gray-900">{user.address_neighborhood}</p>
                      </div>
                    )}
                    {user.address_city && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">City</label>
                        <p className="text-gray-900">{user.address_city}</p>
                      </div>
                    )}
                    {user.address_state && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">State</label>
                        <p className="text-gray-900">{user.address_state}</p>
                      </div>
                    )}
                    {user.address_zip && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">ZIP Code</label>
                        <p className="text-gray-900">{user.address_zip}</p>
                      </div>
                    )}
                    {user.address_country && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Country</label>
                        <p className="text-gray-900">{user.address_country}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📅 Timeline
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Account Created</label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Last Updated</label>
                    <p className="text-gray-900">{new Date(user.updated_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Password Management Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔑 Password Management
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Send a password reset code to the user's email address.
                </p>
                <ResetPasswordButton userId={userId} userEmail={user.email} token={token} />
              </div>

              {/* Edit Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Edit User Profile</h3>
                  <button
                    onClick={() => setIsEditingUser(!isEditingUser)}
                    className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                  >
                    {isEditingUser ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditingUser && editUser && (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">First Name</label>
                          <input
                            value={editUser.first_name || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, first_name: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                          <input
                            value={editUser.last_name || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, last_name: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Email</label>
                          <input
                            type="email"
                            value={editUser.email || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, email: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Phone</label>
                          <input
                            value={editUser.mobile_phone || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, mobile_phone: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">CPF</label>
                          <input
                            value={editUser.cpf || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, cpf: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Birth Date</label>
                          <input
                            type="date"
                            value={editUser.birth_date ? new Date(editUser.birth_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, birth_date: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Account Information */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Account Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Role</label>
                          <select
                            value={editUser.role || 'user'}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, role: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="master">Master</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Plan</label>
                          <select
                            value={editUser.plan || 'free'}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, plan: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          >
                            <option value="free">Free</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="pro">Pro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">User Type</label>
                          <select
                            value={editUser.user_type || 'individual'}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, user_type: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          >
                            <option value="individual">Individual</option>
                            <option value="business">Business</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Type Verified</label>
                          <select
                            value={editUser.user_type_verified ? 'true' : 'false'}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, user_type_verified: e.target.value === 'true' }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          >
                            <option value="false">Pending</option>
                            <option value="true">Verified</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Hangar Owner</label>
                          <select
                            value={editUser.is_hangar_owner ? 'true' : 'false'}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, is_hangar_owner: e.target.value === 'true' }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Aviation Information */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Aviation Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Aviation Role</label>
                          <input
                            value={editUser.aviation_role || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, aviation_role: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="e.g., Pilot, Student, Instructor"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Licenses</label>
                          <input
                            value={editUser.licencas || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, licencas: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="e.g., PPL, CPL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Ratings</label>
                          <input
                            value={editUser.habilitacoes || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, habilitacoes: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="e.g., IFR, Multi-engine"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Current Course</label>
                          <input
                            value={editUser.curso_atual || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, curso_atual: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="e.g., CPL training"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">Address Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">ZIP Code (CEP)</label>
                          <input
                            value={editUser.address_zip || ''}
                            onChange={(e) => {
                              const value = maskCEP(e.target.value);
                              setEditUser((prev: any) => ({ ...prev, address_zip: value }));
                              if (value.replace(/\D/g, '').length === 8) {
                                fetchAddressByCEP(value);
                              }
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Street</label>
                          <input
                            value={editUser.address_street || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_street: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Number</label>
                          <input
                            value={editUser.address_number || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_number: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Complement</label>
                          <input
                            value={editUser.address_complement || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_complement: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Neighborhood</label>
                          <input
                            value={editUser.address_neighborhood || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_neighborhood: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">City</label>
                          <input
                            value={editUser.address_city || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_city: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">State</label>
                          <input
                            value={editUser.address_state || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_state: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Country</label>
                          <input
                            value={editUser.address_country || ''}
                            onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_country: e.target.value }))}
                            className="w-full border border-gray-200 rounded px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveUser}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Moderation Records ({moderation.length})</h3>
              {moderation.length === 0 ? (
                <p className="text-gray-600 flex items-center gap-2">
                  ✓ No moderation records
                </p>
              ) : (
                <div className="space-y-4">
                  {moderation.map((record) => (
                    <div key={record.id} className={`border-2 border-l-4 rounded p-4 ${record.is_active
                      ? 'bg-yellow-50 border-yellow-200 border-l-yellow-500'
                      : 'bg-gray-50 border-gray-200 border-l-gray-500'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${actionTypeColors[record.action_type]}`}>
                              {record.action_type.toUpperCase()}
                            </span>
                            {record.is_active ? (
                              <span className="text-yellow-700 text-xs font-semibold">ACTIVE</span>
                            ) : (
                              <span className="text-gray-700 text-xs font-semibold">RESOLVED</span>
                            )}
                          </div>
                          <p className="text-gray-900 font-semibold">{record.reason}</p>
                          {record.severity && <p className="text-sm text-gray-600">Severity: {record.severity}</p>}
                          {record.suspension_end_date && (
                            <p className="text-sm text-gray-600">
                              Suspension ends: {new Date(record.suspension_end_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>{new Date(record.issued_at).toLocaleDateString()}</p>
                          {record.issued_by && <p className="text-xs">By: {record.issued_by}</p>}
                        </div>
                      </div>
                      {record.resolution_notes && !record.is_active && (
                        <div className="mt-3 pt-3 border-t border-gray-300 text-sm">
                          <p className="text-gray-700"><strong>Resolution:</strong> {record.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Registro de Atividades ({activities.length} total)</h3>
                <div className="flex gap-2">
                  <select
                    value={activityFilter}
                    onChange={(e) => { setActivityFilter(e.target.value); setActivityPage(1); }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="login">Login no Sistema</option>
                    <option value="logout">Logout do Sistema</option>
                    <option value="admin_user_update">Alteração de Perfil por Admin</option>
                    <option value="admin_business_update">Alteração de Empresa por Admin</option>
                    <option value="admin_hangar_update">Alteração de Hangar por Admin</option>
                    <option value="admin_moderation">Moderação e Status do Usuário</option>
                    <option value="admin_document_review">Aprovações/Rejeições de Documentos</option>
                    <option value="data_management">Gerenciamento de Dados</option>
                    <option value="course">Atividades de Curso</option>
                    <option value="flight_plan">Planos de Voo</option>
                    <option value="comments">Comentários</option>
                    <option value="hangar">Atividades de Hangar</option>
                  </select>
                  <select
                    value={activityCategoryFilter}
                    onChange={(e) => { setActivityCategoryFilter(e.target.value); setActivityPage(1); }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="authentication">Autenticação (Login/Logout)</option>
                    <option value="admin">Ações Administrativas</option>
                    <option value="data_management">Gerenciamento de Dados</option>
                    <option value="course">Cursos e Treinamentos</option>
                    <option value="flight_plan">Planejamento de Voo</option>
                    <option value="comments">Comentários e Discussões</option>
                    <option value="hangar">Operações de Hangar</option>
                  </select>
                </div>
              </div>

              {activities.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhuma atividade registrada</p>
              ) : (() => {
                const getActivityIcon = (type: string) => {
                  if (type.includes('login')) return '🔓';
                  if (type.includes('logout')) return '🔒';
                  if (type.includes('approve')) return '✅';
                  if (type.includes('reject')) return '❌';
                  if (type.includes('moderation')) return '🛡️';
                  if (type.includes('add') || type.includes('create')) return '➕';
                  if (type.includes('edit') || type.includes('update')) return '✏️';
                  if (type.includes('delete')) return '🗑️';
                  if (type.includes('comment')) return '💬';
                  return '📝';
                };

                const getCategoryBadgeClass = (category: string) => {
                  const classes: Record<string, string> = {
                    'authentication': 'bg-blue-100 text-blue-800',
                    'admin': 'bg-red-100 text-red-800',
                    'data_management': 'bg-purple-100 text-purple-800',
                    'comments': 'bg-green-100 text-green-800',
                    'course': 'bg-yellow-100 text-yellow-800',
                    'flight_plan': 'bg-orange-100 text-orange-800',
                    'hangar': 'bg-pink-100 text-pink-800',
                  };
                  return classes[category] || 'bg-gray-100 text-gray-800';
                };

                const getStatusBadgeClass = (status: string) => {
                  if (status === 'success') return 'bg-green-100 text-green-800';
                  if (status === 'failed') return 'bg-red-100 text-red-800';
                  return 'bg-yellow-100 text-yellow-800';
                };

                // Apply filters
                const filteredActivities = activities.filter((activity) => {
                  const typeMatch = activityFilter === 'all'
                    || activity.activity_type === activityFilter
                    || (activityFilter === 'login' && (activity.activity_type === 'login' || activity.activity_type === 'logout'))
                    || (activityFilter === 'admin_moderation' && activity.activity_type?.startsWith('admin_moderation_'))
                    || (activityFilter === 'admin_document_review'
                      && (activity.activity_type === 'admin_document_approve' || activity.activity_type === 'admin_document_reject'));
                  const categoryMatch = activityCategoryFilter === 'all' || activity.activity_category === activityCategoryFilter;
                  return typeMatch && categoryMatch;
                });

                // Pagination
                const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
                const startIndex = (activityPage - 1) * activitiesPerPage;
                const endIndex = startIndex + activitiesPerPage;
                const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

                return (
                  <>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoria</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Descrição</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">Data/Hora</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedActivities.map((activity) => (
                            <React.Fragment key={activity.id}>
                              <tr
                                onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                                className="hover:bg-gray-50 cursor-pointer transition"
                              >
                                <td className="px-4 py-3 text-center text-xl">
                                  {getActivityIcon(activity.activity_type)}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {activity.activity_type.replace(/_/g, ' ')}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadgeClass(activity.activity_category)}`}>
                                    {activity.activity_category?.replace(/_/g, ' ').toUpperCase() || 'GENERAL'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {activity.description || '—'}
                                </td>
                                <td className="px-4 py-3">
                                  {activity.status && (
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(activity.status)}`}>
                                      {activity.status}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                                  <div>{new Date(activity.created_at).toLocaleDateString('pt-BR')}</div>
                                  <div className="text-gray-500">{new Date(activity.created_at).toLocaleTimeString('pt-BR')}</div>
                                </td>
                              </tr>
                              {expandedActivity === activity.id && (
                                <tr className="bg-gray-50">
                                  <td colSpan={6} className="px-4 py-4">
                                    <div className="space-y-3 text-sm">
                                      {/* Target Information */}
                                      {activity.target_type && (
                                        <div>
                                          <span className="font-semibold text-gray-700">Alvo:</span>{' '}
                                          <span className="text-gray-900">{activity.target_type}</span>
                                          {activity.target_id && <span className="text-gray-600"> (ID: {activity.target_id})</span>}
                                        </div>
                                      )}

                                      {/* Data Changes */}
                                      {(activity.old_value || activity.new_value) && (
                                        <div className="bg-white p-3 rounded border border-gray-200">
                                          {activity.old_value && (
                                            <div className="text-red-700 mb-2">
                                              <strong>Anterior:</strong> {activity.old_value}
                                            </div>
                                          )}
                                          {activity.new_value && (
                                            <div className="text-green-700">
                                              <strong>Atual:</strong> {activity.new_value}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Additional Details */}
                                      {activity.details && (
                                        <details className="bg-white p-3 rounded border border-gray-200">
                                          <summary className="cursor-pointer font-semibold text-gray-700">Ver Detalhes JSON</summary>
                                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(activity.details, null, 2)}
                                          </pre>
                                        </details>
                                      )}

                                      {/* Technical Info */}
                                      <div className="text-xs text-gray-500 space-y-1 bg-white p-3 rounded border border-gray-200">
                                        {activity.ip_address && (
                                          <div>🌐 <strong>Endereço IP:</strong> {activity.ip_address}</div>
                                        )}
                                        {activity.user_agent && (
                                          <div className="break-all">🖥️ <strong>Navegador:</strong> {activity.user_agent}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Exibindo {startIndex + 1}-{Math.min(endIndex, filteredActivities.length)} de {filteredActivities.length} atividades
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                            disabled={activityPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Anterior
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Página {activityPage} de {totalPages}
                          </span>
                          <button
                            onClick={() => setActivityPage(Math.min(totalPages, activityPage + 1))}
                            disabled={activityPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Próxima →
                          </button>
                        </div>
                      </div>
                    )}

                    {filteredActivities.length === 0 && (
                      <div className="text-center py-8 text-gray-600">
                        Nenhuma atividade encontrada com os filtros selecionados
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Business Profile Tab */}
          {activeTab === 'business' && (
            <div>
              {businessUser ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Company Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Legal Name</label>
                        <p className="text-gray-900 font-semibold">{businessUser.legal_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Business Name</label>
                        <p className="text-gray-900">{businessUser.business_name || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">CNPJ</label>
                        <p className="text-gray-900 font-mono">{businessUser.cnpj || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Business Type</label>
                        <p className="text-gray-900">{businessUser.business_type || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Company Size</label>
                        <p className="text-gray-900">{businessUser.company_size || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Industry</label>
                        <p className="text-gray-900">{businessUser.industry || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Year Established</label>
                        <p className="text-gray-900">{businessUser.established_year || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Annual Hiring Volume</label>
                        <p className="text-gray-900">{businessUser.annual_hiring_volume || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">Primary Operations</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{businessUser.primary_operations || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      🔐 Account Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Role</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}>
                          {user.role.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Plan</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${planColors[user.plan]}`}>
                          {user.plan.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">User Type</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.user_type === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.user_type?.toUpperCase() || 'INDIVIDUAL'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Type Verified</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.user_type_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.user_type_verified ? '✓ VERIFIED' : '✗ PENDING'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Access Level</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${accessLevelColors[access?.access_level || 'active']}`}>
                          {(access?.access_level || 'active').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Hangar Owner</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.is_hangar_owner ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.is_hangar_owner ? '✓ YES' : '✗ NO'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Business Email</label>
                        <p className="text-gray-900">{businessUser.business_email || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Business Phone</label>
                        <p className="text-gray-900">{businessUser.business_phone || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Website</label>
                        <p className="text-blue-600">
                          {businessUser.website ? (
                            <a href={businessUser.website} target="_blank" rel="noopener noreferrer">{businessUser.website}</a>
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Representative</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Name</label>
                        <p className="text-gray-900">{businessUser.representative_name || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Title</label>
                        <p className="text-gray-900">{businessUser.representative_title || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Headquarters Address</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Street</label>
                        <p className="text-gray-900">{businessUser.headquarters_street || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Number</label>
                        <p className="text-gray-900">{businessUser.headquarters_number || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Complement</label>
                        <p className="text-gray-900">{businessUser.headquarters_complement || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Neighborhood</label>
                        <p className="text-gray-900">{businessUser.headquarters_neighborhood || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">City</label>
                        <p className="text-gray-900">{businessUser.headquarters_city || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">State</label>
                        <p className="text-gray-900">{businessUser.headquarters_state || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">ZIP Code</label>
                        <p className="text-gray-900">{businessUser.headquarters_zip || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Country</label>
                        <p className="text-gray-900">{businessUser.headquarters_country || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Operations</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Hiring Status</label>
                        <p className="text-gray-900">{businessUser.hiring_status || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Operation Status</label>
                        <p className="text-gray-900">{businessUser.operation_status || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Safety & Certification</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">FAA Certificate Number</label>
                        <p className="text-gray-900">{businessUser.faa_certificate_number || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Insurance Verified</label>
                        <p className="text-gray-900">{businessUser.insurance_verified ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Safety Record Public</label>
                        <p className="text-gray-900">{businessUser.safety_record_public ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Status</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Status</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${businessUser.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                          businessUser.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            businessUser.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {businessUser.verification_status?.toUpperCase() || 'PENDING'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Verified</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${businessUser.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {businessUser.is_verified ? '✓ YES' : '✗ NO'}
                        </p>
                      </div>
                      {businessUser.verification_date && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Verification Date</label>
                          <p className="text-gray-900">{new Date(businessUser.verification_date).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {businessUser.verification_notes && (
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700">Notes</label>
                          <p className="text-gray-900">{businessUser.verification_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {businessUser.description && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-900 whitespace-pre-wrap">{businessUser.description}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Created</label>
                        <p className="text-gray-900">{new Date(businessUser.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Last Updated</label>
                        <p className="text-gray-900">{new Date(businessUser.updated_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Edit Business Profile</h3>
                      <button
                        onClick={() => setIsEditingBusiness(!isEditingBusiness)}
                        className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                      >
                        {isEditingBusiness ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    {isEditingBusiness && editBusiness && (
                      <div className="space-y-6">
                        {/* Legal Entity Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Legal Entity</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Legal Name (Razão Social)</label>
                              <input
                                value={editBusiness.legal_name || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, legal_name: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Business Name (Nome Fantasia)</label>
                              <input
                                value={editBusiness.business_name || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, business_name: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">CNPJ</label>
                              <input
                                value={editBusiness.cnpj || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, cnpj: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Business Type (Tipo de Negócio)</label>
                              <input
                                value={editBusiness.business_type || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, business_type: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Contact Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Contact Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Business Email</label>
                              <input
                                type="email"
                                value={editBusiness.business_email || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, business_email: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Business Phone</label>
                              <input
                                value={editBusiness.business_phone || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, business_phone: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">Website</label>
                              <input
                                value={editBusiness.website || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, website: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Representative Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Representative Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Representative Name</label>
                              <input
                                value={editBusiness.representative_name || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, representative_name: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Representative Title</label>
                              <input
                                value={editBusiness.representative_title || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, representative_title: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Headquarters Address Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Headquarters Address</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Street (Rua)</label>
                              <input
                                value={editBusiness.headquarters_street || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_street: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Number (Número)</label>
                              <input
                                value={editBusiness.headquarters_number || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_number: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Complement</label>
                              <input
                                value={editBusiness.headquarters_complement || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_complement: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Neighborhood (Bairro)</label>
                              <input
                                value={editBusiness.headquarters_neighborhood || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_neighborhood: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">City (Cidade)</label>
                              <input
                                value={editBusiness.headquarters_city || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_city: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">State (Estado)</label>
                              <input
                                value={editBusiness.headquarters_state || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_state: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">ZIP Code (CEP)</label>
                              <input
                                value={editBusiness.headquarters_zip || ''}
                                onChange={(e) => {
                                  const masked = maskCEP(e.target.value);
                                  setEditBusiness((prev: any) => ({ ...prev, headquarters_zip: masked }));
                                  const cleaned = masked.replace(/\D/g, '');
                                  if (cleaned.length === 8) {
                                    fetchBusinessAddressByCEP(masked);
                                  } else {
                                    setBusinessCepStatus('');
                                  }
                                }}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                placeholder="00000-000"
                              />
                              {businessCepStatus && <p className="text-xs text-gray-500 mt-1">{businessCepStatus}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Country (País)</label>
                              <input
                                value={editBusiness.headquarters_country || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, headquarters_country: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Business Details Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Business Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Company Size</label>
                              <input
                                value={editBusiness.company_size || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, company_size: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Industry (Setor/Indústria)</label>
                              <input
                                value={editBusiness.industry || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, industry: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Year Established (Ano de Fundação)</label>
                              <input
                                type="number"
                                value={editBusiness.established_year || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, established_year: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Annual Hiring Volume (Vagas Anuais)</label>
                              <input
                                type="number"
                                value={editBusiness.annual_hiring_volume || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, annual_hiring_volume: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">Description</label>
                              <textarea
                                value={editBusiness.description || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, description: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                rows={4}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">Primary Operations</label>
                              <textarea
                                value={editBusiness.primary_operations || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, primary_operations: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Operations</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Hiring Status</label>
                              <select
                                value={editBusiness.hiring_status || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, hiring_status: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="">—</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Operation Status</label>
                              <select
                                value={editBusiness.operation_status || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, operation_status: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="">—</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Safety & Certification</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">FAA Certificate Number</label>
                              <input
                                value={editBusiness.faa_certificate_number || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, faa_certificate_number: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Insurance Verified</label>
                              <select
                                value={editBusiness.insurance_verified ? 'true' : 'false'}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, insurance_verified: e.target.value === 'true' }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Safety Record Public</label>
                              <select
                                value={editBusiness.safety_record_public ? 'true' : 'false'}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, safety_record_public: e.target.value === 'true' }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Verification Section */}
                        <div>
                          <h4 className="font-bold text-gray-800 mb-4">Verification</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Verification Status</label>
                              <select
                                value={editBusiness.verification_status || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, verification_status: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="">—</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">Is Verified</label>
                              <select
                                value={editBusiness.is_verified ? 'true' : 'false'}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, is_verified: e.target.value === 'true' }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                              >
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">Verification Notes</label>
                              <textarea
                                value={editBusiness.verification_notes || ''}
                                onChange={(e) => setEditBusiness((prev: any) => ({ ...prev, verification_notes: e.target.value }))}
                                className="w-full border border-gray-200 rounded px-3 py-2"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveBusiness}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">This user does not have a business profile registered.</p>
              )}
            </div>
          )}

          {/* Hangar Owner Tab */}
          {activeTab === 'hangar' && (
            <div>
              {user.is_hangar_owner ? (
                hangarOwner ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Hangar Owner Details</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Company Name</label>
                          <p className="text-gray-900">{hangarOwner.company_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">CNPJ</label>
                          <p className="text-gray-900">{hangarOwner.cnpj}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Phone</label>
                          <p className="text-gray-900">{hangarOwner.phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Website</label>
                          <p className="text-blue-600"><a href={hangarOwner.website} target="_blank" rel="noopener noreferrer">{hangarOwner.website}</a></p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700">Address</label>
                          <p className="text-gray-900">{hangarOwner.address}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700">Description</label>
                          <p className="text-gray-900">{hangarOwner.description}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Verification Status</label>
                          <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${hangarOwner.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {hangarOwner.verification_status?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Editar dados do proprietário</h3>
                        <button
                          onClick={() => setIsEditingHangar(!isEditingHangar)}
                          className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                        >
                          {isEditingHangar ? 'Cancelar' : 'Editar'}
                        </button>
                      </div>

                      {isEditingHangar && editHangar && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Empresa</label>
                            <input
                              value={editHangar.company_name || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, company_name: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">CNPJ</label>
                            <input
                              value={editHangar.cnpj || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, cnpj: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Telefone</label>
                            <input
                              value={editHangar.phone || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, phone: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Website</label>
                            <input
                              value={editHangar.website || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, website: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700">Endereço</label>
                            <input
                              value={editHangar.address || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, address: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700">Descrição</label>
                            <textarea
                              value={editHangar.description || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, description: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                              rows={4}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">Status</label>
                            <select
                              value={editHangar.verification_status || ''}
                              onChange={(e) => setEditHangar((prev: any) => ({ ...prev, verification_status: e.target.value }))}
                              className="w-full border border-gray-200 rounded px-3 py-2"
                            >
                              <option value="">—</option>
                              <option value="pending">pending</option>
                              <option value="approved">approved</option>
                              <option value="rejected">rejected</option>
                            </select>
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button
                              onClick={handleSaveHangar}
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                            >
                              Salvar alterações
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Hangar owner profile not set up yet</p>
                )
              ) : (
                <p className="text-gray-600">This user is not registered as a hangar owner</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
