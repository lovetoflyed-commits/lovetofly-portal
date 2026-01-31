export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-6 bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Termos de Uso</h1>
        <p className="text-slate-700 mb-4">
          Ao utilizar o Love to Fly, você concorda com estes termos.
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Uso da plataforma</h2>
        <p className="text-slate-700">
          É proibido publicar conteúdos ilegais, enganosos ou que violem direitos de terceiros.
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Pagamentos e reservas</h2>
        <p className="text-slate-700">
          Pagamentos são processados por provedores terceiros e estão sujeitos a políticas de
          cancelamento e reembolso específicas.
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Limitação de responsabilidade</h2>
        <p className="text-slate-700">
          O Love to Fly não se responsabiliza por perdas indiretas e atua como intermediador entre usuários.
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-2">Contato</h2>
        <p className="text-slate-700">
          Dúvidas sobre termos: suporte@lovetofly.com.br
        </p>
      </div>
    </div>
  );
}
