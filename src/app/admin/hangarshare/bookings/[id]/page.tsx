'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface BookingDetails {
  id: string;
  user_id: string;
  hangar_id: string;
  check_in: string;
  check_out: string;
  nights?: number | null;
  subtotal?: number | null;
  fees?: number | null;
  total_price?: number | null;
  status?: string | null;
  payment_method?: string | null;
  booking_type?: string | null;
  refund_policy_applied?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  hangar_title?: string | null;
  hangar_city?: string | null;
  hangar_state?: string | null;
}

const formatCurrency = (value?: number | null) => {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

export default function HangarBookingDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const bookingId = useMemo(() => params?.id?.toString() ?? '', [params]);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [editBooking, setEditBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hasFetchedRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__disableAutoRefresh = true;
    return () => {
      (window as any).__disableAutoRefresh = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'master' && user.role !== 'admin' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
      return;
    }

    if (!bookingId) {
      setLoading(false);
      return;
    }

    if (booking) {
      return;
    }

    if (hasFetchedRef.current === bookingId) {
      setLoading(false);
      return;
    }

    if (inFlightRef.current === bookingId) {
      return;
    }

    const fetchBooking = async () => {
      try {
        inFlightRef.current = bookingId;
        const res = await fetch(`/api/admin/hangarshare/bookings/${bookingId}`);
        if (!res.ok) {
          throw new Error('Erro ao carregar reserva');
        }
        const data = await res.json();
        setBooking(data);
        setEditBooking(data);
        hasFetchedRef.current = bookingId;
      } catch (error) {
        console.error('Failed to load booking details:', error);
      } finally {
        if (inFlightRef.current === bookingId) {
          inFlightRef.current = null;
        }
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, user, router]);

  const handleSave = async () => {
    if (!bookingId || !editBooking) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hangarshare/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in: editBooking.check_in,
            check_out: editBooking.check_out,
            nights: editBooking.nights,
            subtotal: editBooking.subtotal,
            fees: editBooking.fees,
            total_price: editBooking.total_price,
            status: editBooking.status,
            payment_method: editBooking.payment_method,
            booking_type: editBooking.booking_type,
            refund_policy_applied: editBooking.refund_policy_applied
          })
        }
      );
      if (!res.ok) {
        throw new Error('Falha ao salvar reserva');
      }
      const data = await res.json();
      setBooking(data.booking ?? editBooking);
      setEditBooking(data.booking ?? editBooking);
      setIsEditing(false);
    } catch (error) {
      console.error('Save booking error:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando dados...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-slate-900">Reserva não encontrada</h1>
          <button
            onClick={() => router.push('/admin/hangarshare?tab=bookings')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="space-y-2">
          <button
            onClick={() => router.push('/admin/hangarshare?tab=bookings')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Voltar para reservas
          </button>
          <h1 className="text-3xl font-black text-blue-900">Detalhes da Reserva</h1>
          <p className="text-slate-600">Edição completa da reserva do HangarShare.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Resumo</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditBooking(booking);
                }}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                {isEditing ? 'Cancelar edição' : 'Editar reserva'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300"
                >
                  Salvar alterações
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Usuário</p>
              <p className="font-semibold">{booking.user_name || '—'}</p>
              <p className="text-slate-500">{booking.user_email || ''}</p>
            </div>
            <div>
              <p className="text-slate-500">Hangar</p>
              <p className="font-semibold">{booking.hangar_title || '—'}</p>
              <p className="text-slate-500">{booking.hangar_city || ''} {booking.hangar_state ? `- ${booking.hangar_state}` : ''}</p>
            </div>
            <div>
              <p className="text-slate-500">Check-in</p>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editBooking?.check_in ? editBooking.check_in.slice(0, 16) : ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, check_in: e.target.value } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{new Date(booking.check_in).toLocaleString('pt-BR')}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Check-out</p>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editBooking?.check_out ? editBooking.check_out.slice(0, 16) : ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, check_out: e.target.value } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{new Date(booking.check_out).toLocaleString('pt-BR')}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              {isEditing ? (
                <select
                  value={editBooking?.status ?? ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
              ) : (
                <p className="font-semibold">{booking.status || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Tipo de reserva</p>
              {isEditing ? (
                <input
                  value={editBooking?.booking_type ?? ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, booking_type: e.target.value } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{booking.booking_type || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Subtotal</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editBooking?.subtotal ?? ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, subtotal: e.target.value ? Number(e.target.value) : null } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{formatCurrency(booking.subtotal)}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Taxas</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editBooking?.fees ?? ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, fees: e.target.value ? Number(e.target.value) : null } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{formatCurrency(booking.fees)}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Total</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editBooking?.total_price ?? ''}
                  onChange={(e) => setEditBooking((prev) => prev ? { ...prev, total_price: e.target.value ? Number(e.target.value) : null } : prev)}
                  className="w-full border border-slate-200 rounded px-3 py-2"
                />
              ) : (
                <p className="font-semibold">{formatCurrency(booking.total_price)}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}