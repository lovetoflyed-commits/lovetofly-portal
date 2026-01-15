"use client";
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';

export default function FinancialPanel() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_finance'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Área Financeira</b>
        <div className="mt-2 text-slate-700">
          Esta área é restrita a administradores financeiros.<br />
          Para acessar relatórios, auditoria ou exportação de dados, solicite acesso ao gestor financeiro ou ao administrador master.
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-green-900">Área Financeira</h1>
      <p className="text-slate-700">Relatórios financeiros, exportação de dados, auditoria e integração Stripe.</p>
      {/* TODO: Relatórios, exportação, auditoria, integração Stripe */}
    </div>
  );
}
