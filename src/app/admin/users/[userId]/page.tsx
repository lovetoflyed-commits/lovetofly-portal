'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  user: any;
  access: any;
  moderation: any[];
  activities: any[];
  hangarOwner: any;
  stats: any;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingHangar, setIsEditingHangar] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editHangar, setEditHangar] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const hasFetchedRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) {
      setLoading(false);
      return;
    }

    if (inFlightRef.current) {
      return;
    }

    if (profile) {
      return;
    }

    const fetchProfile = async () => {
      try {
        inFlightRef.current = true;
        const res = await fetch(`/api/admin/users/${userId}/profile`);
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
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (profile?.user) {
      setEditUser(profile.user);
    }
    if (profile?.hangarOwner) {
      setEditHangar(profile.hangarOwner);
    }
  }, [profile]);

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: editUser })
      });
      if (!res.ok) {
        throw new Error('Falha ao salvar perfil');
      }
      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, user: data.user || prev.user } : prev);
      setIsEditingUser(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
      alert('Erro ao salvar perfil');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hangarOwner: editHangar })
      });
      if (!res.ok) {
        throw new Error('Falha ao salvar dados do hangar');
      }
      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, hangarOwner: data.hangarOwner || prev.hangarOwner } : prev);
      setIsEditingHangar(false);
    } catch (error) {
      console.error('Error saving hangar owner:', error);
      alert('Erro ao salvar dados do hangar');
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

  const { user, access, moderation, activities, hangarOwner, stats } = profile;
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
          <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600">{user.email}</p>
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
        <div className="border-b border-gray-200 flex">
          {['overview', 'moderation', 'activities', 'hangar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'moderation' && 'Moderation'}
              {tab === 'activities' && 'Activities'}
              {tab === 'hangar' && 'Hangar Owner'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  {user.cpf && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">CPF</label>
                      <p className="text-gray-900">{user.cpf}</p>
                    </div>
                  )}
                  {user.mobile_phone && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Phone</label>
                      <p className="text-gray-900">{user.mobile_phone}</p>
                    </div>
                  )}
                  {user.birth_date && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Birth Date</label>
                      <p className="text-gray-900">{new Date(user.birth_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {user.aviation_role && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Aviation Role</label>
                      <p className="text-gray-900">{user.aviation_role}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-4">
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
                    <label className="block text-sm font-semibold text-gray-700">Access Level</label>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${accessLevelColors[access?.access_level || 'active']}`}>
                      {(access?.access_level || 'active').toUpperCase()}
                    </p>
                  </div>
                  {access?.access_reason && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Access Reason</label>
                      <p className="text-gray-900">{access.access_reason}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Member Since</label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {(user.address_street || user.address_city) && (
                <div className="col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Address</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-900">
                      {[
                        user.address_street && `${user.address_street}, ${user.address_number}${user.address_complement ? ' ' + user.address_complement : ''}`,
                        user.address_neighborhood,
                        user.address_city,
                        user.address_state,
                        user.address_zip
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Editar Perfil</h3>
                  <button
                    onClick={() => setIsEditingUser(!isEditingUser)}
                    className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                  >
                    {isEditingUser ? 'Cancelar' : 'Editar'}
                  </button>
                </div>

                {isEditingUser && editUser && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Nome</label>
                        <input
                          value={editUser.first_name || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, first_name: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Sobrenome</label>
                        <input
                          value={editUser.last_name || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, last_name: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Email</label>
                        <input
                          value={editUser.email || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, email: e.target.value }))}
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
                        <label className="block text-sm font-semibold text-gray-700">Telefone</label>
                        <input
                          value={editUser.mobile_phone || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, mobile_phone: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Data de Nascimento</label>
                        <input
                          type="date"
                          value={editUser.birth_date ? String(editUser.birth_date).slice(0, 10) : ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, birth_date: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Função</label>
                        <input
                          value={editUser.aviation_role || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, aviation_role: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Plano</label>
                        <select
                          value={editUser.plan || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, plan: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        >
                          <option value="">—</option>
                          <option value="free">free</option>
                          <option value="standard">standard</option>
                          <option value="premium">premium</option>
                          <option value="pro">pro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Role</label>
                        <select
                          value={editUser.role || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, role: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        >
                          <option value="">—</option>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="master">master</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Rua</label>
                        <input
                          value={editUser.address_street || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_street: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Número</label>
                        <input
                          value={editUser.address_number || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_number: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Complemento</label>
                        <input
                          value={editUser.address_complement || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_complement: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Bairro</label>
                        <input
                          value={editUser.address_neighborhood || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_neighborhood: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Cidade</label>
                        <input
                          value={editUser.address_city || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_city: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Estado</label>
                        <input
                          value={editUser.address_state || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_state: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">CEP</label>
                        <input
                          value={editUser.address_zip || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_zip: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">País</label>
                        <input
                          value={editUser.address_country || ''}
                          onChange={(e) => setEditUser((prev: any) => ({ ...prev, address_country: e.target.value }))}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveUser}
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
                    <div key={record.id} className={`border-2 border-l-4 rounded p-4 ${
                      record.is_active 
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Log ({activities.length})</h3>
              {activities.length === 0 ? (
                <p className="text-gray-600">No activities recorded</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{activity.activity_type}</p>
                          <p className="text-gray-700">{activity.description}</p>
                          {activity.ip_address && (
                            <p className="text-xs text-gray-500 mt-2">IP: {activity.ip_address}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                          <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            hangarOwner.verification_status === 'verified' 
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
