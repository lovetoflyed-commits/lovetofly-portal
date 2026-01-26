'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function TransfersOwnersPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Traslados para proprietários e operadores</h1>
                <p className="mt-3 text-lg text-gray-600">
                  Gestão completa do traslado com conformidade regulatória, planejamento técnico e comunicação dedicada.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  O portal atua como conector entre contratante e piloto. A operação é responsabilidade das partes.
                </p>
              </section>

              <section className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: 'Planejamento técnico',
                    description: 'Rota, performance, combustível e alternados alinhados à operação.',
                  },
                  {
                    title: 'Compliance e documentação',
                    description: 'Checklists de aeronavegabilidade, autorizações e registros em dia.',
                  },
                  {
                    title: 'Acompanhamento completo',
                    description: 'Status atualizado durante toda a operação com reporte final.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Documentos essenciais</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600">
                  <li>Registro e aeronavegabilidade válidos.</li>
                  <li>Cadernetas atualizadas e ADs cumpridas.</li>
                  <li>Autorização do proprietário para execução do traslado.</li>
                  <li>Informações de hangar/handling na origem e no destino.</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Monitoramento da operação</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Contratante e piloto fornecem informações para atualização de status: início da operação,
                  dados do voo, escalas, chegadas e interrupções por motivos técnicos ou meteorológicos.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  O portal apenas registra e exibe essas informações, sem responsabilidade operacional.
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Mensagens no portal</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Todas as negociações devem ocorrer pelas mensagens do portal para garantir a taxa de serviço.
                  Contatos pessoais são bloqueados automaticamente.
                </p>
                <a
                  href="/traslados/messages"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Abrir mensagens
                </a>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Pilotos disponíveis</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Lista de pilotos aprovados para traslados nacionais. Valide a documentação antes de contratar.
                </p>

                {loadingPilots ? (
                  <div className="mt-6 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">Carregando pilotos...</div>
                ) : pilots.length === 0 ? (
                  <div className="mt-6 rounded-lg bg-slate-50 p-6 text-sm text-slate-600">Nenhum piloto aprovado no momento.</div>
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
                              Base: {pilot.base_city || 'Não informado'} • Horas: {pilot.total_hours ?? '—'}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{pilot.contact_email}</div>
                            <div>{pilot.contact_phone || 'Telefone não informado'}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Habilitações: {pilot.ratings || '—'} • Categorias: {pilot.categories || '—'}
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
                    <h2 className="text-2xl font-semibold text-gray-900">Pronto para solicitar?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Utilize o formulário completo na página principal de traslados para enviar sua solicitação.
                    </p>
                  </div>
                  <a
                    href="/traslados#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    Ir para cotação
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
