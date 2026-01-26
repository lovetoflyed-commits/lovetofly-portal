"use client";
import { useAuth } from '@/context/AuthContext';
import { Role, hasPermission } from '../accessControl';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const features = [
  { key: "system", label: "Sistema", permission: "manage_system" },
  { key: "support", label: "Suporte", permission: "manage_support" },
  { key: "content", label: "Conteúdo/Comunidade", permission: "manage_content" },
  { key: "business", label: "Empregadores/Negócios", permission: "manage_business" },
  { key: "finance", label: "Financeiro", permission: "manage_finance" },
  { key: "marketing", label: "Marketing/Comunicação", permission: "manage_marketing" },
  { key: "compliance", label: "Compliance/Segurança", permission: "manage_compliance" },
];

interface AdminLog {
  id: number;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/activity/log?limit=10');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.activities || []);
      }
    } finally {
      setLoadingLogs(false);
    }
  }

  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_system'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Painel Administrativo</b>
        <div className="mt-2 text-slate-700">
          Este painel é restrito a administradores master e gestores de sistema.<br />
          Para acessar recursos administrativos, solicite permissão ao administrador master.
        </div>
      </div>
    );
  }
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <Link 
          href="/" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          ← Voltar ao Portal
        </Link>
      </div>
      <p className="mb-6">Bem-vindo, <b>{user?.name}</b>! Seu nível de acesso: <b>{role}</b></p>
      <ul className="space-y-2 mb-8">
        {features.map((f) =>
          hasPermission(role, f.permission as any) ? (
            <li key={f.key} className="p-4 bg-gray-100 rounded shadow">
              <span className="font-semibold">{f.label}</span> — acesso permitido
            </li>
          ) : null
        )}
      </ul>
      <h2 className="text-xl font-semibold mb-4">Últimas Ações Administrativas</h2>
      {loadingLogs ? (
        <div>Carregando logs...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2">Data</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Ação</th>
              <th className="p-2">Alvo</th>
              <th className="p-2">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-2">{log.admin_id}</td>
                <td className="p-2">{log.action_type}</td>
                <td className="p-2">{log.target_type} #{log.target_id}</td>
                <td className="p-2">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {role === Role.MASTER && (
        <div className="mt-6">Gestão de equipe administrativa (StaffManagementPanel)</div>
      )}
    </main>
  );
}
