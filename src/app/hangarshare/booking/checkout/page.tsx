'use client';

// Disable prerendering for this page since it depends on URL query parameters
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PIXPaymentComponent } from '@/components/PIXPaymentComponent';

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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | null>(null);
  const [pixPaymentStarted, setPixPaymentStarted] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [reservationConfirmed, setReservationConfirmed] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const initializeCheckout = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;
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
        const promoCodeParam = searchParams.get('promoCode');

        if (!hangarId || !checkIn || !checkOut || !totalPrice || !userId) {
          setError('Dados de reserva inválidos');
          return;
        }

        // Get auth token from localStorage (assuming it's stored there)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // Call booking confirm endpoint
        if (promoCodeParam) {
          setPromoCode(promoCodeParam.toUpperCase());
        }

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
            promoCode: appliedPromo?.code || promoCodeParam || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            throw new Error('Datas indisponíveis para este hangar. Selecione outro período.');
          }
          throw new Error(data.error || 'Erro ao inicializar checkout');
        }

        const data = await response.json();
        setBookingData({
          ...data.booking,
          totalPrice: parseFloat(totalPrice),
          hangarId: parseInt(hangarId),
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

  const handlePixPaymentComplete = (paymentId: number, transactionId: string) => {
    // For PIX, redirect to success page with PIX payment ID
    router.push(`/hangarshare/booking/success?pixPaymentId=${paymentId}&transactionId=${transactionId}`);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Digite um código de promoção');
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      const response = await fetch('/api/hangarshare/booking/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hangarId: bookingData.hangarId || parseInt(searchParams.get('hangarId') || '0'),
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          promoCode: promoCode.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Código inválido');
      }

      const data = await response.json();
      if (data.calculation.discount) {
        setAppliedPromo(data.calculation.discount);
        setPromoCode('');
        // Update booking data with discount
        setBookingData((prev: any) => ({
          ...prev,
          subtotal: data.calculation.subtotal,
          discount: data.calculation.discount,
          discountAmount: data.calculation.discount.amount,
          fees: data.calculation.fees,
          totalPrice: data.calculation.total,
        }));
      } else {
        setPromoError('Código inválido ou expirado');
      }
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    // Will need to recalculate total without discount (this requires API call or reset to original)
  };

  const handleConfirmReservation = () => {
    // Promo code is now optional - user can proceed without applying one
    setReservationConfirmed(true);
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">Aviso</h2>
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
          <h1 className="text-3xl font-black text-blue-900 mb-6">{reservationConfirmed ? 'Confirmar Pagamento' : 'Confirmar Reserva'}</h1>

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
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>R$ {(bookingData.subtotal || bookingData.totalPrice).toFixed(2)}</span>
              </div>
              {bookingData.discount && appliedPromo && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Desconto ({appliedPromo.code}):</span>
                  <span>-R$ {bookingData.discountAmount?.toFixed(2) || appliedPromo.amount?.toFixed(2)}</span>
                </div>
              )}
              {bookingData.fees && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxa:</span>
                  <span>R$ {bookingData.fees.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">R$ {bookingData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Promo Code Section (Before Confirmation) */}
          {!reservationConfirmed && (
            <div className="mb-8">
              {!appliedPromo ? (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-3">🏷️ Tem um código de desconto? (Opcional)</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Digite o código..."
                      className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? 'Validando...' : 'Aplicar'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-red-600 text-sm mt-2">❌ {promoError}</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-green-900">✓ Desconto aplicado!</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Código <span className="font-mono bg-green-100 px-2 py-1 rounded">{appliedPromo.code}</span> economiza
                        <span className="font-bold ml-1">R$ {appliedPromo.amount?.toFixed(2) || bookingData.discountAmount?.toFixed(2)}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-green-600 hover:text-red-600 font-semibold text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Reservation Button */}
          {!reservationConfirmed && (
            <button
              onClick={handleConfirmReservation}
              className="w-full py-4 mb-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-lg"
            >
              Confirmar Reserva
            </button>
          )}

          {/* Payment Method Selection - Shown After Confirmation */}
          {reservationConfirmed && !pixPaymentStarted && !paymentMethod && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-900 mb-4">Escolha a forma de pagamento:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-blue-400 transition text-left hover:bg-blue-50"
                >
                  <div className="font-semibold text-slate-900">💳 Cartão de Crédito</div>
                  <div className="text-xs text-slate-600 mt-1">Via Stripe</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-green-400 transition text-left hover:bg-green-50"
                >
                  <div className="font-semibold text-slate-900">📱 PIX</div>
                  <div className="text-xs text-slate-600 mt-1">Instantâneo, sem taxas</div>
                </button>
              </div>
            </div>
          )}

          {/* Go Back Button - Only show if not confirmed yet */}
          {!reservationConfirmed && (
            <button
              onClick={() => router.back()}
              className="w-full py-3 mt-4 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Voltar
            </button>
          )}

          {/* PIX Payment Flow */}
          {pixPaymentStarted && paymentMethod === 'pix' && clientSecret && (
            <div className="mb-8">
              <PIXPaymentComponent
                orderId={`booking-${bookingData.id}`}
                orderType="hangar_booking"
                amountCents={Math.round(bookingData.totalPrice * 100)}
                description={`Reserva de Hangar ${bookingData.hangarNumber} - ${bookingData.nights} noites`}
                onPaymentComplete={handlePixPaymentComplete}
                autoRefresh={true}
                refreshInterval={8000}
              />
              <button
                onClick={() => {
                  setPixPaymentStarted(false);
                  setPaymentMethod(null);
                }}
                className="mt-4 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Voltar
              </button>
            </div>
          )}

          {/* Stripe Payment Form */}
          {reservationConfirmed && paymentMethod === 'stripe' && clientSecret && !pixPaymentStarted && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                bookingData={bookingData}
                onSuccess={handlePaymentSuccess}
              />
              <button
                onClick={() => setPaymentMethod(null)}
                className="mt-4 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Voltar
              </button>
            </Elements>
          )}

          {/* Show confirmation button to start PIX payment */}
          {reservationConfirmed && paymentMethod === 'pix' && !pixPaymentStarted && (
            <div className="space-y-3">
              <button
                onClick={() => setPixPaymentStarted(true)}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Continuar com PIX
              </button>
              <button
                onClick={() => setPaymentMethod(null)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Voltar
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-6 text-center">
            Seus dados de pagamento são processados com segurança
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
