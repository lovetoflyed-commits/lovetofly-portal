'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  id: string;
  user_id: string;
  hangar_id: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_status: string;
  created_at: string;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Only admin, staff, or master can access
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'master' && user.email !== 'lovetofly.ed@gmail.com')) {
    return (
      <div className="text-red-600 p-8">
        <b>Acesso negado &mdash; Gestão de Reservas</b>
        <div className="mt-2 text-slate-700">
          Apenas administradores e equipe autorizada podem gerenciar reservas de hangares.<br />
          Solicite permissão ao responsável pelo setor ou ao administrador master.
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-purple-900">Admin - Gestão de Reservas</h1>
          <p className="text-slate-600 mt-2">Visualize e gerencie todas as reservas e pagamentos de hangares</p>
        </div>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-600">Nenhuma reserva encontrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-purple-900">Reserva #{booking.id}</h3>
                    <p className="text-sm text-slate-600">ID do Usuário: {booking.user_id}</p>
                    <p className="text-sm text-slate-600">ID do Hangar: {booking.hangar_id}</p>
                    <p className="text-sm text-slate-600">Status: {booking.status}</p>
                    <p className="text-sm text-slate-600">Pagamento: {booking.payment_status}</p>
                    <p className="text-sm text-slate-600">Valor: R${booking.amount}</p>
                    <p className="text-xs text-slate-500 mt-4">Início: {new Date(booking.start_date).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-slate-500">Término: {new Date(booking.end_date).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-slate-500">Criado em: {new Date(booking.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-purple-900 mb-6">Booking Details</h2>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">User ID</p>
                      <p className="font-semibold">{selectedBooking.user_id}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Hangar ID</p>
                      <p className="font-semibold">{selectedBooking.hangar_id}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Status</p>
                      <p className="font-semibold">{selectedBooking.status}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Payment</p>
                      <p className="font-semibold">{selectedBooking.payment_status}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Amount</p>
                      <p className="font-semibold">R${selectedBooking.amount}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Start</p>
                      <p className="font-semibold">{new Date(selectedBooking.start_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">End</p>
                      <p className="font-semibold">{new Date(selectedBooking.end_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Created</p>
                      <p className="font-semibold">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 text-center">
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
