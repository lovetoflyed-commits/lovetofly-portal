'use client';

// Disable prerendering for this page since it depends on URL query parameters
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm({ clientSecret, bookingData, onSuccess }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Erro ao processar pagamento');
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess(result.paymentIntent);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#333',
                '::placeholder': { color: '#aaa' },
              },
              invalid: { color: '#e63946' },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processando...' : `Pagar R$ ${(bookingData.totalPrice).toFixed(2)}`}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!publishableKey) {
        setError('Stripe publishable key ausente. Adicione NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ao .env.local e reinicie o servidor.');
        setLoading(false);
        return;
      }

      try {
        const hangarId = searchParams.get('hangarId');
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');
        const totalPrice = searchParams.get('totalPrice');
        const subtotal = searchParams.get('subtotal');
        const fees = searchParams.get('fees');
        const userId = searchParams.get('userId');

        if (!hangarId || !checkIn || !checkOut || !totalPrice || !userId) {
          setError('Dados de reserva inválidos');
          return;
        }

        // Get auth token from localStorage (assuming it's stored there)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // Call booking confirm endpoint
        const response = await fetch('/api/hangarshare/booking/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({
            hangarId: parseInt(hangarId),
            userId: parseInt(userId),
            checkIn,
            checkOut,
            totalPrice: parseFloat(totalPrice),
            subtotal: parseFloat(subtotal || totalPrice),
            fees: parseFloat(fees || '0'),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao inicializar checkout');
        }

        const data = await response.json();
        setBookingData({
          ...data.booking,
          totalPrice: parseFloat(totalPrice),
        });
        setClientSecret(data.payment.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [searchParams]);

  const handlePaymentSuccess = (paymentIntent: any) => {
    // Redirect to success page
    router.push(`/hangarshare/booking/success?paymentId=${paymentIntent.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-slate-600 mb-6">{error || 'Não foi possível carregar os dados da reserva'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-bold mb-6 flex items-center gap-2"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-black text-blue-900 mb-6">Confirmar Pagamento</h1>

          {/* Booking Summary */}
          <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Resumo da Reserva</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Hangar:</span>
                <span className="font-bold">{bookingData.hangarNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Check-in:</span>
                <span className="font-bold">{new Date(bookingData.checkIn).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Check-out:</span>
                <span className="font-bold">{new Date(bookingData.checkOut).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Noites:</span>
                <span className="font-bold">{bookingData.nights}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">R$ {bookingData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                bookingData={bookingData}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}

          <p className="text-xs text-slate-500 mt-6 text-center">
            Seus dados de cartão são processados com segurança pelo Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
