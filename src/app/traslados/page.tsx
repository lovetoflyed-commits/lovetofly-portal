'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { trackEvent, trackPageView } from '@/utils/analytics';

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

    if (!formData.aircraftModel.trim()) nextErrors.aircraftModel = 'Informe o modelo da aeronave.';
    if (!formData.aircraftPrefix.trim()) nextErrors.aircraftPrefix = 'Informe o prefixo.';
    if (!formData.aircraftCategory) nextErrors.aircraftCategory = 'Selecione a categoria.';
    if (!formData.originCity.trim()) nextErrors.originCity = 'Informe a cidade de origem.';
    if (!formData.destinationCity.trim()) nextErrors.destinationCity = 'Informe a cidade de destino.';
    if (!formData.dateWindowStart) nextErrors.dateWindowStart = 'Selecione a data inicial.';
    if (!formData.contactName.trim()) nextErrors.contactName = 'Informe o nome para contato.';
    if (!formData.contactEmail.trim()) nextErrors.contactEmail = 'Informe o e-mail.';
    if (!formData.ownerAuthorization) nextErrors.ownerAuthorization = 'Confirme a autorização do proprietário.';

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm();

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError('');

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
          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.message || 'Falha ao enviar solicitação');
          }
          setSubmitted(true);
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
          const payload = await response.json().catch(() => null);
          if (payload?.requestId) {
            setRequestId(payload.requestId);
          }
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto space-y-12">
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">Traslados de Aeronaves</h1>
                    <p className="text-lg text-gray-600">
                      Planejamento completo, equipe experiente e acompanhamento ponta a ponta no Brasil.
                    </p>
                  </div>
                  <a
                    href="#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    Solicitar cotação
                  </a>
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: 'Entrega pós-compra e reposicionamento',
                    description: 'Traslado seguro para novo hangar, base operacional ou destino final.',
                  },
                  {
                    title: 'Manutenção (ida e volta)',
                    description: 'Coordenação de logística completa para MRO e retorno.',
                  },
                  {
                    title: 'Ferry pós-reparo',
                    description: 'Gestão de documentação e execução com foco em conformidade.',
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
                  <h2 className="text-2xl font-semibold text-gray-900">Sou proprietário ou operador</h2>
                  <p className="mt-3 text-sm text-gray-600">
                    Solicite traslado com planejamento completo, compliance e acompanhamento dedicado.
                  </p>
                  <a
                    href="/traslados/owners"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    Ver detalhes para proprietários
                  </a>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">Sou piloto</h2>
                  <p className="mt-3 text-sm text-gray-600">
                    Conheça os requisitos e o fluxo de cadastro para atuar nos traslados.
                  </p>
                  <a
                    href="/traslados/pilots"
                    className="mt-6 inline-flex items-center justify-center rounded-lg border border-sky-600 px-5 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    Ver detalhes para pilotos
                  </a>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">Como funciona</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  {[
                    'Envio dos dados',
                    'Análise técnica e regulatória',
                    'Proposta e cronograma',
                    'Execução e acompanhamento',
                    'Relatório final',
                  ].map((step, index) => (
                    <div key={step} className="rounded-xl bg-sky-50 p-4 text-sm text-gray-700">
                      <div className="text-xs font-semibold text-sky-700">Etapa {index + 1}</div>
                      <div className="mt-2 font-medium text-gray-900">{step}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">Segurança e compliance</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>Checklists operacionais e documentação válida.</li>
                    <li>Tripulação habilitada e compatível com a operação.</li>
                    <li>Coordenação ATC e planejamento de rotas.</li>
                    <li>Monitoramento e comunicação com o cliente.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900">Custos típicos</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>Combustível e taxas aeroportuárias.</li>
                    <li>Handling, estacionamento e apoio em solo.</li>
                    <li>Seguro e despesas de tripulação.</li>
                    <li>Serviços adicionais sob demanda.</li>
                  </ul>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Precisa de um traslado?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Receba uma proposta personalizada em até 48–72h úteis após o envio completo dos dados.
                    </p>
                  </div>
                  <a
                    href="#traslados-cotacao"
                    className="inline-flex items-center justify-center rounded-lg border border-sky-600 px-5 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    Iniciar solicitação
                  </a>
                </div>
              </section>

              <section id="traslados-cotacao" className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900">Solicite sua cotação</h2>
                  <p className="text-sm text-gray-600">
                    Preencha os dados essenciais para iniciarmos a análise técnica. Campos com * são obrigatórios.
                  </p>
                </div>

                {submitted && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Solicitação enviada. Nossa equipe retornará com a proposta em até 72h úteis.
                    {requestId && (
                      <span className="block mt-1">Protocolo: TR-{requestId}</span>
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
                        Modelo da aeronave *
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
                        Prefixo *
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
                        Categoria *
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
                        <option value="">Selecione</option>
                        <option value="pistao">Monomotor a pistão</option>
                        <option value="multi">Multimotor a pistão</option>
                        <option value="turboelice">Turboélice</option>
                        <option value="jato">Jato</option>
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
                      Status de manutenção
                    </label>
                    <input
                      id="maintenance-status"
                      type="text"
                      value={formData.maintenanceStatus}
                      onChange={(event) => updateField('maintenanceStatus', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="Ex.: Inspeção vigente, ADs cumpridas"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="origin-city">
                        Cidade/UF de origem *
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
                        Aeródromo de origem
                      </label>
                      <input
                        id="origin-airport"
                        type="text"
                        value={formData.originAirport}
                        onChange={(event) => updateField('originAirport', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="ICAO/IATA"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="destination-city">
                        Cidade/UF de destino *
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
                        Aeródromo de destino
                      </label>
                      <input
                        id="destination-airport"
                        type="text"
                        value={formData.destinationAirport}
                        onChange={(event) => updateField('destinationAirport', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="ICAO/IATA"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700" htmlFor="date-window-start">
                        Data inicial *
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
                        Data final
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
                        Nome para contato *
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
                        E-mail *
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
                        Telefone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(event) => updateField('contactPhone', event.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="(11) 90000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="operator-name">
                      Responsável técnico/operador
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
                      Observações
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={(event) => updateField('notes', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="Requisitos especiais, escalas, etc."
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
                      <span>Confirmo que tenho autorização do proprietário para solicitar este traslado. *</span>
                    </label>
                    {errors.ownerAuthorization && (
                      <p className="mt-2 text-xs text-red-600">{errors.ownerAuthorization}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-gray-500">
                      Ao enviar, você concorda com o uso das informações para análise da solicitação.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-xs text-gray-500">
                A execução do traslado está sujeita à validação documental, aeronavegabilidade e condições operacionais.
                Prazos podem variar conforme meteorologia, disponibilidade e autorizações aplicáveis. O portal atua
                como conector entre contratante e piloto, oferecendo informações e status — a operação é de
                responsabilidade das partes.
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
                Acompanhe e atualize o status da operação em
                {' '}
                <a href="/traslados/status" className="text-sky-700 hover:underline">/traslados/status</a>.
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900">FAQ</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      q: 'Quanto tempo leva um traslado?',
                      a: 'O prazo varia conforme rota e disponibilidade, com SLA de resposta em até 72h úteis.',
                    },
                    {
                      q: 'Quais documentos são necessários?',
                      a: 'Registro, aeronavegabilidade, cadernetas atualizadas e autorização do proprietário.',
                    },
                    {
                      q: 'Posso acompanhar o voo?',
                      a: 'Sim, enviamos atualizações de status durante toda a operação.',
                    },
                    {
                      q: 'E se a aeronave não estiver apta?',
                      a: 'Indicamos as adequações necessárias antes de seguir com a operação.',
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
