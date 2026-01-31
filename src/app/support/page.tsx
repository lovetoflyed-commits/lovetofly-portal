export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-6 bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Suporte e SLA</h1>
        <p className="text-slate-700 mb-4">
          Nosso time de suporte responde solicitações em até 1 dia útil.
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Canais de atendimento</h2>
        <ul className="list-disc list-inside text-slate-700">
          <li>Email: suporte@lovetofly.com.br</li>
          <li>Horário: segunda a sexta, 9h–18h (BRT)</li>
        </ul>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Tipos de solicitação</h2>
        <p className="text-slate-700">
          Pagamentos, reservas, denúncias, problemas de acesso e dúvidas gerais.
        </p>
      </div>
    </div>
  );
}
