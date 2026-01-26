'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

const updateTypeOptions = [
  { value: 'start', label: 'Início da operação' },
  { value: 'enroute', label: 'Em rota' },
  { value: 'stopover', label: 'Escala' },
  { value: 'arrived', label: 'Chegada' },
  { value: 'interruption', label: 'Interrupção' },
];

interface OperationUpdate {
  id: number;
  update_type: string;
  status_label: string | null;
  message: string;
  flight_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  stopover_airport: string | null;
  started_at: string | null;
  arrived_at: string | null;
  interruption_reason: string | null;
  created_at: string;
}

export default function TrasladosStatusPage() {
  const [requestId, setRequestId] = useState('');
  const [updates, setUpdates] = useState<OperationUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    updateType: 'start',
    statusLabel: '',
    message: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    stopoverAirport: '',
    startedAt: '',
    arrivedAt: '',
    interruptionReason: '',
  });

  const fetchUpdates = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/traslados/updates?requestId=${id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || 'Erro ao carregar atualizações');
      }
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atualizações');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId.trim()) {
      setError('Informe o protocolo do traslado.');
      return;
    }
    fetchUpdates(requestId.trim());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!requestId.trim() || !formData.message.trim()) {
      setSubmitError('Informe o protocolo e a mensagem do status.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/traslados/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          requestId: Number(requestId),
          updateType: formData.updateType,
          statusLabel: formData.statusLabel,
          message: formData.message,
          flightNumber: formData.flightNumber,
          departureAirport: formData.departureAirport,
          arrivalAirport: formData.arrivalAirport,
          stopoverAirport: formData.stopoverAirport,
          startedAt: formData.startedAt,
          arrivedAt: formData.arrivedAt,
          interruptionReason: formData.interruptionReason,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || 'Erro ao enviar atualização');
      }

      await fetchUpdates(requestId.trim());
      setFormData((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar atualização');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setUpdates([]);
  }, [requestId]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900">Status da operação</h1>
                <p className="mt-3 text-sm text-gray-600">
                  Contratante e piloto atualizam o andamento do traslado. O portal apenas registra as informações.
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="request-id">
                      Protocolo do traslado
                    </label>
                    <input
                      id="request-id"
                      type="text"
                      value={requestId}
                      onChange={(event) => setRequestId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      placeholder="TR-123"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Buscar status
                  </button>
                </form>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Atualizar operação</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Tipo de atualização</label>
                      <select
                        value={formData.updateType}
                        onChange={(event) => setFormData({ ...formData, updateType: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      >
                        {updateTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Status curto</label>
                      <input
                        type="text"
                        value={formData.statusLabel}
                        onChange={(event) => setFormData({ ...formData, statusLabel: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        placeholder="Ex.: Em rota"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Mensagem</label>
                    <textarea
                      value={formData.message}
                      onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Aeroporto partida</label>
                      <input
                        type="text"
                        value={formData.departureAirport}
                        onChange={(event) => setFormData({ ...formData, departureAirport: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Aeroporto chegada</label>
                      <input
                        type="text"
                        value={formData.arrivalAirport}
                        onChange={(event) => setFormData({ ...formData, arrivalAirport: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Escala</label>
                      <input
                        type="text"
                        value={formData.stopoverAirport}
                        onChange={(event) => setFormData({ ...formData, stopoverAirport: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Número do voo</label>
                      <input
                        type="text"
                        value={formData.flightNumber}
                        onChange={(event) => setFormData({ ...formData, flightNumber: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Início</label>
                      <input
                        type="datetime-local"
                        value={formData.startedAt}
                        onChange={(event) => setFormData({ ...formData, startedAt: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Chegada</label>
                      <input
                        type="datetime-local"
                        value={formData.arrivedAt}
                        onChange={(event) => setFormData({ ...formData, arrivedAt: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {formData.updateType === 'interruption' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Motivo da interrupção</label>
                      <input
                        type="text"
                        value={formData.interruptionReason}
                        onChange={(event) => setFormData({ ...formData, interruptionReason: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                  )}

                  {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-300"
                    >
                      {isSubmitting ? 'Enviando...' : 'Salvar atualização'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Histórico</h2>
                {loading ? (
                  <div className="mt-4 text-sm text-slate-600">Carregando...</div>
                ) : updates.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-600">Nenhuma atualização registrada.</div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {updates.map((update) => (
                      <div key={update.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(update.created_at).toLocaleString('pt-BR')}</span>
                          <span className="uppercase">{update.update_type}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">{update.message}</div>
                        {update.status_label && (
                          <div className="mt-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
                            {update.status_label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
