"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Booking = {
  id: number;
  hangarId: number;
  hangarNumber: string;
  airportIcao: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal: string;
  fees: string;
  totalPrice: string;
  status: string;
  bookingType?: 'refundable' | 'non_refundable';
  paymentMethod: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export const dynamic = 'force-dynamic';

export default function UserBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setError(null);
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/user/bookings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to load bookings');
        }
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar reservas');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [user?.id]);

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      setCancelMessage('Por favor, indique o motivo do cancelamento');
      return;
    }

    setCancelLoading(true);
    setCancelMessage('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/hangarshare/booking/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          reason: cancelReason,
          refundType: 'full',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setCancelMessage(error.error || 'Erro ao cancelar reserva');
        return;
      }

      const data = await response.json();
      setCancelMessage(`✓ Cancelamento realizado! Você receberá R$ ${Number(data.booking.refundAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de reembolso`);

      // Update local state
      setBookings(bookings.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
      ));

      setTimeout(() => {
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason('');
        setCancelMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setCancelMessage('Erro ao processar cancelamento');
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancel = (booking: Booking) => {
    return ['pending', 'confirmed'].includes(booking.status);
  };

  const currentBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const historyBookings = bookings.filter((b) => b.status !== 'confirmed' && b.status !== 'pending');
  const visibleBookings = showHistory ? historyBookings : currentBookings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-semibold">Minhas Reservas</h1>
      </div>
      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !showHistory && currentBookings.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6">
          <p className="text-blue-900 font-semibold">Você não possui nenhuma reserva atualmente.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-white border border-blue-300 text-blue-900 font-bold rounded-lg hover:bg-blue-100"
            >
              Ver Reservas Anteriores
            </button>
            <button
              onClick={() => router.push('/hangarshare')}
              className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
            >
              Fazer Nova Reserva
            </button>
          </div>
        </div>
      )}

      {!loading && showHistory && bookings.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p>Nenhuma reserva encontrada.</p>
        </div>
      )}

      {!loading && (showHistory || currentBookings.length > 0) && (
        <div className="mb-4 flex items-center gap-3">
          {!showHistory ? (
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100"
            >
              Ver Reservas Anteriores
            </button>
          ) : (
            <button
              onClick={() => setShowHistory(false)}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100"
            >
              Ver Reservas Atuais
            </button>
          )}
          <button
            onClick={() => router.push('/hangarshare')}
            className="px-3 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Fazer Nova Reserva
          </button>
        </div>
      )}

      <div className="space-y-4">
        {visibleBookings.map((b) => (
          <div key={b.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Reserva #{b.id}</p>
                <h2 className="text-lg font-medium">
                  Hangar {b.hangarNumber} • {b.airportIcao}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-sm ${
                  b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {b.status}
                </span>
                {b.bookingType && (
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    b.bookingType === 'non_refundable'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {b.bookingType === 'non_refundable' ? 'Não reembolsável' : 'Reembolsável'}
                  </span>
                )}
                {canCancel(b) && (
                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowCancelModal(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
              <div>
                <span className="text-gray-500">Check-in</span>
                <div>{new Date(b.checkIn).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <span className="text-gray-500">Check-out</span>
                <div>{new Date(b.checkOut).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <span className="text-gray-500">Noites</span>
                <div>{b.nights}</div>
              </div>
              <div>
                <span className="text-gray-500">Total</span>
                <div>R$ {Number(b.totalPrice).toFixed(2).replace('.', ',')}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <div>Pagamento: {b.paymentMethod || '—'}</div>
              {b.paymentDate && (
                <div>Pago em: {new Date(b.paymentDate).toLocaleString('pt-BR')}</div>
              )}
              {b.fees && (
                <div>Taxa de serviço (não reembolsável): R$ {Number(b.fees).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Cancelar Reserva</h2>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-700">
                <strong>Reserva:</strong> {selectedBooking.airportIcao} - Hangar {selectedBooking.hangarNumber}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Período:</strong> {new Date(selectedBooking.checkIn).toLocaleDateString('pt-BR')} a {new Date(selectedBooking.checkOut).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Total:</strong> R$ {Number(selectedBooking.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Motivo do Cancelamento *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explique por que deseja cancelar esta reserva..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={4}
                disabled={cancelLoading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              {selectedBooking.bookingType === 'non_refundable' ? (
                <p className="text-sm text-blue-900 font-bold">
                  ℹ️ Esta reserva é <span className="text-red-600">não reembolsável</span> (reservas no mesmo dia ou dia anterior após 18h). Nenhum valor será reembolsado.
                </p>
              ) : (
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Reembolso:</strong> Você receberá reembolso apenas sobre o valor do booking. Taxa de serviço não é reembolsável. O valor depende do tempo até a data de check-in.
                </p>
              )}
            </div>

            {cancelMessage && (
              <div className={`mb-4 p-4 rounded-lg text-sm font-bold ${
                cancelMessage.includes('✓')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {cancelMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                  setCancelReason('');
                  setCancelMessage('');
                }}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 disabled:opacity-50"
                disabled={cancelLoading}
              >
                Voltar
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={cancelLoading || !cancelReason.trim()}
              >
                {cancelLoading ? 'Processando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
