'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { trackEvent, trackPageView } from '@/utils/analytics';
import { useLanguage } from '@/context/LanguageContext';

type TransferFormData = {
  aircraftModel: string;
  aircraftPrefix: string;
  aircraftCategory: string;
  maintenanceStatus: string;
  originCity: string;
  originAirport: string;
  destinationCity: string;
  destinationAirport: string;
  dateWindowStart: string;
  dateWindowEnd: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  operatorName: string;
  notes: string;
  ownerAuthorization: boolean;
};

type TransferFormErrors = Partial<Record<keyof TransferFormData, string>>;

export default function AircraftTransfersPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<TransferFormData>({
    aircraftModel: '',
    aircraftPrefix: '',
    aircraftCategory: '',
    maintenanceStatus: '',
    originCity: '',
    originAirport: '',
    destinationCity: '',
    destinationAirport: '',
    dateWindowStart: '',
    dateWindowEnd: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    operatorName: '',
    notes: '',
    ownerAuthorization: false,
  });
  const [errors, setErrors] = useState<TransferFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    trackPageView('/traslados');
  }, []);

  const updateField = <K extends keyof TransferFormData>(field: K, value: TransferFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: TransferFormErrors = {};

    if (!formData.aircraftModel.trim()) nextErrors.aircraftModel = t('transfers.formErrors.aircraftModel');
    if (!formData.aircraftPrefix.trim()) nextErrors.aircraftPrefix = t('transfers.formErrors.aircraftPrefix');
    if (!formData.aircraftCategory) nextErrors.aircraftCategory = t('transfers.formErrors.aircraftCategory');
    if (!formData.originCity.trim()) nextErrors.originCity = t('transfers.formErrors.originCity');
    if (!formData.destinationCity.trim()) nextErrors.destinationCity = t('transfers.formErrors.destinationCity');
    if (!formData.dateWindowStart) nextErrors.dateWindowStart = t('transfers.formErrors.dateWindowStart');
    if (!formData.contactName.trim()) nextErrors.contactName = t('transfers.formErrors.contactName');
    if (!formData.contactEmail.trim()) nextErrors.contactEmail = t('transfers.formErrors.contactEmail');
    if (!formData.ownerAuthorization) nextErrors.ownerAuthorization = t('transfers.formErrors.ownerAuthorization');

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm();

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError('');
      setRequestId(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      fetch('/api/traslados/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(payload?.message || 'Falha ao enviar solicitação');
          }
          setSubmitted(true);
          setRequestId(payload?.requestId ?? null);
          trackEvent('transfer_quote_submitted', '/traslados/quote-submitted');
        })
        .catch((error: Error) => {
          setSubmitError(error.message || 'Falha ao enviar solicitação');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto space-y-12">
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">{t('transfers.heroTitle')}</h1>
                    <p className="text-lg text-gray-600">{t('transfers.heroSubtitle')}</p>
                  </div>
                  <a
                    href="#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    {t('transfers.heroCta')}
                  </a>
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: t('transfers.services.deliveryTitle'),
                    description: t('transfers.services.deliveryDescription'),
                  },
                  {
                    title: t('transfers.services.maintenanceTitle'),
                    description: t('transfers.services.maintenanceDescription'),
                  },
                  {
                    title: t('transfers.services.ferryTitle'),
                    description: t('transfers.services.ferryDescription'),
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.ownersTitle')}</h2>
                  <p className="mt-3 text-sm text-gray-600">{t('transfers.ownersSubtitle')}</p>
                  <a
                    href="/traslados/owners"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    {t('transfers.ownersCta')}
                  </a>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.pilotsTitle')}</h2>
                  <p className="mt-3 text-sm text-gray-600">{t('transfers.pilotsSubtitle')}</p>
                  <a
                    href="/traslados/pilots"
                    className="mt-6 inline-flex items-center justify-center rounded-lg border border-sky-600 px-5 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    {t('transfers.pilotsCta')}
                  </a>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.howItWorksTitle')}</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  {[
                    t('transfers.howItWorksStep1'),
                    t('transfers.howItWorksStep2'),
                    t('transfers.howItWorksStep3'),
                    t('transfers.howItWorksStep4'),
                    t('transfers.howItWorksStep5'),
                  ].map((step, index) => (
                    <div key={step} className="rounded-xl bg-sky-50 p-4 text-sm text-gray-700">
                      <div className="text-xs font-semibold text-sky-700">
                        {t('transfers.stepLabel')} {index + 1}
                      </div>
                      <div className="mt-2 font-medium text-gray-900">{step}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.securityTitle')}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>{t('transfers.securityItem1')}</li>
                    <li>{t('transfers.securityItem2')}</li>
                    <li>{t('transfers.securityItem3')}</li>
                    <li>{t('transfers.securityItem4')}</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.costsTitle')}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>{t('transfers.costsItem1')}</li>
                    <li>{t('transfers.costsItem2')}</li>
                    <li>{t('transfers.costsItem3')}</li>
                    <li>{t('transfers.costsItem4')}</li>
                  </ul>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.ctaTitle')}</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('transfers.ctaSubtitle')}</p>
                  </div>
                  <a
                    href="#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg border border-sky-600 px-5 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    {t('transfers.ctaButton')}
                  </a>
                </div>
              </section>

              <section id="traslados-cotacao" className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.formTitle')}</h2>
                  <p className="text-sm text-gray-600">{t('transfers.formSubtitle')}</p>
                </div>

                {submitted && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {t('transfers.formSuccess')}
                    {requestId && (
                      <span className="block mt-1">
                        {t('transfers.formProtocol')}: TR-{requestId}
                      </span>
                    )}
                  </div>
                )}

                {submitError && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="aircraft-model">
                        {t('transfers.form.aircraftModelLabel')} *
                      </label>
                      <input
                        id="aircraft-model"
                        type="text"
                        value={formData.aircraftModel}
                        onChange={(event) => updateField('aircraftModel', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.aircraftModel)}
                        aria-describedby={errors.aircraftModel ? 'aircraft-model-error' : undefined}
                        required
                      />
                      {errors.aircraftModel && (
                        <p id="aircraft-model-error" className="mt-2 text-xs text-red-600">
                          {errors.aircraftModel}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="aircraft-prefix">
                        {t('transfers.form.aircraftPrefixLabel')} *
                      </label>
                      <input
                        id="aircraft-prefix"
                        type="text"
                        value={formData.aircraftPrefix}
                        onChange={(event) => updateField('aircraftPrefix', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.aircraftPrefix)}
                        aria-describedby={errors.aircraftPrefix ? 'aircraft-prefix-error' : undefined}
                        required
                      />
                      {errors.aircraftPrefix && (
                        <p id="aircraft-prefix-error" className="mt-2 text-xs text-red-600">
                          {errors.aircraftPrefix}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="aircraft-category">
                        {t('transfers.form.aircraftCategoryLabel')} *
                      </label>
                      <select
                        id="aircraft-category"
                        value={formData.aircraftCategory}
                        onChange={(event) => updateField('aircraftCategory', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.aircraftCategory)}
                        aria-describedby={errors.aircraftCategory ? 'aircraft-category-error' : undefined}
                        required
                      >
                        <option value="">{t('transfers.form.selectOption')}</option>
                        <option value="pistao">{t('transfers.form.categoryPistonSingle')}</option>
                        <option value="multi">{t('transfers.form.categoryPistonMulti')}</option>
                        <option value="turboelice">{t('transfers.form.categoryTurboprop')}</option>
                        <option value="jato">{t('transfers.form.categoryJet')}</option>
                      </select>
                      {errors.aircraftCategory && (
                        <p id="aircraft-category-error" className="mt-2 text-xs text-red-600">
                          {errors.aircraftCategory}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="maintenance-status">
                      {t('transfers.form.maintenanceStatusLabel')}
                    </label>
                    <input
                      id="maintenance-status"
                      type="text"
                      value={formData.maintenanceStatus}
                      onChange={(event) => updateField('maintenanceStatus', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder={t('transfers.form.maintenanceStatusPlaceholder')}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="origin-city">
                        {t('transfers.form.originCityLabel')} *
                      </label>
                      <input
                        id="origin-city"
                        type="text"
                        value={formData.originCity}
                        onChange={(event) => updateField('originCity', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.originCity)}
                        aria-describedby={errors.originCity ? 'origin-city-error' : undefined}
                        required
                      />
                      {errors.originCity && (
                        <p id="origin-city-error" className="mt-2 text-xs text-red-600">
                          {errors.originCity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="origin-airport">
                        {t('transfers.form.originAirportLabel')}
                      </label>
                      <input
                        id="origin-airport"
                        type="text"
                        value={formData.originAirport}
                        onChange={(event) => updateField('originAirport', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder={t('transfers.form.airportPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="destination-city">
                        {t('transfers.form.destinationCityLabel')} *
                      </label>
                      <input
                        id="destination-city"
                        type="text"
                        value={formData.destinationCity}
                        onChange={(event) => updateField('destinationCity', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.destinationCity)}
                        aria-describedby={errors.destinationCity ? 'destination-city-error' : undefined}
                        required
                      />
                      {errors.destinationCity && (
                        <p id="destination-city-error" className="mt-2 text-xs text-red-600">
                          {errors.destinationCity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="destination-airport">
                        {t('transfers.form.destinationAirportLabel')}
                      </label>
                      <input
                        id="destination-airport"
                        type="text"
                        value={formData.destinationAirport}
                        onChange={(event) => updateField('destinationAirport', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder={t('transfers.form.airportPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="date-window-start">
                        {t('transfers.form.dateWindowStartLabel')} *
                      </label>
                      <input
                        id="date-window-start"
                        type="date"
                        value={formData.dateWindowStart}
                        onChange={(event) => updateField('dateWindowStart', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.dateWindowStart)}
                        aria-describedby={errors.dateWindowStart ? 'date-window-start-error' : undefined}
                        required
                      />
                      {errors.dateWindowStart && (
                        <p id="date-window-start-error" className="mt-2 text-xs text-red-600">
                          {errors.dateWindowStart}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="date-window-end">
                        {t('transfers.form.dateWindowEndLabel')}
                      </label>
                      <input
                        id="date-window-end"
                        type="date"
                        value={formData.dateWindowEnd}
                        onChange={(event) => updateField('dateWindowEnd', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="contact-name">
                        {t('transfers.form.contactNameLabel')} *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={formData.contactName}
                        onChange={(event) => updateField('contactName', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.contactName)}
                        aria-describedby={errors.contactName ? 'contact-name-error' : undefined}
                        required
                      />
                      {errors.contactName && (
                        <p id="contact-name-error" className="mt-2 text-xs text-red-600">
                          {errors.contactName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="contact-email">
                        {t('transfers.form.contactEmailLabel')} *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(event) => updateField('contactEmail', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        aria-invalid={Boolean(errors.contactEmail)}
                        aria-describedby={errors.contactEmail ? 'contact-email-error' : undefined}
                        required
                      />
                      {errors.contactEmail && (
                        <p id="contact-email-error" className="mt-2 text-xs text-red-600">
                          {errors.contactEmail}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="contact-phone">
                        {t('transfers.form.contactPhoneLabel')}
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(event) => updateField('contactPhone', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder={t('transfers.form.contactPhonePlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="operator-name">
                      {t('transfers.form.operatorNameLabel')}
                    </label>
                    <input
                      id="operator-name"
                      type="text"
                      value={formData.operatorName}
                      onChange={(event) => updateField('operatorName', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="notes">
                      {t('transfers.form.notesLabel')}
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(event) => updateField('notes', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder={t('transfers.form.notesPlaceholder')}
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <label className="flex items-start gap-3 text-sm text-gray-700" htmlFor="owner-authorization">
                      <input
                        id="owner-authorization"
                        type="checkbox"
                        checked={formData.ownerAuthorization}
                        onChange={(event) => updateField('ownerAuthorization', event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{t('transfers.form.ownerAuthorizationLabel')} *</span>
                    </label>
                    {errors.ownerAuthorization && (
                      <p className="mt-2 text-xs text-red-600">{errors.ownerAuthorization}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-gray-500">
                      {t('transfers.form.disclaimer')}
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                    >
                      {isSubmitting ? t('transfers.form.submitting') : t('transfers.form.submit')}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-xs text-gray-500">
                {t('transfers.disclaimer')}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
                {t('transfers.statusIntro')}{' '}
                <a href="/traslados/status" className="text-sky-700 hover:underline">/traslados/status</a>.
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfers.faqTitle')}</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      q: t('transfers.faq.q1'),
                      a: t('transfers.faq.a1'),
                    },
                    {
                      q: t('transfers.faq.q2'),
                      a: t('transfers.faq.a2'),
                    },
                    {
                      q: t('transfers.faq.q3'),
                      a: t('transfers.faq.a3'),
                    },
                    {
                      q: t('transfers.faq.q4'),
                      a: t('transfers.faq.a4'),
                    },
                  ].map((item) => (
                    <div key={item.q} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <h3 className="text-sm font-semibold text-gray-900">{item.q}</h3>
                      <p className="mt-2 text-sm text-gray-600">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
