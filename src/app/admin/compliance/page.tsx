"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';
import { useRouter } from 'next/navigation';

type ComplianceRecord = {
  id: number;
  type: string;
  description: string | null;
  status: string;
  created_by: number | null;
  created_at: string;
};

export default function CompliancePanel() {
  const { user } = useAuth();
  const router = useRouter();
  const { token } = useAuth();
  const role = user?.role as Role | undefined;
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: '',
    description: '',
    status: 'pending'
  });
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
  const canAccess = role && (role === Role.MASTER || hasPermission(role, 'manage_compliance'));

  useEffect(() => {
    if (!token || !canAccess) {
      setLoading(false);
      return;
    }

    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/admin/compliance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch (error) {
        console.error('Failed to load compliance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [token, canAccess]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user?.id) return;

    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          created_by: user.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecords((prev) => [data.record, ...prev]);
        setForm({ type: '', description: '', status: 'pending' });
      }
    } catch (error) {
      console.error('Failed to create compliance record:', error);
    }
  };

  if (!canAccess) {
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
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-3xl font-black text-red-900 mb-2">🛡️ Compliance</h1>
          <p className="text-slate-700">Registre e acompanhe ocorrências de conformidade.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">Novo registro</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Tipo</label>
              <input
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="KYC, Auditoria, LGPD"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Descrição</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                rows={3}
                placeholder="Detalhes do registro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="pending">Pendente</option>
                <option value="in_review">Em análise</option>
                <option value="resolved">Resolvido</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Salvar registro
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">Registros recentes</h2>
          {loading ? (
            <p className="text-slate-600">Carregando registros...</p>
          ) : records.length === 0 ? (
            <p className="text-slate-600">Nenhum registro encontrado.</p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{record.type}</h3>
                      <p className="text-sm text-slate-600">Status: {record.status}</p>
                    </div>
                    <span className="text-xs text-slate-500">#{record.id}</span>
                  </div>
                  {record.description && (
                    <p className="text-sm text-slate-700 mt-2">{record.description}</p>
                  )}
                  <div className="mt-2 text-xs text-slate-500" suppressHydrationWarning>
                    Criado em: {new Date(record.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800">← Back to Admin Dashboard</button>
        </div>
      </div>
    </div>
  );
}
