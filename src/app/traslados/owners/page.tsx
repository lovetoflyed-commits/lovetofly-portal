'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function TransfersOwnersPage() {
  const { t } = useLanguage();
  const [pilots, setPilots] = useState<TrasladosPilot[]>([]);
  const [pilotDocuments, setPilotDocuments] = useState<TrasladosPilotDocument[]>([]);
  const [loadingPilots, setLoadingPilots] = useState(true);

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        const res = await fetch('/api/traslados/pilots?status=approved');
        if (res.ok) {
          const data = await res.json();
          setPilots(data.pilots || []);
          setPilotDocuments(data.documents || []);
        }
      } catch (error) {
        console.error('Erro ao buscar pilotos:', error);
      } finally {
        setLoadingPilots(false);
      }
    };

    fetchPilots();
  }, []);

  const docsByPilot = pilotDocuments.reduce<Record<number, TrasladosPilotDocument[]>>((acc, doc) => {
    if (!acc[doc.pilot_id]) acc[doc.pilot_id] = [];
    acc[doc.pilot_id].push(doc);
    return acc;
  }, {});

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto space-y-10">
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900">{t('transfersOwners.heroTitle')}</h1>
                <p className="mt-3 text-lg text-gray-600">{t('transfersOwners.heroSubtitle')}</p>
                <p className="mt-3 text-sm text-gray-500">{t('transfersOwners.heroDisclaimer')}</p>
              </section>

              <section className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: t('transfersOwners.cards.planningTitle'),
                    description: t('transfersOwners.cards.planningDescription'),
                  },
                  {
                    title: t('transfersOwners.cards.complianceTitle'),
                    description: t('transfersOwners.cards.complianceDescription'),
                  },
                  {
                    title: t('transfersOwners.cards.monitoringTitle'),
                    description: t('transfersOwners.cards.monitoringDescription'),
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersOwners.documentsTitle')}</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>{t('transfersOwners.documentsItem1')}</li>
                  <li>{t('transfersOwners.documentsItem2')}</li>
                  <li>{t('transfersOwners.documentsItem3')}</li>
                  <li>{t('transfersOwners.documentsItem4')}</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersOwners.monitoringTitle')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('transfersOwners.monitoringBody')}</p>
                <p className="mt-2 text-xs text-gray-500">{t('transfersOwners.monitoringNote')}</p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersOwners.messagesTitle')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('transfersOwners.messagesBody')}</p>
                <a
                  href="/traslados/messages"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {t('transfersOwners.messagesCta')}
                </a>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">{t('transfersOwners.availablePilotsTitle')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('transfersOwners.availablePilotsSubtitle')}</p>

                {loadingPilots ? (
                  <div className="mt-6 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">{t('transfersOwners.loadingPilots')}</div>
                ) : pilots.length === 0 ? (
                  <div className="mt-6 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">{t('transfersOwners.emptyPilots')}</div>
                ) : (
                  <div className="mt-6 grid gap-4">
                    {pilots.map((pilot) => (
                      <div key={pilot.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{pilot.full_name}</h3>
                            <p className="text-sm text-gray-600">
                              {pilot.license_type} • {pilot.license_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t('transfersOwners.baseLabel')}: {pilot.base_city || t('transfersOwners.baseFallback')} • {t('transfersOwners.hoursLabel')}: {pilot.total_hours ?? t('transfersOwners.hoursFallback')}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{pilot.contact_email}</div>
                            <div>{pilot.contact_phone || t('transfersOwners.phoneFallback')}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          {t('transfersOwners.ratingsLabel')}: {pilot.ratings || t('transfersOwners.ratingsFallback')} • {t('transfersOwners.categoriesLabel')}: {pilot.categories || t('transfersOwners.categoriesFallback')}
                        </div>
                        {docsByPilot[pilot.id]?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {docsByPilot[pilot.id].map((doc) => (
                              <a
                                key={`${pilot.id}-${doc.file_path}`}
                                href={doc.file_path}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-blue-200 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                              >
                                {doc.document_type}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{t('transfersOwners.readyTitle')}</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('transfersOwners.readySubtitle')}</p>
                  </div>
                  <a
                    href="/traslados#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    {t('transfersOwners.readyCta')}
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

interface TrasladosPilot {
  id: number;
  full_name: string;
  contact_email: string;
  contact_phone: string | null;
  license_type: string;
  license_number: string;
  base_city: string | null;
  total_hours: number | null;
  ratings: string | null;
  categories: string | null;
}

interface TrasladosPilotDocument {
  pilot_id: number;
  document_type: string;
  file_path: string;
  file_name: string | null;
}
