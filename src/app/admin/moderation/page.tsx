"use client";
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';
import { useEffect, useState } from 'react';

interface Listing {
  id: number;
  title: string;
  owner: string;
  status: string;
  created_at: string;
}

export default function ModerationPanel() {
  const { user, token } = useAuth();
  const role = user?.role as Role | undefined;
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reportActionLoading, setReportActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listings?status=pending');
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchReports() {
    if (!token) return;
    setReportsLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/reports?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } finally {
      setReportsLoading(false);
    }
  }

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchListings();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReportAction(id: number, status: 'reviewed' | 'actioned' | 'dismissed') {
    if (!token) return;
    setReportActionLoading(id);
    try {
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchReports();
      }
    } finally {
      setReportActionLoading(null);
    }
  }

  if (!role || !(role === Role.MASTER || hasPermission(role, 'manage_content'))) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Moderação de Conteúdo</b>
        <div className="mt-2 text-slate-700">
          Apenas moderadores e administradores master podem revisar conteúdo e gerenciar alertas.<br />
          Caso precise atuar na moderação, solicite permissão ao responsável pelo setor ou ao administrador master.
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-red-900">Moderação de Conteúdo</h1>
      <p className="text-slate-700 mb-6">Fila de revisão, alertas de violação de política, automação e workflow de escalonamento.</p>
      <h2 className="text-xl font-semibold mb-4">Anúncios Pendentes para Aprovação</h2>
      {loading ? (
        <div>Carregando anúncios...</div>
      ) : (
        <table className="w-full border mb-8">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2">ID</th>
              <th className="p-2">Título</th>
              <th className="p-2">Proprietário</th>
              <th className="p-2">Criado em</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(listing => (
              <tr key={listing.id} className="border-t">
                <td className="p-2">{listing.id}</td>
                <td className="p-2">{listing.title}</td>
                <td className="p-2">{listing.owner}</td>
                <td className="p-2">{new Date(listing.created_at).toLocaleString()}</td>
                <td className="p-2">
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                    disabled={actionLoading === listing.id}
                    onClick={() => handleAction(listing.id, 'approve')}
                  >Aprovar</button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    disabled={actionLoading === listing.id}
                    onClick={() => handleAction(listing.id, 'reject')}
                  >Rejeitar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-xl font-semibold mb-4">Denúncias de Conteúdo</h2>
      {reportsLoading ? (
        <div>Carregando denúncias...</div>
      ) : (
        <table className="w-full border mb-8">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2">ID</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Conteúdo</th>
              <th className="p-2">Motivo</th>
              <th className="p-2">Reportado por</th>
              <th className="p-2">Criado em</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-600">
                  Nenhuma denúncia pendente.
                </td>
              </tr>
            )}
            {reports.map(report => (
              <tr key={report.id} className="border-t">
                <td className="p-2">{report.id}</td>
                <td className="p-2">{report.content_type}</td>
                <td className="p-2">#{report.content_id}</td>
                <td className="p-2">{report.reason}</td>
                <td className="p-2">{report.reporter_name || report.reporter_email}</td>
                <td className="p-2">{new Date(report.created_at).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="bg-yellow-600 text-white px-2 py-1 rounded"
                    disabled={reportActionLoading === report.id}
                    onClick={() => handleReportAction(report.id, 'reviewed')}
                  >
                    Revisar
                  </button>
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    disabled={reportActionLoading === report.id}
                    onClick={() => handleReportAction(report.id, 'actioned')}
                  >
                    Ação
                  </button>
                  <button
                    className="bg-gray-600 text-white px-2 py-1 rounded"
                    disabled={reportActionLoading === report.id}
                    onClick={() => handleReportAction(report.id, 'dismissed')}
                  >
                    Dispensar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
