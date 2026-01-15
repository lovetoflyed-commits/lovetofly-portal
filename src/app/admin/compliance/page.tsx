"use client";
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';
import { useRouter } from 'next/navigation';

export default function CompliancePanel() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role as Role | undefined;
  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_compliance'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Compliance & Segurança</b>
        <div className="mt-2 text-slate-700">
          Esta área é restrita a gestores de compliance e administradores master.<br />
          Para acessar logs, alertas ou conformidade legal, solicite acesso ao responsável pelo setor ou ao administrador master.
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black text-red-900 mb-4">🛡️ Compliance</h1>
        <p className="text-slate-700 mb-6">Legal & regulatory</p>
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 text-red-900">Coming soon</h2>
          <ul className="list-disc ml-6 text-slate-600">
            <li>Document policies</li>
            <li>Audit logs</li>
          </ul>
        </div>
        <div className="mt-8 text-center">
          <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800">← Back to Admin Dashboard</button>
        </div>
      </div>
    </div>
  );
}
