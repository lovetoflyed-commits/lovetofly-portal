'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface ConversationMessage {
  id: number;
  sender_role: string;
  message: string;
  has_redactions: boolean;
  created_at: string;
}

interface AgreementState {
  agreement_owner_confirmed_at: string | null;
  agreement_pilot_confirmed_at: string | null;
  agreement_confirmed_at: string | null;
}

interface ServiceFee {
  id: number;
  payer_user_id: number | null;
  payer_role: string;
  amount_cents: number;
  base_amount_cents?: number | null;
  discount_cents?: number | null;
  discount_reason?: string | null;
  currency: string;
  status: string;
  payment_intent_id: string | null;
}

interface FeePreview {
  base_amount_cents: number;
  discount_cents: number;
  discount_reason: string | null;
  total_cents: number;
}

function PaymentForm({
  clientSecret,
  requestId,
  onSuccess,
}: {
  clientSecret: string;
  requestId: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        setError(result.error.message || t('transfersMessages.errors.paymentProcessing'));
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || t('transfersMessages.errors.paymentProcessing'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
      >
        {loading ? t('transfersMessages.payment.processing') : t('transfersMessages.payment.payPortalFee')}
      </button>
    </form>
  );
}

export default function TrasladosMessagesPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [requestId, setRequestId] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [agreement, setAgreement] = useState<AgreementState | null>(null);
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);
  const [role, setRole] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const normalizedRequestId = useMemo(() => {
    const match = requestId.match(/\d+/g);
    return match ? Number(match.join('')) : NaN;
  }, [requestId]);

  const userPaid = useMemo(() => {
    if (!user) return false;
    return fees.some((fee) => fee.payer_user_id === user.id && fee.status === 'paid');
  }, [fees, user]);

  const userFee = useMemo(() => {
    if (!user) return null;
    return fees.find((fee) => fee.payer_user_id === user.id) || null;
  }, [fees, user]);

  const agreementConfirmed = agreement?.agreement_confirmed_at;
  const latestFee = useMemo(() => {
    if (!fees.length) return null;
    return fees[0];
  }, [fees]);

  const paidFee = useMemo(() => {
    if (!user) return null;
    return fees.find((fee) => fee.payer_user_id === user.id && fee.status === 'paid') || null;
  }, [fees, user]);

  const formatFeeBreakdown = (fee: ServiceFee | FeePreview) => {
    const baseAmount = 'base_amount_cents' in fee && fee.base_amount_cents != null
      ? fee.base_amount_cents
      : 'amount_cents' in fee
      ? fee.amount_cents
      : 0;
    const discountAmount = 'discount_cents' in fee && fee.discount_cents != null ? fee.discount_cents : 0;
    const totalAmount = 'total_cents' in fee ? fee.total_cents : 'amount_cents' in fee ? fee.amount_cents : 0;
    const discountReason = ('discount_reason' in fee ? fee.discount_reason : null) ?? null;

    return {
      baseAmount,
      discountAmount,
      totalAmount,
      discountReason,
    };
  };

  const getDiscountLabel = (reason: string | null) => {
    if (!reason) return t('transfersMessages.discount.none');
    if (reason === 'premium_plan') return t('transfersMessages.discount.premium');
    if (reason === 'pro_plan') return t('transfersMessages.discount.pro');
    return t('transfersMessages.discount.applied');
  };

  const formatCurrency = (amountCents: number) => {
    const amount = amountCents / 100;
    const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
    return amount.toLocaleString(locale, { style: 'currency', currency: 'BRL' });
  };

  const fetchConversation = useCallback(async () => {
    if (!requestId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/traslados/messages?requestId=${normalizedRequestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || t('transfersMessages.errors.loadMessages'));
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setAgreement({
        agreement_owner_confirmed_at: data.request?.agreement_owner_confirmed_at || null,
        agreement_pilot_confirmed_at: data.request?.agreement_pilot_confirmed_at || null,
        agreement_confirmed_at: data.request?.agreement_confirmed_at || null,
      });
      setFees(data.fees || []);
      setRole(data.role || '');
      setFeePreview(data.feePreview || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfersMessages.errors.loadMessages'));
    } finally {
      setLoading(false);
    }
  }, [requestId, normalizedRequestId, t]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId.trim()) {
      setError(t('transfersMessages.errors.protocolRequired'));
      return;
    }
    if (Number.isNaN(normalizedRequestId)) {
      setError(t('transfersMessages.errors.protocolInvalid'));
      return;
    }
    await fetchConversation();
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageText.trim() || !requestId.trim() || Number.isNaN(normalizedRequestId)) return;

    setSending(true);
    setNotice('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/traslados/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId: normalizedRequestId, message: messageText }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || t('transfersMessages.errors.sendMessage'));
      }
      const data = await res.json();
      if (data.message?.has_redactions) {
        setNotice(t('transfersMessages.notice.redacted'));
      }
      setMessageText('');
      await fetchConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfersMessages.errors.sendMessage'));
    } finally {
      setSending(false);
    }
  };

  const handleConfirmAgreement = async () => {
    if (!requestId.trim() || Number.isNaN(normalizedRequestId)) return;
    setNotice('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/traslados/agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId: normalizedRequestId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || t('transfersMessages.errors.confirmAgreement'));
      }
      const data = await res.json();
      setAgreement({
        agreement_owner_confirmed_at: data.request?.agreement_owner_confirmed_at || null,
        agreement_pilot_confirmed_at: data.request?.agreement_pilot_confirmed_at || null,
        agreement_confirmed_at: data.request?.agreement_confirmed_at || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfersMessages.errors.confirmAgreement'));
    }
  };

  const handleCreatePayment = async () => {
    if (!requestId.trim() || Number.isNaN(normalizedRequestId)) return;
    setNotice('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/traslados/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId: normalizedRequestId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || t('transfersMessages.errors.generatePayment'));
      }
      const data = await res.json();
      if (data.status === 'paid' && data.exempt) {
        setNotice(t('transfersMessages.notice.feeExempt'));
        setClientSecret('');
        setPaymentIntentId('');
        await fetchConversation();
        return;
      }
      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfersMessages.errors.generatePayment'));
    }
  };

  const handlePaymentSuccess = async (paymentIntentIdValue: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch('/api/traslados/fees/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId: normalizedRequestId, paymentIntentId: paymentIntentIdValue }),
      });
      setNotice(t('transfersMessages.notice.paymentConfirmed'));
      await fetchConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfersMessages.errors.confirmPayment'));
    }
  };

  useEffect(() => {
    setMessages([]);
    setAgreement(null);
    setFees([]);
    setRole('');
    setClientSecret('');
    setPaymentIntentId('');
    setFeePreview(null);
  }, [requestId]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <div className="mx-auto max-w-5xl space-y-8">
              <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900">{t('transfersMessages.title')}</h1>
                <p className="mt-3 text-sm text-slate-600">{t('transfersMessages.subtitle')}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="request-id">
                      {t('transfersMessages.requestLabel')}
                    </label>
                    <input
                      id="request-id"
                      value={requestId}
                      onChange={(event) => setRequestId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                      placeholder={t('transfersMessages.requestPlaceholder')}
                    />
                    <p className="mt-2 text-xs text-slate-500">{t('transfersMessages.requestHint')}</p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    {t('transfersMessages.loadConversation')}
                  </button>
                </form>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                {notice && <p className="mt-3 text-sm text-emerald-600">{notice}</p>}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">{t('transfersMessages.agreementTitle')}</h2>
                <p className="mt-2 text-sm text-slate-600">{t('transfersMessages.agreementSubtitle')}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="font-semibold text-slate-700">{t('transfersMessages.yourRole')}</div>
                    <div className="mt-2 text-slate-600">{role ? role.toUpperCase() : t('transfersMessages.notAvailable')}</div>
                    <div className="mt-4">
                      <button
                        onClick={handleConfirmAgreement}
                        className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        {t('transfersMessages.confirmAgreement')}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="font-semibold text-slate-700">{t('transfersMessages.agreementStatus')}</div>
                    <ul className="mt-2 space-y-2 text-slate-600">
                      <li>{t('transfersMessages.ownerLabel')}: {agreement?.agreement_owner_confirmed_at ? t('transfersMessages.confirmed') : t('transfersMessages.pending')}</li>
                      <li>{t('transfersMessages.pilotLabel')}: {agreement?.agreement_pilot_confirmed_at ? t('transfersMessages.confirmed') : t('transfersMessages.pending')}</li>
                      <li className="font-semibold">
                        {t('transfersMessages.finalAgreement')}: {agreementConfirmed ? t('transfersMessages.confirmed') : t('transfersMessages.awaiting')}
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6">
                  {agreementConfirmed ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-semibold text-emerald-700">{t('transfersMessages.agreementConfirmed')}</div>
                      <div className="mt-2 text-sm text-emerald-700">
                        {userPaid ? t('transfersMessages.portalFeePaid') : t('transfersMessages.portalFeeDue')}
                      </div>
                      {(paidFee || userFee || feePreview) && (() => {
                        const detailSource = paidFee || userFee || feePreview;
                        if (!detailSource) return null;
                        const breakdown = formatFeeBreakdown(detailSource);
                        return (
                          <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-xs text-emerald-700">
                            <div className="font-semibold">{t('transfersMessages.feeBreakdownTitle')}</div>
                            <div className="mt-2 space-y-1">
                              <div>{t('transfersMessages.feeBase')}: {formatCurrency(breakdown.baseAmount)}</div>
                              <div>
                                {getDiscountLabel(breakdown.discountReason)}:{' '}
                                {breakdown.discountAmount > 0 ? `- ${formatCurrency(breakdown.discountAmount)}` : t('transfersMessages.notAvailable')}
                              </div>
                              <div className="font-semibold">{t('transfersMessages.feeTotal')}: {formatCurrency(breakdown.totalAmount)}</div>
                            </div>
                          </div>
                        );
                      })()}
                      {!userPaid && (
                        <div className="mt-4">
                          {!publishableKey ? (
                            <p className="text-sm text-red-600">
                              {t('transfersMessages.stripeNotConfigured')}
                            </p>
                          ) : clientSecret ? (
                            <div className="space-y-4">
                              {(userFee || feePreview) && (() => {
                                const detailSource = userFee || feePreview;
                                if (!detailSource) return null;
                                const breakdown = formatFeeBreakdown(detailSource);
                                return (
                                  <div className="rounded-lg border border-emerald-200 bg-white p-3 text-xs text-emerald-700">
                                    <div className="font-semibold">{t('transfersMessages.beforePaymentTitle')}</div>
                                    <div className="mt-2 space-y-1">
                                      <div>{t('transfersMessages.feeBase')}: {formatCurrency(breakdown.baseAmount)}</div>
                                      <div>
                                        {getDiscountLabel(breakdown.discountReason)}:{' '}
                                        {breakdown.discountAmount > 0 ? `- ${formatCurrency(breakdown.discountAmount)}` : t('transfersMessages.notAvailable')}
                                      </div>
                                      <div className="font-semibold">{t('transfersMessages.totalToPay')}: {formatCurrency(breakdown.totalAmount)}</div>
                                    </div>
                                  </div>
                                );
                              })()}
                              <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm clientSecret={clientSecret} requestId={normalizedRequestId} onSuccess={handlePaymentSuccess} />
                              </Elements>
                            </div>
                          ) : (
                            <button
                              onClick={handleCreatePayment}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              {t('transfersMessages.generatePayment')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {t('transfersMessages.paymentAfterAgreement')}
                    </div>
                  )}
                </div>
                {latestFee && (
                  <div className="mt-4 text-xs text-slate-500">
                    {t('transfersMessages.latestFee')}: {latestFee.status.toUpperCase()} •{' '}
                    {latestFee.amount_cents === 0 ? t('transfersMessages.feeExempt') : formatCurrency(latestFee.amount_cents)}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">{t('transfersMessages.messagesTitle')}</h2>
                {loading ? (
                  <p className="mt-4 text-sm text-slate-600">{t('transfersMessages.loading')}</p>
                ) : messages.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600">{t('transfersMessages.empty')}</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(message.created_at).toLocaleString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}</span>
                          <span className="uppercase">{message.sender_role}</span>
                        </div>
                        <div className="mt-2 text-sm text-slate-700">{message.message}</div>
                        {message.has_redactions && (
                          <div className="mt-2 text-xs text-amber-600">{t('transfersMessages.redactedInline')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="mt-6 space-y-3">
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
                    placeholder={t('transfersMessages.messagePlaceholder')}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
                    >
                      {sending ? t('transfersMessages.sending') : t('transfersMessages.send')}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
