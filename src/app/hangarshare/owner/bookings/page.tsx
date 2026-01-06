'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  hangarIcao: string;
  hangarNumber: string;
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadBookings();
  }, [user, router]);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/hangarshare/owner/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar reservas');
      }

      const data = await res.json();
      
      // Transform API response to match component interface
      const transformedBookings = (data.bookings || []).map((booking: any) => ({
        id: booking.id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        hangarIcao: booking.icaoCode,
        hangarNumber: booking.hangarNumber,
        checkInDate: booking.checkin ? new Date(booking.checkin).toISOString().split('T')[0] : '',
        checkOutDate: booking.checkout ? new Date(booking.checkout).toISOString().split('T')[0] : '',
        totalDays: booking.checkout && booking.checkin ? Math.ceil((new Date(booking.checkout).getTime() - new Date(booking.checkin).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        dailyRate: booking.dailyRate || 0,
        totalAmount: booking.total || 0,
        status: booking.booking_status || 'pending',
        createdAt: booking.created_at,
      }));

      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Erro ao carregar reservas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/hangarshare/owner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar reserva');
      }
      
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus as any } : b
      ));
      setShowModal(false);
      alert('✓ Reserva atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(`Erro ao atualizar reserva: ${error instanceof Error ? error.message : 'Tente novamente'}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-700">Carregando...</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-700">Carregando reservas...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar ao Painel
          </button>
          <h1 className="text-3xl font-black text-blue-900">Gerenciamento de Reservas</h1>
          <p className="text-slate-600 mt-2">Visualize e gerencie todas as suas reservas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">TOTAL</p>
            <p className="text-2xl font-black text-blue-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">PENDENTES</p>
            <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">CONFIRMADAS</p>
            <p className="text-2xl font-black text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">CONCLUÍDAS</p>
            <p className="text-2xl font-black text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">CANCELADAS</p>
            <p className="text-2xl font-black text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-slate-500 text-xs font-bold">RECEITA</p>
            <p className="text-lg font-black text-green-600">
              R$ {stats.revenue.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'Todas' : getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Cliente</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Hangar</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Check-in</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Check-out</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Dias</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Valor</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => (
                    <tr key={booking.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900">{booking.clientName}</p>
                          <p className="text-xs text-slate-500">{booking.clientEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-600">{booking.hangarIcao}</p>
                        <p className="text-sm text-slate-600">Hangar {booking.hangarNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {new Date(booking.checkInDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {new Date(booking.checkOutDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-bold">{booking.totalDays}d</td>
                      <td className="px-6 py-4 text-green-600 font-bold">
                        R$ {booking.totalAmount.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-600 font-bold">Nenhuma reserva encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              Gerenciar Reserva #{selectedBooking.id}
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-bold text-slate-600 mb-3">Detalhes:</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Cliente:</strong> {selectedBooking.clientName}</p>
                <p><strong>Hangar:</strong> {selectedBooking.hangarIcao} - {selectedBooking.hangarNumber}</p>
                <p><strong>Período:</strong> {new Date(selectedBooking.checkInDate).toLocaleDateString('pt-BR')} a {new Date(selectedBooking.checkOutDate).toLocaleDateString('pt-BR')}</p>
                <p><strong>Valor Total:</strong> R$ {selectedBooking.totalAmount.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                    className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                  >
                    ✓ Confirmar Reserva
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    ✕ Rejeitar Reserva
                  </button>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    ✓ Marcar como Concluída
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                  >
                    ✕ Cancelar Reserva
                  </button>
                </>
              )}

              {(selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled') && (
                <p className="text-center text-slate-600 font-bold py-3">
                  Esta reserva não pode ser alterada
                </p>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
