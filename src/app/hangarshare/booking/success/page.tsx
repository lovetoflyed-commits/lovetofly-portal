'use client';

// Disable prerendering for this page since it depends on URL query parameters
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (paymentId) {
      // In a real app, you'd fetch booking details from the API using paymentId
      setBookingDetails({
        paymentId,
        status: 'confirmed',
        confirmationNumber: `LTF-${Date.now()}`,
      });
    }
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-4 w-24 h-24 flex items-center justify-center">
              <span className="text-6xl">✓</span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-green-600 mb-2">Reserva Confirmada!</h1>
          <p className="text-lg text-slate-600 mb-6">
            Sua reserva foi processada com sucesso
          </p>

          {bookingDetails && (
            <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200 text-left">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Número de Confirmação</p>
                  <p className="text-lg font-bold text-blue-900">{bookingDetails.confirmationNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">ID do Pagamento</p>
                  <p className="text-sm font-mono text-slate-700 break-all">{bookingDetails.paymentId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                  <p className="text-green-600 font-bold">Confirmado</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-900">
              📧 Um email de confirmação foi enviado para seu email cadastrado com todos os detalhes da reserva.
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/hangarshare')}
              className="px-6 py-3 bg-slate-200 text-slate-900 font-bold rounded-lg hover:bg-slate-300"
            >
              Voltar para Busca
            </button>
            <button
              onClick={() => router.push('/profile/bookings')}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Ver Minhas Reservas
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
            >
              Ir para Home
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-8">
            Você pode gerenciar suas reservas na sua área de perfil
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando sua confirmação...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
