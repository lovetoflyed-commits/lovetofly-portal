'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdvertiserSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    companyCnpj: '',
    bankCode: '',
    bankAgency: '',
    bankAccount: '',
    accountHolderName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user?.id) {
        setError('Usuário não identificado. Faça login novamente.');
        return;
      }

      if (!formData.companyName || !formData.companyCnpj || !formData.bankCode || 
          !formData.bankAgency || !formData.bankAccount || !formData.accountHolderName) {
        setError('Preencha todos os campos obrigatórios.');
        return;
      }

      // Validar CNPJ (básico)
      const cnpjClean = formData.companyCnpj.replace(/\D/g, '');
      if (cnpjClean.length !== 14) {
        setError('CNPJ inválido. Deve conter 14 dígitos.');
        return;
      }

      const response = await fetch('/api/hangarshare/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          companyName: formData.companyName,
          companyCnpj: cnpjClean,
          bankCode: formData.bankCode,
          bankAgency: formData.bankAgency,
          bankAccount: formData.bankAccount,
          accountHolderName: formData.accountHolderName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao criar perfil de anunciante.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/hangarshare/owner/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Login necessário</h2>
          <p className="text-slate-600 mb-6">Você precisa estar logado para configurar seu perfil de anunciante.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.push('/hangarshare')}
          className="text-blue-600 hover:text-blue-800 font-bold mb-8"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-black text-blue-900 mb-2">Configure seu Perfil</h1>
          <p className="text-slate-600 mb-8">
            Insira os dados da sua empresa para começar a anunciar hangares.
          </p>

          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-blue-900 mb-3">ℹ️ Informações do Usuário</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 font-semibold">Nome</p>
                <p className="text-slate-900">{user?.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold">Email</p>
                <p className="text-slate-900">{user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Razão Social da Empresa *
              </label>
              <input
                type="text"
                placeholder="Ex: Hangares Premium LTDA"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                CNPJ (14 dígitos) *
              </label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={formData.companyCnpj}
                onChange={(e) => {
                  // Auto-formata CNPJ
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 14) {
                    value = value.replace(/(\d{2})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1/$2');
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    setFormData({ ...formData, companyCnpj: value });
                  }
                }}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                required
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-bold text-amber-900 mb-4">💳 Informações Bancárias</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código do Banco *
                  </label>
                  <input
                    type="text"
                    placeholder="001"
                    maxLength={3}
                    value={formData.bankCode}
                    onChange={(e) => setFormData({ ...formData, bankCode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Agência *
                  </label>
                  <input
                    type="text"
                    placeholder="0001"
                    maxLength={5}
                    value={formData.bankAgency}
                    onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Conta *
                  </label>
                  <input
                    type="text"
                    placeholder="123456-7"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nome do Titular *
                </label>
                <input
                  type="text"
                  placeholder="Nome completo do titular"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">✓ Perfil criado com sucesso! Redirecionando...</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/hangarshare')}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : success ? 'Configurado!' : 'Confirmar'}
              </button>
            </div>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            Seus dados serão utilizados apenas para pagamento das reservas. Garantimos segurança e confidencialidade.
          </p>
        </div>
      </div>
    </div>
  );
}
