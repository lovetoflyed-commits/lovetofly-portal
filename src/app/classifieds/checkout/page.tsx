'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

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

  useEffect(() => {
    const initializeCheckout = async () => {
      if (!publishableKey) {
        setError('Stripe publishable key ausente. Adicione NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ao .env.local e reinicie o servidor.');
        setLoading(false);
        return;
      }

      try {
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
          body: JSON.stringify({ listingType, listingId: Number(listingId) }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erro ao iniciar pagamento');
        }

        const data = await response.json();
        setListing(data.listing);
        setClientSecret(data.clientSecret);
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
                <p className="text-xl font-black text-emerald-600 mt-2">R$ {listing.price.toFixed(2)}</p>
              </div>

              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    amount={listing.price}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <div className="text-red-600 text-center">Erro ao inicializar Stripe.</div>
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
