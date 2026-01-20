'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BookingConflict {
  id: string;
  listing_id: string;
  hangar_number: string;
  aerodrome_name: string;
  check_in: string;
  check_out: string;
  booking_count: number;
  status: string;
}

export default function BookingConflictsPage() {
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingConflicts();
  }, []);

  const fetchBookingConflicts = async () => {
    try {
      const response = await fetch('/api/admin/hangarshare/bookings/conflicts');
      const data = await response.json();
      setConflicts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      // Mock data if API is not available
      setConflicts([]);
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: string) => {
    setResolving(conflictId);
    try {
      const response = await fetch(`/api/admin/hangarshare/bookings/${conflictId}/resolve`, {
        method: 'POST',
      });
      if (response.ok) {
        setConflicts(conflicts.filter(c => c.id !== conflictId));
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <p className="text-slate-600">Carregando conflitos de reservas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Link href="/admin/hangarshare" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Conflitos de Reservas</h1>
        <p className="text-slate-600 mt-1">Identifique e resolva sobreposições de datas</p>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-semibold">✓ Nenhum conflito detectado</p>
          <p className="text-green-700 mt-1">Todas as reservas estão sincronizadas</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Hangar</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Aeródromo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Check-in</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Check-out</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Reservas Conflitantes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {conflicts.map((conflict) => (
                  <tr key={conflict.id} className="hover:bg-slate-50 bg-orange-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{conflict.hangar_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{conflict.aerodrome_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(conflict.check_in).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(conflict.check_out).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                        {conflict.booking_count} reservas
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleResolve(conflict.id)}
                        disabled={resolving === conflict.id}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-slate-400 font-semibold"
                      >
                        {resolving === conflict.id ? 'Resolvendo...' : 'Revisar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
