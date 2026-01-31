'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';

type Campaign = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
  created_at: string;
};

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: string;
  campaign_id: number | null;
  campaign_name?: string | null;
  notes: string | null;
  created_at: string;
};

export default function AdminMarketingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const role = user?.role as Role | undefined;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'draft',
    start_date: '',
    end_date: ''
  });
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'new',
    campaign_id: '',
    notes: ''
  });

  const canAccess = role && (role === Role.MASTER || hasPermission(role, 'manage_marketing'));

  useEffect(() => {
    if (!token || !canAccess) {
      setLoading(false);
      return;
    }

    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/admin/marketing', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error('Failed to load marketing campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/admin/marketing/leads', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Failed to load marketing leads:', error);
      } finally {
        setLeadsLoading(false);
      }
    };

    fetchCampaigns();
    fetchLeads();
  }, [token, canAccess]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user?.id) return;

    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          created_by: user.id,
          start_date: form.start_date || null,
          end_date: form.end_date || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCampaigns((prev) => [data.campaign, ...prev]);
        setForm({ name: '', description: '', status: 'draft', start_date: '', end_date: '' });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/marketing/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...leadForm,
          campaign_id: leadForm.campaign_id ? Number(leadForm.campaign_id) : null,
          phone: leadForm.phone || null,
          source: leadForm.source || null,
          notes: leadForm.notes || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLeads((prev) => [data.lead, ...prev]);
        setLeadForm({
          name: '',
          email: '',
          phone: '',
          source: '',
          status: 'new',
          campaign_id: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Failed to create marketing lead:', error);
    }
  };

  if (!canAccess) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Marketing</b>
        <div className="mt-2 text-slate-700">
          Esta área é restrita a gestores de marketing e administradores master.<br />
          Solicite acesso ao responsável do setor.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-3xl font-black text-pink-900 mb-2">📢 Marketing</h1>
          <p className="text-slate-700">Acompanhe campanhas e registre novas iniciativas.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-pink-900 mb-4">Nova campanha</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Nome</label>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Campanha de verão"
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
                placeholder="Detalhes da campanha"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativa</option>
                <option value="paused">Pausada</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Início</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Fim</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-5 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700"
              >
                Salvar campanha
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-pink-900 mb-4">Campanhas recentes</h2>
          {loading ? (
            <p className="text-slate-600">Carregando campanhas...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-slate-600">Nenhuma campanha registrada.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                      <p className="text-sm text-slate-600">Status: {campaign.status}</p>
                    </div>
                    <span className="text-xs text-slate-500">#{campaign.id}</span>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-slate-700 mt-2">{campaign.description}</p>
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    Início: {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : '—'} •
                    Fim: {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('pt-BR') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-pink-900 mb-4">Novo lead</h2>
          <form onSubmit={handleLeadSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Nome</label>
              <input
                value={leadForm.name}
                onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Nome do lead"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">E-mail</label>
              <input
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="lead@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Telefone</label>
              <input
                value={leadForm.phone}
                onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="(11) 99999-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Origem</label>
              <input
                value={leadForm.source}
                onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Landing, Ads, Referral"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={leadForm.status}
                onChange={(event) => setLeadForm({ ...leadForm, status: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="new">Novo</option>
                <option value="contacted">Contatado</option>
                <option value="qualified">Qualificado</option>
                <option value="converted">Convertido</option>
                <option value="disqualified">Desqualificado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Campanha</label>
              <select
                value={leadForm.campaign_id}
                onChange={(event) => setLeadForm({ ...leadForm, campaign_id: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Sem campanha</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={String(campaign.id)}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Notas</label>
              <textarea
                value={leadForm.notes}
                onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg"
                rows={3}
                placeholder="Observações sobre o lead"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-5 py-2 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700"
              >
                Salvar lead
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-pink-900 mb-4">Leads recentes</h2>
          {leadsLoading ? (
            <p className="text-slate-600">Carregando leads...</p>
          ) : leads.length === 0 ? (
            <p className="text-slate-600">Nenhum lead registrado.</p>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{lead.name}</h3>
                      <p className="text-sm text-slate-600">{lead.email}</p>
                    </div>
                    <span className="text-xs text-slate-500">#{lead.id}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    Status: {lead.status} • Origem: {lead.source || '—'}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Campanha: {lead.campaign_name || '—'} • Criado em: {new Date(lead.created_at).toLocaleString('pt-BR')}
                  </div>
                  {lead.notes && (
                    <p className="mt-2 text-sm text-slate-700">{lead.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}