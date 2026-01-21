"use client";
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';

export default function CommercialPanel() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_business'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Área Comercial</b>
        <div className="mt-2 text-slate-700">
          Esta área é restrita a administradores comerciais e gestores de negócios.<br />
          Se você precisa acessar funções de planos, pagamentos ou anúncios, contate o responsável pelo setor ou solicite permissão ao administrador master.
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-amber-900">Área Comercial</h1>
      <p className="text-slate-700">Gestão de planos, pagamentos, publicidade, taxas de serviços e transações comerciais dos usuários.</p>
      {/* TODO: Listar planos, pagamentos, anúncios, taxas, transações */}
    </div>
  );
}
