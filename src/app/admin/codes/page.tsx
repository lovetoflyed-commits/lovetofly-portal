'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type CodeRecord = {
    id: number;
    code_hint: string;
    code_type: 'invite' | 'promo';
    description: string | null;
    discount_type: string | null;
    discount_value: string | number | null;
    membership_plan_code: string | null;
    membership_grant_mode: string | null;
    grant_duration_days: number | null;
    role_grant: string | null;
    feature_flags: string[] | null;
    max_uses: number | null;
    used_count: number | null;
    per_user_limit: boolean;
    valid_from: string | null;
    valid_until: string | null;
    access_expires_at: string | null;
    eligible_email: string | null;
    eligible_domain: string | null;
    stripe_coupon_id: string | null;
    stripe_promo_code_id: string | null;
    usage_targets: string[] | null;
    created_by: number | null;
    created_at: string | null;
    is_active: boolean;
};

type GeneratedCode = {
    id: number;
    code: string;
    hint: string;
    mask: string;
};

type StoredGeneratedCode = GeneratedCode & {
    createdAt?: string;
};

const GENERATED_STORAGE_KEY = 'admin.generatedCodes';

const emptyForm = {
    codeType: 'invite',
    count: 1,
    description: '',
    discountType: '',
    discountValue: '',
    membershipPlanCode: '',
    membershipGrantMode: 'free',
    grantDurationDays: '',
    roleGrant: '',
    featureFlags: '',
    maxUses: '',
    perUserLimit: true,
    validFrom: '',
    validUntil: '',
    accessExpiresAt: '',
    eligibleEmail: '',
    eligibleDomain: '',
    usageTargets: [] as string[],
    customTags: ''
};

const usageTargetOptions = [
    { value: 'memberships', label: 'Memberships' },
    { value: 'hangarshare', label: 'HangarShare' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'classifieds', label: 'Classifieds' },
    { value: 'courses', label: 'Courses' },
    { value: 'mentorship', label: 'Mentorship' },
    { value: 'career', label: 'Career' },
    { value: 'flight-planning', label: 'Flight Planning' },
    { value: 'logbook', label: 'Logbook' },
    { value: 'simulator', label: 'Simulator' }
];

