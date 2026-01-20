'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PendingUser {
  id: string;
  company_name: string;
  cnpj: string;
  owner_type: string;
  verified: boolean;
  is_active: boolean;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  listings_count: number;
  created_at: string;
}

export default function ApproveUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/admin/hangarshare/owners');
      const data = await response.json();
      // Filter users that are not verified
      setUsers(data.filter((u: PendingUser) => !u.verified));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await fetch(`/api/admin/hangarshare/owners/${userId}/verify`, {
        method: 'POST',
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await fetch(`/api/admin/hangarshare/owners/${userId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <p className="text-slate-600">Carregando verificações pendentes...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Link href="/admin/hangarshare" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Verificações Pendentes</h1>
        <p className="text-slate-600 mt-1">Aprove ou rejeite novos anunciantes</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-semibold">✓ Nenhuma verificação pendente</p>
          <p className="text-green-700 mt-1">Todos os anunciantes foram verificados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Empresa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">CNPJ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Responsável</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Anúncios</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{user.company_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.listings_count}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={approving === user.id}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-400 font-semibold"
                        >
                          {approving === user.id ? 'Aprovando...' : 'Aprovar'}
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          disabled={approving === user.id}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-400 font-semibold"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
