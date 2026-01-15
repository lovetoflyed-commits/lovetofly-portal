"use client";
import { useAuth } from '@/context/AuthContext';
import { Role, hasPermission } from '../accessControl';
import UserManagementPanel from '@/components/UserManagementPanel';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role as Role | undefined;
  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_system'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Gestão de Usuários</b>
        <div className="mt-2 text-slate-700">
          Apenas administradores master e gestores de sistema podem gerenciar usuários.<br />
          Caso precise acessar esta área, solicite permissão ao administrador master.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-green-900">Gestão de Usuários</h1>
      <UserManagementPanel />
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/admin')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800"
        >
          ← Voltar ao Painel Administrativo
        </button>
      </div>
    </div>
  );
}
