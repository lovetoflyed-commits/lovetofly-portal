'use client';

import { useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function TransfersPilotsPage() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    contactEmail: '',
    contactPhone: '',
    licenseType: '',
    licenseNumber: '',
    medicalExpiry: '',
    totalHours: '',
    ratings: '',
    categories: '',
    baseCity: '',
    availability: '',
    notes: '',
  });

  const [licenseDocument, setLicenseDocument] = useState<File | null>(null);
  const [medicalDocument, setMedicalDocument] = useState<File | null>(null);
  const [logbookDocument, setLogbookDocument] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<FileList | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitted(false);

    if (!formData.fullName || !formData.contactEmail || !formData.licenseType || !formData.licenseNumber) {
      setSubmitError(t('transfersPilots.formErrors.requiredFields'));
      return;
    }

    if (!licenseDocument || !medicalDocument) {
      setSubmitError(t('transfersPilots.formErrors.requiredDocuments'));
      return;
    }

    const payload = new FormData();
    payload.append('fullName', formData.fullName);
    payload.append('contactEmail', formData.contactEmail);
    payload.append('contactPhone', formData.contactPhone);
    payload.append('licenseType', formData.licenseType);
    payload.append('licenseNumber', formData.licenseNumber);
    payload.append('medicalExpiry', formData.medicalExpiry);
    payload.append('totalHours', formData.totalHours);
    payload.append('ratings', formData.ratings);
    payload.append('categories', formData.categories);
    payload.append('baseCity', formData.baseCity);
    payload.append('availability', formData.availability);
    payload.append('notes', formData.notes);

    payload.append('licenseDocument', licenseDocument);
    payload.append('medicalDocument', medicalDocument);
    if (logbookDocument) {
      payload.append('logbookDocument', logbookDocument);
    }
    if (additionalDocuments) {
      Array.from(additionalDocuments).forEach((file) => payload.append('additionalDocuments', file));
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/traslados/pilots', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || t('transfersPilots.formErrors.submitFailed'));
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('transfersPilots.formErrors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto space-y-10">
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900">{t('transfersPilots.heroTitle')}</h1>
                <p className="mt-3 text-lg text-gray-600">{t('transfersPilots.heroSubtitle')}</p>
                <p className="mt-3 text-sm text-gray-500">{t('transfersPilots.heroDisclaimer')}</p>
              </section>

              <section className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: t('transfersPilots.cards.requirementsTitle'),
                    description: t('transfersPilots.cards.requirementsDescription'),
                  },
                  {
                    title: t('transfersPilots.cards.processTitle'),
                    description: t('transfersPilots.cards.processDescription'),
                  },
                  {
                    title: t('transfersPilots.cards.monitoringTitle'),
                    description: t('transfersPilots.cards.monitoringDescription'),
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersPilots.prereqTitle')}</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>{t('transfersPilots.prereqItem1')}</li>
                  <li>{t('transfersPilots.prereqItem2')}</li>
                  <li>{t('transfersPilots.prereqItem3')}</li>
                  <li>{t('transfersPilots.prereqItem4')}</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersPilots.messagesTitle')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('transfersPilots.messagesBody')}</p>
                <a
                  href="/traslados/messages"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {t('transfersPilots.messagesCta')}
                </a>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersPilots.formTitle')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('transfersPilots.formSubtitle')}</p>

                {submitted && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {t('transfersPilots.formSuccess')}
                  </div>
                )}

                {submitError && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="full-name">
                        {t('transfersPilots.form.fullName')} *
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        value={formData.fullName}
                        onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="contact-email">
                        {t('transfersPilots.form.contactEmail')} *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(event) => setFormData({ ...formData, contactEmail: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="contact-phone">
                        {t('transfersPilots.form.contactPhone')}
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(event) => setFormData({ ...formData, contactPhone: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="license-type">
                        {t('transfersPilots.form.licenseType')} *
                      </label>
                      <input
                        id="license-type"
                        type="text"
                        value={formData.licenseType}
                        onChange={(event) => setFormData({ ...formData, licenseType: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        placeholder={t('transfersPilots.form.licenseTypePlaceholder')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="license-number">
                        {t('transfersPilots.form.licenseNumber')} *
                      </label>
                      <input
                        id="license-number"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(event) => setFormData({ ...formData, licenseNumber: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="medical-expiry">
                        {t('transfersPilots.form.medicalExpiry')}
                      </label>
                      <input
                        id="medical-expiry"
                        type="date"
                        value={formData.medicalExpiry}
                        onChange={(event) => setFormData({ ...formData, medicalExpiry: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="total-hours">
                        {t('transfersPilots.form.totalHours')}
                      </label>
                      <input
                        id="total-hours"
                        type="number"
                        value={formData.totalHours}
                        onChange={(event) => setFormData({ ...formData, totalHours: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="base-city">
                        {t('transfersPilots.form.baseCity')}
                      </label>
                      <input
                        id="base-city"
                        type="text"
                        value={formData.baseCity}
                        onChange={(event) => setFormData({ ...formData, baseCity: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="ratings">
                        {t('transfersPilots.form.ratings')}
                      </label>
                      <input
                        id="ratings"
                        type="text"
                        value={formData.ratings}
                        onChange={(event) => setFormData({ ...formData, ratings: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        placeholder={t('transfersPilots.form.ratingsPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="categories">
                        {t('transfersPilots.form.categories')}
                      </label>
                      <input
                        id="categories"
                        type="text"
                        value={formData.categories}
                        onChange={(event) => setFormData({ ...formData, categories: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                        placeholder={t('transfersPilots.form.categoriesPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="availability">
                      {t('transfersPilots.form.availability')}
                    </label>
                    <input
                      id="availability"
                      type="text"
                      value={formData.availability}
                      onChange={(event) => setFormData({ ...formData, availability: event.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                      placeholder={t('transfersPilots.form.availabilityPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="notes">
                      {t('transfersPilots.form.notes')}
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="license-document">
                        {t('transfersPilots.form.licenseDocument')} *
                      </label>
                      <input
                        id="license-document"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) => setLicenseDocument(event.target.files?.[0] || null)}
                        className="mt-2 w-full text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="medical-document">
                        {t('transfersPilots.form.medicalDocument')} *
                      </label>
                      <input
                        id="medical-document"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) => setMedicalDocument(event.target.files?.[0] || null)}
                        className="mt-2 w-full text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="logbook-document">
                        {t('transfersPilots.form.logbookDocument')}
                      </label>
                      <input
                        id="logbook-document"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) => setLogbookDocument(event.target.files?.[0] || null)}
                        className="mt-2 w-full text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="additional-documents">
                      {t('transfersPilots.form.additionalDocuments')}
                    </label>
                    <input
                      id="additional-documents"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      multiple
                      onChange={(event) => setAdditionalDocuments(event.target.files)}
                      className="mt-2 w-full text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-300"
                    >
                      {isSubmitting ? t('transfersPilots.form.submitting') : t('transfersPilots.form.submit')}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('transfersPilots.ctaTitle')}</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('transfersPilots.ctaSubtitle')}</p>
                  </div>
                  <a
                    href="mailto:suporte@lovetofly.com.br"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    {t('transfersPilots.ctaButton')}
                  </a>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
