'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'inactive', label: 'Inativo' },
];

interface PilotDocument {
  pilot_id: number;
  document_type: string;
  file_path: string;
  file_name: string | null;
}

interface Pilot {
  id: number;
  full_name: string;
  contact_email: string;
  contact_phone: string | null;
  license_type: string;
  license_number: string;
  medical_expiry: string | null;
  total_hours: number | null;
  ratings: string | null;
  categories: string | null;
  base_city: string | null;
  availability: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function AdminTrasladosPilotsPage() {
  const { user, token } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [documents, setDocuments] = useState<PilotDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master')) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado — Pilotos Traslados</b>
        <div className="mt-2 text-slate-700">
          Apenas administradores e equipe autorizada podem gerenciar pilotos.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPilots();
  }, [statusFilter, token]);

  const fetchPilots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traslados/pilots?status=${statusFilter}&includeDocs=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPilots(data.pilots || []);
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching pilots:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentsByPilot = useMemo(() => {
    return documents.reduce<Record<number, PilotDocument[]>>((acc, doc) => {
      if (!acc[doc.pilot_id]) acc[doc.pilot_id] = [];
      acc[doc.pilot_id].push(doc);
      return acc;
    }, {});
  }, [documents]);

  const openPilot = (pilot: Pilot) => {
    setSelectedPilot(pilot);
    setStatusUpdate(pilot.status || 'pending');
    setAdminNotes(pilot.notes || '');
  };

  const handleSave = async () => {
    if (!selectedPilot) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/traslados/pilots/${selectedPilot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusUpdate, notes: adminNotes }),
      });
      if (res.ok) {
        setSelectedPilot(null);
        fetchPilots();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao atualizar piloto');
      }
    } catch (error) {
      console.error('Error updating pilot:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-blue-900">Admin — Pilotos Traslados</h1>
            <p className="text-slate-600 mt-2">Valide documentação e aprove cadastros.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">Carregando...</div>
        ) : pilots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">Nenhum piloto encontrado</div>
        ) : (
          <div className="grid gap-4">
            {pilots.map((pilot) => (
              <div key={pilot.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-blue-900">{pilot.full_name}</h3>
                    <p className="text-sm text-slate-600">
                      {pilot.license_type} • {pilot.license_number}
                    </p>
                    <p className="text-xs text-slate-500">Base: {pilot.base_city || '—'}</p>
                  </div>
                  <button
                    onClick={() => openPilot(pilot)}
                    className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPilot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-blue-900">{selectedPilot.full_name}</h2>
                <p className="text-sm text-slate-600">{selectedPilot.contact_email}</p>
              </div>
              <button onClick={() => setSelectedPilot(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
              <div>
                <div className="font-semibold text-slate-800">Contato</div>
                <div>{selectedPilot.contact_phone || 'Telefone não informado'}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Horas totais</div>
                <div>{selectedPilot.total_hours ?? '—'}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Habilitações</div>
                <div>{selectedPilot.ratings || '—'}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">Categorias</div>
                <div>{selectedPilot.categories || '—'}</div>
              </div>
            </div>

            {documentsByPilot[selectedPilot.id]?.length ? (
              <div className="mt-6">
                <div className="font-semibold text-slate-800 mb-2">Documentos</div>
                <div className="flex flex-wrap gap-2">
                  {documentsByPilot[selectedPilot.id].map((doc) => (
                    <a
                      key={`${selectedPilot.id}-${doc.file_path}`}
                      href={doc.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-blue-200 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                    >
                      {doc.document_type}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={statusUpdate}
                  onChange={(event) => setStatusUpdate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Notas internas</label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedPilot(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
