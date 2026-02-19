'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { PIXPaymentComponent } from '@/components/PIXPaymentComponent';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm({ clientSecret, amount, onSuccess }: { clientSecret: string; amount: number; onSuccess: (paymentIntentId: string) => void }) {
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
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
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
        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listing, setListing] = useState<{ title: string; price: number; listingType: string } | null>(null);
  const [pricing, setPricing] = useState<{ subtotal: number; discountAmount: number; total: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | null>(null);
  const [pixPaymentStarted, setPixPaymentStarted] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<null | { code: string; amount: number }>(null);

  const fetchCheckout = async (code?: string, usePageLoading = false) => {
    if (usePageLoading) {
      setLoading(true);
    }

    const listingType = searchParams.get('type');
    const listingId = searchParams.get('id');

    if (!listingType || !listingId) {
      setError('Dados do anúncio inválidos');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(`/classifieds/checkout?type=${listingType}&id=${listingId}`)}`);
      return;
    }

    const response = await fetch('/api/classifieds/escrow/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingType, listingId: Number(listingId), promoCode: code || null }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao iniciar pagamento');
    }

    const data = await response.json();
    setListing(data.listing);
    setPricing(data.pricing || null);
    setAppliedPromo(data.appliedPromo ? { code: data.appliedPromo.code, amount: data.appliedPromo.amount } : null);
    setClientSecret(data.clientSecret);
  };

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!publishableKey) {
        setError('Stripe publishable key ausente. Adicione NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ao .env.local e reinicie o servidor.');
        setLoading(false);
        return;
      }

      try {
        await fetchCheckout(undefined, true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [searchParams, router]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    await fetch('/api/classifieds/escrow/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    router.push('/classifieds');
  };

  const handlePixPaymentComplete = async (paymentId: number, transactionId: string) => {
    // For PIX, we would need an endpoint to confirm the escrow payment
    // For now, just navigate to success
    router.push(`/classifieds?success=true&method=pix`);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Digite um código de promoção');
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      await fetchCheckout(promoCode.trim());
      setPromoCode('');
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = async () => {
    setPromoLoading(true);
    setPromoError('');

    try {
      await fetchCheckout(undefined);
      setPromoCode('');
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
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

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-slate-600 mb-6">{error || 'Não foi possível carregar o checkout'}</p>
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-bold mb-6 flex items-center gap-2"
            >
              ← Voltar
            </button>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-3xl font-black text-blue-900 mb-6">Pagamento com Escrow</h1>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-600">Anúncio</p>
                <p className="text-lg font-bold text-slate-900">{listing.title}</p>
                <p className="text-sm text-slate-500 capitalize">{listing.listingType}</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {(pricing?.subtotal ?? listing.price).toFixed(2)}</span>
                  </div>
                  {appliedPromo && pricing?.discountAmount ? (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Desconto ({appliedPromo.code})</span>
                      <span>-R$ {pricing.discountAmount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-base font-black text-emerald-600">
                    <span>Total</span>
                    <span>R$ {(pricing?.total ?? listing.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {!appliedPromo ? (
                <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-3">🏷️ Tem um código de desconto?</h3>
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
                <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-green-900">✓ Desconto aplicado!</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Código <span className="font-mono bg-green-100 px-2 py-1 rounded">{appliedPromo.code}</span> economiza
                        <span className="font-bold ml-1">R$ {appliedPromo.amount.toFixed(2)}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      disabled={promoLoading}
                      className="text-green-600 hover:text-red-600 font-semibold text-sm disabled:opacity-60"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {!pixPaymentStarted && !paymentMethod && (
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

              {/* PIX Payment Flow */}
              {pixPaymentStarted && paymentMethod === 'pix' && (
                <div className="mb-8">
                  <PIXPaymentComponent
                    orderId={`classified-${listing.listingType}-${searchParams.get('id')}`}
                    orderType="classified"
                    amountCents={Math.round((pricing?.total ?? listing.price) * 100)}
                    description={`Anúncio: ${listing.title}`}
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
              {paymentMethod === 'stripe' && clientSecret && !pixPaymentStarted && stripePromise ? (
                <>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      clientSecret={clientSecret}
                      amount={pricing?.total ?? listing.price}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                  <button
                    onClick={() => setPaymentMethod(null)}
                    className="mt-4 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                </>
              ) : null}

              {/* Show confirmation button to start PIX payment */}
              {paymentMethod === 'pix' && !pixPaymentStarted && (
                <button
                  onClick={() => setPixPaymentStarted(true)}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  Continuar com PIX
                </button>
              )}

              {/* Legacy Stripe rendering (when no payment method selected) */}
              {!paymentMethod && clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    amount={pricing?.total ?? listing.price}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : null}

              {!clientSecret && !paymentMethod && (
                <div className="text-red-600 text-center">Erro ao inicializar checkout.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ClassifiedsCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CheckoutContent />
    </Suspense>
  );
}
