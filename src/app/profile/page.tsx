'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatBrazilianPhone } from '@/utils/phoneFormat';
import { PIXPaymentComponent } from '@/components/PIXPaymentComponent';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';

// Definindo a interface completa com todos os campos que o banco possui
interface UserProfile {
  id: string;
  name: string;
  email: string;
  anac_code: string;
  role: string;
  mobilePhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  aviationRole?: string;
  aviationRoleOther?: string;
  course_type?: string;
  current_license?: string;
  current_ratings?: string;
  licencas?: string;
  habilitacoes?: string;
  curso_atual?: string;
  total_flight_hours?: number | string;
  transferred_from_ciac?: boolean;
  previous_ciac_name?: string;
  observations?: string;
  created_at?: string;
  avatarUrl?: string | null;
}

interface MembershipPlan {
  id: number;
  code: 'free' | 'standard' | 'premium' | 'pro';
  name: string;
  description: string;
  monthlyPrice: string | number;
  annualPrice: string | number;
  annualDiscountPercent: number;
  features: string[];
  prioritySupport: boolean;
  maxUsersAllowed: number;
  maxProjects: number;
  maxStorageGb: number;
}

interface UserMembershipSummary {
  planCode: MembershipPlan['code'];
  planName: string;
  billingCycle: 'monthly' | 'annual' | null;
  status: string;
  renewalDate: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<UserMembershipSummary | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<MembershipPlan['code']>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgradeCode, setUpgradeCode] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
  const [pendingStartedAt, setPendingStartedAt] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | null>(null);
  const [pixPaymentStarted, setPixPaymentStarted] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/user/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // merge name for backward compatibility
          const merged: UserProfile = {
            ...data,
            name: (user.name || `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim()),
          } as any;
          setProfileData(merged);
        } else {
          // fallback to context user
          setProfileData(user as unknown as UserProfile);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('pendingMembershipUpgrade');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        checkoutUrl?: string;
        planName?: string;
        startedAt?: string;
      };
      setPendingCheckoutUrl(parsed.checkoutUrl || null);
      setPendingPlanName(parsed.planName || null);
      setPendingStartedAt(parsed.startedAt || null);
    } catch (error) {
      console.warn('Failed to parse pending upgrade state:', error);
      localStorage.removeItem('pendingMembershipUpgrade');
    }
  }, []);

  const fetchMembershipData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch('/api/user/membership', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const data = await res.json();
    const summary = data?.data?.membership || null;
    setMembership(summary);
    if (summary?.planCode) {
      setSelectedPlanCode(summary.planCode);
    }
    if (summary?.status === 'active' && summary.planCode && summary.planCode !== 'free') {
      setPendingCheckoutUrl(null);
      setPendingPlanName(null);
      setPendingStartedAt(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingMembershipUpgrade');
      }
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await fetch('/api/memberships/plans');
      if (!res.ok) return;
      const data = await res.json();
      setPlans(data?.data?.plans || []);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMembershipData();
    fetchPlans();
    fetchPendingUpgrade();
  }, [user]);

  const fetchPendingUpgrade = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch('/api/user/membership/pending', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      const pending = json?.data;
      if (pending && pending.checkoutUrl) {
        setPendingCheckoutUrl(pending.checkoutUrl);
        setPendingPlanName(pending.planCode);
        setPendingStartedAt(pending.startedAt);
        // Also sync to localStorage for fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingMembershipUpgrade', JSON.stringify({
            checkoutUrl: pending.checkoutUrl,
            planName: pending.planCode,
            startedAt: pending.startedAt,
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to fetch pending upgrade from DB:', error);
    }
  };

  const formatPrice = (value: string | number) => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (!parsed) return 'Gratis';
    return `R$ ${parsed.toFixed(2)}`;
  };

  const clearPendingUpgrade = async () => {
    const payload = {
      checkoutUrl: pendingCheckoutUrl,
      planName: pendingPlanName,
      startedAt: pendingStartedAt,
    };
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch('/api/user/membership/pending-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to notify pending cancel:', error);
    }
    setPendingCheckoutUrl(null);
    setPendingPlanName(null);
    setPendingStartedAt(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingMembershipUpgrade');
    }
  };

  const handleUpgrade = async () => {
    setUpgradeError(null);
    setUpgradeSuccess(null);
    setUpgradeLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/user/membership/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          planCode: selectedPlanCode,
          billingCycle,
          code: upgradeCode.trim() || undefined,
          paymentMethod: paymentMethod || 'stripe',
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpgradeError(payload?.error || payload?.message || 'Falha ao atualizar assinatura.');
        return;
      }

      const checkoutUrl = payload?.data?.checkoutUrl;
      const action = payload?.data?.action;

      // If PIX payment was selected, start PIX payment flow
      if (paymentMethod === 'pix' && action === 'start_pix_payment') {
        // Store upgrade details for PIX payment flow
        const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'pendingMembershipUpgrade',
            JSON.stringify({
              planCode: selectedPlanCode,
              planName: selectedPlan?.name || null,
              billingCycle,
              upgradeCode: upgradeCode.trim() || null,
              startedAt: new Date().toISOString(),
              paymentMethod: 'pix',
            })
          );
        }
        // PIXPaymentComponent will trigger automatically
        setPixPaymentStarted(true);
        return;
      }

      // Handle Stripe redirect (existing flow)
      if (checkoutUrl && action === 'redirect_to_checkout') {
        const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);
        const startedAt = new Date().toISOString();
        setPendingCheckoutUrl(checkoutUrl);
        setPendingPlanName(selectedPlan?.name || null);
        setPendingStartedAt(startedAt);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'pendingMembershipUpgrade',
            JSON.stringify({
              checkoutUrl,
              planName: selectedPlan?.name || null,
              startedAt,
            })
          );
        }
        setUpgradeOpen(false);
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // Immediate upgrade (free plan or 100% discount code)
      if (action === 'immediate_upgrade') {
        const message = payload?.data?.message || 'Assinatura atualizada com sucesso!';
        setUpgradeSuccess(message);
        setTimeout(() => setUpgradeSuccess(null), 5000); // Clear after 5 seconds
      }

      setUpgradeOpen(false);
      await fetchMembershipData();
    } catch (err) {
      console.error('Upgrade error:', err);
      setUpgradeError('Falha ao atualizar assinatura.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handlePixPaymentComplete = async (paymentId: number, transactionId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // Confirm the PIX payment and activate the membership
      const res = await fetch('/api/user/membership/confirm-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentId,
          transactionId,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpgradeError(payload?.error || payload?.message || 'Falha ao confirmar pagamento PIX.');
        return;
      }

      // Success! Clear states and show success message
      setUpgradeSuccess('Pagamento confirmado! Sua assinatura foi ativada.');
      setPixPaymentStarted(false);
      setPaymentMethod(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingMembershipUpgrade');
      }

      setTimeout(() => {
        setUpgradeSuccess(null);
        setUpgradeOpen(false);
        fetchMembershipData();
      }, 3000);
    } catch (err) {
      console.error('Error confirming PIX payment:', err);
      setUpgradeError('Falha ao confirmar pagamento PIX.');
    }
  };

  const handlePixPaymentExpired = (paymentId: number) => {
    setUpgradeError('Pagamento PIX expirou. Por favor, tente novamente.');
    setPixPaymentStarted(false);
    setPaymentMethod(null);
  };

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">

          {/* --- CABEÇALHO DO PERFIL --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-100 flex items-center justify-center">
              {profileData.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 text-3xl font-bold">
                  {profileData.name?.charAt(0).toUpperCase() || 'P'}
                </span>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{profileData.name}</h1>
              {(profileData.aviationRole || profileData.aviationRoleOther) && (
                <p className="text-slate-500 font-medium tracking-wide">
                  {profileData.aviationRole === 'Outro' && profileData.aviationRoleOther
                    ? profileData.aviationRoleOther
                    : profileData.aviationRole}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase border border-blue-100">
                  {profileData.role || 'Piloto'}
                </span>
                {profileData.licencas && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                    {profileData.licencas}
                  </span>
                )}
                {profileData.habilitacoes && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
                    {profileData.habilitacoes}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Editar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Editar perfil
                </button>
                <button
                  onClick={() => router.push('/profile/bookings')}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Minhas reservas
                </button>
                <button
                  onClick={() => router.push('/profile/notifications')}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Notificações
                </button>
              </div>
            </div>

            {/* --- COLUNA ESQUERDA: DADOS PESSOAIS --- */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <span>👤</span> Dados Pessoais
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                    <p className="text-slate-700 font-medium break-all">{profileData.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <p className="text-slate-700 font-medium">{formatBrazilianPhone(profileData.mobilePhone) || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Endereço</label>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {(() => {
                        const parts = [];
                        if (profileData.addressStreet) {
                          parts.push(`${profileData.addressStreet}${profileData.addressNumber ? ', ' + profileData.addressNumber : ''}`);
                        }
                        if (profileData.addressComplement) {
                          parts.push(profileData.addressComplement);
                        }
                        if (profileData.addressNeighborhood) {
                          parts.push(profileData.addressNeighborhood);
                        }
                        if (profileData.addressCity && profileData.addressState) {
                          parts.push(`${profileData.addressCity} - ${profileData.addressState}`);
                        } else if (profileData.addressCity) {
                          parts.push(profileData.addressCity);
                        }
                        if (profileData.addressZip) {
                          parts.push(`CEP: ${profileData.addressZip}`);
                        }
                        return parts.length > 0 ? parts.join(', ') : 'Não informado';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- COLUNA DIREITA: DADOS TÉCNICOS --- */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <span>💳</span> Plano de Assinatura
                </h3>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Plano atual</p>
                    <p className="text-xl font-bold text-slate-900">
                      {membership?.planName || 'Gratuito'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {membership?.status ? `Status: ${membership.status}` : 'Sem assinatura ativa'}
                    </p>
                    <div className="mt-3 text-sm text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-700">Ciclo:</span>{' '}
                        {membership?.billingCycle ? (membership.billingCycle === 'annual' ? 'Anual' : 'Mensal') : '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Renovacao:</span>{' '}
                        {membership?.renewalDate ? new Date(membership.renewalDate).toLocaleDateString('pt-BR') : '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Codigo do plano:</span>{' '}
                        {membership?.planCode ? membership.planCode.toUpperCase() : '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Fazer upgrade
                  </button>
                </div>
                {pendingCheckoutUrl && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-col gap-2">
                    <span className="font-semibold">
                      Upgrade pendente{pendingPlanName ? `: ${pendingPlanName}` : ''}
                    </span>
                    {pendingStartedAt && (
                      <span>
                        Iniciado em {new Date(pendingStartedAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                    <span>Finalize o pagamento no Stripe para ativar a assinatura.</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => window.open(pendingCheckoutUrl, '_blank', 'noopener,noreferrer')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
                      >
                        Abrir checkout
                      </button>
                      <button
                        onClick={clearPendingUpgrade}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100"
                      >
                        Cancelar pendencia
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <span>✈️</span> Qualificações & Voo
                </h3>

                <div className="space-y-4">
                  {profileData.licencas && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Licenças</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.licencas}</p>
                    </div>
                  )}

                  {profileData.habilitacoes && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Habilitações</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.habilitacoes}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Horas Totais de Voo</label>
                    <p className="text-2xl font-bold text-blue-800">{profileData.total_flight_hours || '0'}h</p>
                    <p className="text-xs text-blue-600 mt-1">Calculado automaticamente do seu logbook</p>
                  </div>

                  {profileData.curso_atual && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Curso Atual</label>
                      <p className="text-base font-semibold text-slate-800">{profileData.curso_atual}</p>
                    </div>
                  )}

                  {!profileData.licencas && !profileData.habilitacoes && !profileData.curso_atual && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="mb-2">📝 Nenhuma qualificação cadastrada</p>
                      <button
                        onClick={() => router.push('/profile/edit')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Adicionar qualificações
                      </button>
                    </div>
                  )}
                </div>

                {profileData.observations && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {profileData.observations}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {pixPaymentStarted ? 'Pagamento PIX' : 'Escolha seu plano'}
              </h2>
              <button
                onClick={() => {
                  setUpgradeOpen(false);
                  setPixPaymentStarted(false);
                  setPaymentMethod(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              {/* PIX Payment Flow */}
              {pixPaymentStarted && paymentMethod === 'pix' ? (
                <div>
                  {/* Show PIX Payment Component */}
                  <PIXPaymentComponent
                    orderId={`membership-${selectedPlanCode}`}
                    orderType="membership"
                    amountCents={
                      billingCycle === 'monthly'
                        ? Math.round(Number(plans.find((p) => p.code === selectedPlanCode)?.monthlyPrice || 0) * 100)
                        : Math.round(Number(plans.find((p) => p.code === selectedPlanCode)?.annualPrice || 0) * 100)
                    }
                    description={`Upgrade para plano ${selectedPlanCode.toUpperCase()} - ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`}
                    onPaymentComplete={handlePixPaymentComplete}
                    onPaymentExpired={handlePixPaymentExpired}
                    autoRefresh={true}
                    refreshInterval={8000}
                  />

                  {upgradeError && (
                    <div className="mt-4 text-sm text-red-600 font-semibold">
                      {upgradeError}
                    </div>
                  )}

                  {upgradeSuccess && (
                    <div className="mt-4 text-sm text-green-600 font-semibold">
                      {upgradeSuccess}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPixPaymentStarted(false);
                      setPaymentMethod(null);
                      setUpgradeError(null);
                    }}
                    className="mt-4 w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <>
                  {/* Plan Selection and Payment Method Flow */}
                  {!paymentMethod ? (
                    <>
                      {/* Step 1: Select Plan */}
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold border ${billingCycle === 'monthly'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200'
                            }`}
                        >
                          Mensal
                        </button>
                        <button
                          onClick={() => setBillingCycle('annual')}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold border ${billingCycle === 'annual'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200'
                            }`}
                        >
                          Anual
                        </button>
                      </div>

                      {plansLoading ? (
                        <div className="py-10 text-center text-slate-500">Carregando planos...</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {plans.map((plan) => {
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
                            const selected = selectedPlanCode === plan.code;
                            return (
                              <button
                                key={plan.code}
                                onClick={() => setSelectedPlanCode(plan.code)}
                                className={`text-left p-4 rounded-xl border transition-all ${selected
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 hover:border-blue-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                                  <span className="text-sm font-semibold text-slate-700">
                                    {formatPrice(price)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                                {billingCycle === 'annual' && plan.annualDiscountPercent > 0 && (
                                  <p className="text-xs text-green-600 font-semibold mt-2">
                                    Economize {plan.annualDiscountPercent}% no anual
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Codigo promocional (opcional)</label>
                        <input
                          type="text"
                          value={upgradeCode}
                          onChange={(e) => setUpgradeCode(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Digite seu codigo"
                        />
                      </div>

                      {upgradeError && (
                        <div className="mt-4 text-sm text-red-600 font-semibold">
                          {upgradeError}
                        </div>
                      )}

                      {upgradeSuccess && (
                        <div className="mt-4 text-sm text-green-600 font-semibold">
                          {upgradeSuccess}
                        </div>
                      )}

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 mb-4">Escolha a forma de pagamento:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={() => setPaymentMethod('stripe')}
                            disabled={upgradeLoading || plansLoading}
                            className="p-4 rounded-lg border-2 border-slate-200 hover:border-blue-400 transition text-left hover:bg-blue-50"
                          >
                            <div className="font-semibold text-slate-900">💳 Cartão de Crédito</div>
                            <div className="text-xs text-slate-600 mt-1">Via Stripe</div>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('pix')}
                            disabled={upgradeLoading || plansLoading}
                            className="p-4 rounded-lg border-2 border-slate-200 hover:border-green-400 transition text-left hover:bg-green-50"
                          >
                            <div className="font-semibold text-slate-900">📱 PIX</div>
                            <div className="text-xs text-slate-600 mt-1">Instantâneo, sem taxas</div>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>

            {/* Modal Footer - Only show when not in PIX payment flow */}
            {!pixPaymentStarted && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setUpgradeOpen(false);
                    setPaymentMethod(null);
                    setUpgradeError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  disabled={upgradeLoading}
                >
                  Cancelar
                </button>
                {paymentMethod && (
                  <>
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                      disabled={upgradeLoading}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleUpgrade}
                      className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
                      disabled={upgradeLoading || plansLoading}
                    >
                      {upgradeLoading ? 'Processando...' : `Continuar com ${paymentMethod === 'stripe' ? 'Cartão' : 'PIX'}`}
                    </button>
                  </>
                )}
                {!paymentMethod && (
                  <button
                    onClick={handleUpgrade}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60"
                    disabled={upgradeLoading || plansLoading}
                  >
                    {upgradeLoading ? 'Processando...' : 'Confirmar upgrade'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