const planOptions = [
    { value: '', label: 'None' },
    { value: 'free', label: 'Free' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
    { value: 'pro', label: 'Pro' }
];

const roleOptions = [
    { value: '', label: 'None' },
    { value: 'user', label: 'User' },
    { value: 'owner', label: 'Owner' },
    { value: 'partner', label: 'Partner' },
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admin' },
    { value: 'master', label: 'Master' }
];

export default function AdminCodesPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [isMounted, setIsMounted] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [codes, setCodes] = useState<CodeRecord[]>([]);
    const [generated, setGenerated] = useState<GeneratedCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [codesTab, setCodesTab] = useState<'active' | 'inactive'>('active');

    const canAccess = useMemo(() => {
        if (!user) return false;
        return user.role === 'master' || user.role === 'admin' || user.role === 'staff' || user.email === 'lovetofly.ed@gmail.com';
    }, [user]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const stored = localStorage.getItem(GENERATED_STORAGE_KEY);
        if (!stored) return;
        try {
            const parsed = JSON.parse(stored) as StoredGeneratedCode[];
            if (Array.isArray(parsed)) {
                setGenerated(parsed);
            }
        } catch (parseError) {
            console.warn('Failed to parse stored generated codes:', parseError);
        }
    }, [isMounted]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!canAccess) {
            router.push('/');
            return;
        }

        if (!token) {
            setLoading(false);
            return;
        }

        const fetchCodes = async () => {
            try {
                const res = await fetch('/api/admin/codes?limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCodes(data?.data?.codes || []);
                }
            } catch (fetchError) {
                console.error('Failed to load codes:', fetchError);
            } finally {
                setLoading(false);
            }
        };

        fetchCodes();
    }, [user, token, canAccess, router]);

    useEffect(() => {
        if (!isMounted) return;
        if (generated.length === 0) {
            localStorage.removeItem(GENERATED_STORAGE_KEY);
            return;
        }
        const codesById = new Map(codes.map((item) => [item.id, item] as const));
        if (codes.length === 0) {
            return;
        }
        const filtered = generated.filter((item) => {
            const record = codesById.get(item.id);
            if (!record) return true;
            if (!record.is_active) return false;
            const usedCount = Number(record.used_count ?? 0);
            const maxUses = record.max_uses == null ? null : Number(record.max_uses);
            if (maxUses == null || Number.isNaN(maxUses)) return true;
            return usedCount < maxUses;
        });
        if (filtered.length !== generated.length) {
            setGenerated(filtered);
            localStorage.setItem(GENERATED_STORAGE_KEY, JSON.stringify(filtered));
            return;
        }
        localStorage.setItem(GENERATED_STORAGE_KEY, JSON.stringify(generated));
    }, [codes, generated, isMounted]);

    useEffect(() => {
        setSelectedIds([]);
    }, [codesTab]);

    const normalizeList = (value: string) => {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    };

    const toggleUsageTarget = (value: string) => {
        setForm((prev) => {
            const nextTargets = prev.usageTargets.includes(value)
                ? prev.usageTargets.filter((item) => item !== value)
                : [...prev.usageTargets, value];
            return { ...prev, usageTargets: nextTargets };
        });
    };

    const toggleSelected = (codeId: number) => {
        setSelectedIds((prev) => (prev.includes(codeId) ? prev.filter((id) => id !== codeId) : [...prev, codeId]));
    };

    const toggleSelectAll = (checked: boolean) => {
        if (!checked) {
            setSelectedIds([]);
            return;
        }
        const filtered = codes.filter((item) => (codesTab === 'active' ? item.is_active : !item.is_active));
        setSelectedIds(filtered.map((item) => item.id));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;

        setSubmitting(true);
        setError('');

        if (form.codeType === 'invite' && (!form.validFrom || !form.validUntil)) {
            setError('Invite codes require a valid start and end date.');
            setSubmitting(false);
            return;
        }

        if (form.codeType === 'invite' && !form.membershipPlanCode) {
            setError('Invite codes require a membership plan.');
            setSubmitting(false);
            return;
        }

        if (form.codeType === 'promo' && form.discountType && !form.discountValue) {
            setError('Promo discounts require a value.');
            setSubmitting(false);
            return;
        }

        if (form.codeType === 'promo' && form.membershipPlanCode && !form.accessExpiresAt && !form.grantDurationDays) {
            setError('Membership promos require a duration or expiry date.');
            setSubmitting(false);
            return;
        }

        try {
            const isInvite = form.codeType === 'invite';
            const payload = {
                codeType: form.codeType,
                count: Number(form.count) || 1,
                description: form.description || null,
                discountType: isInvite ? null : form.discountType || null,
                discountValue: isInvite ? null : (form.discountValue ? Number(form.discountValue) : null),
                membershipPlanCode: form.membershipPlanCode || null,
                membershipGrantMode: form.membershipGrantMode || 'free',
                grantDurationDays: form.grantDurationDays ? Number(form.grantDurationDays) : null,
                roleGrant: form.roleGrant || null,
                featureFlags: isInvite ? [] : (form.featureFlags ? normalizeList(form.featureFlags) : []),
                maxUses: isInvite ? null : (form.maxUses ? Number(form.maxUses) : null),
                perUserLimit: isInvite ? true : form.perUserLimit,
                validFrom: form.validFrom || null,
                validUntil: form.validUntil || null,
                accessExpiresAt: form.accessExpiresAt || null,
                eligibleEmail: isInvite ? null : form.eligibleEmail || null,
                eligibleDomain: isInvite ? null : form.eligibleDomain || null,
                usageTargets: isInvite ? [] : form.usageTargets,
                customTags: isInvite ? '' : form.customTags
            };

            const res = await fetch('/api/admin/codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data?.message || 'Failed to generate codes.');
                return;
            }

            const data = await res.json();
            const newCodes = (data?.data?.codes || []) as GeneratedCode[];
            setGenerated((prev) => {
                const seen = new Map(prev.map((item) => [item.id, item] as const));
                newCodes.forEach((item) => {
                    seen.set(item.id, item);
                });
                const next = Array.from(seen.values());
                localStorage.setItem(GENERATED_STORAGE_KEY, JSON.stringify(next));
                return next;
            });
            setForm({ ...emptyForm, codeType: form.codeType });

            const listRes = await fetch('/api/admin/codes?limit=100', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (listRes.ok) {
                const listData = await listRes.json();
                setCodes(listData?.data?.codes || []);
            }
        } catch (submitError) {
            console.error('Failed to generate codes:', submitError);
            setError('Failed to generate codes.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (codeId: number) => {
        if (!token) return;

        try {
            const res = await fetch('/api/admin/codes/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ codeId, reason: 'Revoked by admin dashboard' })
            });

            if (!res.ok) return;

            setCodes((prev) => prev.map((item) => (item.id === codeId ? { ...item, is_active: false } : item)));
            setSelectedIds((prev) => prev.filter((id) => id !== codeId));
        } catch (revokeError) {
            console.error('Failed to revoke code:', revokeError);
        }
    };

    const handleBulkRevoke = async () => {
        if (!token || selectedIds.length === 0) return;

        try {
            const res = await fetch('/api/admin/codes/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ codeIds: selectedIds, reason: 'Revoked by admin dashboard (bulk)' })
            });

            if (!res.ok) return;

            const revoked = new Set(selectedIds);
            setCodes((prev) => prev.map((item) => (revoked.has(item.id) ? { ...item, is_active: false } : item)));
            setSelectedIds([]);
        } catch (revokeError) {
            console.error('Failed to revoke codes:', revokeError);
        }
    };

    const handleActivate = async (codeId: number) => {
        if (!token) return;
        const target = codes.find((item) => item.id === codeId);
        const label = target ? `***${target.code_hint}` : `ID ${codeId}`;
        const confirmed = window.confirm(`Reactivate code ${label}?`);
        if (!confirmed) return;

        try {
            const res = await fetch('/api/admin/codes/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ codeId, reason: 'Activated by admin dashboard' })
            });

            if (!res.ok) return;

            setCodes((prev) => prev.map((item) => (item.id === codeId ? { ...item, is_active: true } : item)));
            setSelectedIds((prev) => prev.filter((id) => id !== codeId));
        } catch (activateError) {
            console.error('Failed to activate code:', activateError);
        }
    };

    const handleBulkActivate = async () => {
        if (!token || selectedIds.length === 0) return;
        const confirmed = window.confirm(`Reactivate ${selectedIds.length} code(s)?`);
        if (!confirmed) return;

        try {
            const res = await fetch('/api/admin/codes/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ codeIds: selectedIds, reason: 'Activated by admin dashboard (bulk)' })
            });

            if (!res.ok) return;

            const activated = new Set(selectedIds);
            setCodes((prev) => prev.map((item) => (activated.has(item.id) ? { ...item, is_active: true } : item)));
            setSelectedIds([]);
        } catch (activateError) {
            console.error('Failed to activate codes:', activateError);
        }
    };

    if (!isMounted || loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-8">
                <div className="max-w-6xl mx-auto px-4 space-y-6">
                    <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
                    <div className="h-4 w-72 rounded bg-slate-200 animate-pulse" />
                    <div className="h-64 rounded-xl bg-white shadow" />
                </div>
            </div>
        );
    }

    if (!user || !canAccess) {
        return (
            <div className="min-h-screen bg-slate-50 py-8">
                <div className="max-w-3xl mx-auto px-6 text-red-700">
                    <h1 className="text-2xl font-bold">Access denied</h1>
                    <p className="mt-2">This area is restricted to admin users.</p>
                </div>
            </div>
        );
    }

    const isInvite = form.codeType === 'invite';
    const detailCode = detailId ? codes.find((item) => item.id === detailId) : null;
    const fullCode = detailId ? generated.find((item) => item.id === detailId)?.code : null;
    const filteredCodes = codes.filter((item) => (codesTab === 'active' ? item.is_active : !item.is_active));

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-6xl mx-auto px-4 space-y-8">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-blue-900">Admin Codes</h1>
                        <p className="text-slate-600">Generate invitation and promotional codes for the portal.</p>
                    </div>
                    <Link
                        href="/admin"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                    >
                        ← Back to Dashboard
                    </Link>
                </header>

                <section className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Generate codes</h2>
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Type
                            <select
                                value={form.codeType}
                                onChange={(event) => setForm({ ...form, codeType: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                                <option value="invite">Invite</option>
                                <option value="promo">Promo</option>
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Count
                            <input
                                type="number"
                                min={1}
                                max={500}
                                value={form.count}
                                onChange={(event) => setForm({ ...form, count: Number(event.target.value) })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                            Description
                            <input
                                value={form.description}
                                onChange={(event) => setForm({ ...form, description: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        {!isInvite && (
                            <>
                                <label className="text-sm font-semibold text-slate-700">
                                    Discount Type (promo only)
                                    <select
                                        value={form.discountType}
                                        onChange={(event) => setForm({ ...form, discountType: event.target.value })}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    >
                                        <option value="">None</option>
                                        <option value="percent">Percent</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                </label>
                                <label className="text-sm font-semibold text-slate-700">
                                    Discount Value
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                            </>
                        )}
                        <label className="text-sm font-semibold text-slate-700">
                            Membership Plan (invite or promo)
                            <select
                                value={form.membershipPlanCode}
                                onChange={(event) => setForm({ ...form, membershipPlanCode: event.target.value })}
                                required={isInvite}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                                {planOptions
                                    .filter((option) => !(isInvite && option.value === ''))
                                    .map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Membership Grant Mode
                            <select
                                value={form.membershipGrantMode}
                                onChange={(event) => setForm({ ...form, membershipGrantMode: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                                <option value="free">Free membership</option>
                                <option value="upgrade">Plan upgrade</option>
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Grant Duration (days)
                            <input
                                type="number"
                                min={1}
                                value={form.grantDurationDays}
                                onChange={(event) => setForm({ ...form, grantDurationDays: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Role Grant (invite or promo)
                            <select
                                value={form.roleGrant}
                                onChange={(event) => setForm({ ...form, roleGrant: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {!isInvite && (
                            <>
                                <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                                    Feature Flags (comma-separated)
                                    <input
                                        value={form.featureFlags}
                                        onChange={(event) => setForm({ ...form, featureFlags: event.target.value })}
                                        placeholder="hangarshare_new_dashboard"
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                                <div className="md:col-span-2">
                                    <p className="text-sm font-semibold text-slate-700">Usage Targets</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {usageTargetOptions.map((option) => (
                                            <label key={option.value} className="inline-flex items-center gap-2 text-xs text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={form.usageTargets.includes(option.value)}
                                                    onChange={() => toggleUsageTarget(option.value)}
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                                    Custom Tags (comma-separated)
                                    <input
                                        value={form.customTags}
                                        onChange={(event) => setForm({ ...form, customTags: event.target.value })}
                                        placeholder="landing, onboarding, promo"
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                                <label className="text-sm font-semibold text-slate-700">
                                    Max Uses
                                    <input
                                        type="number"
                                        value={form.maxUses}
                                        onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                                <label className="text-sm font-semibold text-slate-700">
                                    Per User Limit
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.perUserLimit}
                                            onChange={(event) => setForm({ ...form, perUserLimit: event.target.checked })}
                                        />
                                        <span className="text-sm text-slate-600">One redemption per user</span>
                                    </div>
                                </label>
                            </>
                        )}
                        <label className="text-sm font-semibold text-slate-700">
                            Valid From{isInvite ? ' *' : ''}
                            <input
                                type="datetime-local"
                                value={form.validFrom}
                                onChange={(event) => setForm({ ...form, validFrom: event.target.value })}
                                required={isInvite}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Valid Until{isInvite ? ' *' : ''}
                            <input
                                type="datetime-local"
                                value={form.validUntil}
                                onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
                                required={isInvite}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-700">
                            Access Expires At
                            <input
                                type="datetime-local"
                                value={form.accessExpiresAt}
                                onChange={(event) => setForm({ ...form, accessExpiresAt: event.target.value })}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </label>
                        {!isInvite && (
                            <>
                                <label className="text-sm font-semibold text-slate-700">
                                    Eligible Email
                                    <input
                                        type="email"
                                        value={form.eligibleEmail}
                                        onChange={(event) => setForm({ ...form, eligibleEmail: event.target.value })}
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                                <label className="text-sm font-semibold text-slate-700">
                                    Eligible Domain
                                    <input
                                        value={form.eligibleDomain}
                                        onChange={(event) => setForm({ ...form, eligibleDomain: event.target.value })}
                                        placeholder="example.com"
                                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    />
                                </label>
                            </>
                        )}

                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                            >
                                {submitting ? 'Generating...' : 'Generate Codes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...emptyForm, codeType: form.codeType })}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 font-semibold hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                <section className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Generated codes</h2>
                    <p className="text-sm text-slate-600 mb-4">Full codes are shown only after generation. Save them securely.</p>
                    {generated.length === 0 ? (
                        <div className="text-sm text-slate-500">No newly generated codes yet.</div>
                    ) : (
                        <div className="grid gap-3">
                            {generated.map((item) => (
                                <div key={item.id} className="rounded-lg border border-slate-200 px-4 py-3 flex flex-col gap-1">
                                    <div className="text-sm font-semibold text-slate-900">{item.code}</div>
                                    <div className="text-xs text-slate-500">Hint: {item.mask}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-white rounded-xl shadow p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Existing codes</h2>
                            <p className="text-sm text-slate-600">Only masked hints are stored for security.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCodesTab('active')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${codesTab === 'active'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Active ({codes.filter((item) => item.is_active).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setCodesTab('inactive')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${codesTab === 'inactive'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Inactive ({codes.filter((item) => !item.is_active).length})
                            </button>
                        </div>
                        <button
                            type="button"
                            disabled={selectedIds.length === 0}
                            onClick={codesTab === 'active' ? handleBulkRevoke : handleBulkActivate}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${codesTab === 'active'
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                        >
                            {codesTab === 'active' ? 'Revoke' : 'Reactivate'} selected ({selectedIds.length})
                        </button>
                    </div>
                    {loading ? (
                        <div className="text-sm text-slate-500">Loading codes...</div>
                    ) : (
                        <div className="overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-slate-500 border-b">
                                    <tr>
                                        <th className="py-2 pr-4">
                                            <input
                                                type="checkbox"
                                                checked={filteredCodes.length > 0 && filteredCodes.every((item) => selectedIds.includes(item.id))}
                                                onChange={(event) => toggleSelectAll(event.target.checked)}
                                            />
                                        </th>
                                        <th className="py-2 pr-4">Type</th>
                                        <th className="py-2 pr-4">Hint</th>
                                        <th className="py-2 pr-4">Uses</th>
                                        <th className="py-2 pr-4">Valid Until</th>
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2 pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredCodes.map((item) => (
                                        <tr key={item.id} className="text-slate-700">
                                            <td className="py-2 pr-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelected(item.id)}
                                                />
                                            </td>
                                            <td className="py-2 pr-4 uppercase">{item.code_type}</td>
                                            <td className="py-2 pr-4">***{item.code_hint}</td>
                                            <td className="py-2 pr-4">{item.used_count ?? 0}/{item.max_uses ?? '∞'}</td>
                                            <td className="py-2 pr-4">{item.valid_until ? new Date(item.valid_until).toLocaleString('pt-BR') : '—'}</td>
                                            <td className="py-2 pr-4">
                                                {item.is_active ? (
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Inactive</span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailId(item.id)}
                                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                    >
                                                        View
                                                    </button>
                                                    {item.is_active ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRevoke(item.id)}
                                                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                        >
                                                            Revoke
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActivate(item.id)}
                                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
            {detailCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
                    <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Code details</h3>
                                <p className="text-xs text-slate-500">ID: {detailCode.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailId(null)}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                            >
                                Close
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-3 text-sm text-slate-700">
                            <div>
                                <p className="text-xs font-semibold text-slate-500">Full code</p>
                                <p className="font-semibold text-slate-900">
                                    {fullCode ?? `***${detailCode.code_hint}`}
                                </p>
                                {!fullCode && (
                                    <p className="text-xs text-slate-500">Full code is only available at generation.</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Type</p>
                                    <p className="uppercase">{detailCode.code_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Status</p>
                                    <p>{detailCode.is_active ? 'Active' : 'Inactive'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Uses</p>
                                    <p>{detailCode.used_count ?? 0}/{detailCode.max_uses ?? '∞'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Valid until</p>
                                    <p>{detailCode.valid_until ? new Date(detailCode.valid_until).toLocaleString('pt-BR') : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Plan</p>
                                    <p>{detailCode.membership_plan_code || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Role</p>
                                    <p>{detailCode.role_grant || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Discount</p>
                                    <p>{detailCode.discount_type ? `${detailCode.discount_type} ${detailCode.discount_value ?? ''}` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Created</p>
                                    <p>{detailCode.created_at ? new Date(detailCode.created_at).toLocaleString('pt-BR') : '—'}</p>
                                </div>
                            </div>
                            {detailCode.description && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Description</p>
                                    <p>{detailCode.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
