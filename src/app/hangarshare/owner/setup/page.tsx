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
    ownerType: 'company' as 'company' | 'individual',
    companyName: '',
    companyCnpj: '',
    cpf: '',
    bankCode: '',
    bankAgency: '',
    bankAccount: '',
    accountHolderName: '',
    pixKey: '',
    pixKeyType: '' as '' | 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
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

      // Validação baseada no tipo de proprietário
      if (formData.ownerType === 'company') {
        if (!formData.companyName || !formData.companyCnpj) {
          setError('Preencha o nome da empresa e CNPJ.');
          return;
        }
        const cnpjClean = formData.companyCnpj.replace(/\D/g, '');
        if (cnpjClean.length !== 14) {
          setError('CNPJ inválido. Deve conter 14 dígitos.');
          return;
        }
      } else {
        if (!formData.companyName || !formData.cpf) {
          setError('Preencha seu nome completo e CPF.');
          return;
        }
        const cpfClean = formData.cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11) {
          setError('CPF inválido. Deve conter 11 dígitos.');
          return;
        }
      }

      if (!formData.bankCode || !formData.bankAgency || !formData.bankAccount || !formData.accountHolderName) {
        setError('Preencha todos os campos bancários obrigatórios.');
        return;
      }

      const response = await fetch('/api/hangarshare/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ownerType: formData.ownerType,
          companyName: formData.companyName,
          companyCnpj: formData.ownerType === 'company' ? formData.companyCnpj.replace(/\D/g, '') : null,
          cpf: formData.ownerType === 'individual' ? formData.cpf.replace(/\D/g, '') : null,
          bankCode: formData.bankCode,
          bankAgency: formData.bankAgency,
          bankAccount: formData.bankAccount,
          accountHolderName: formData.accountHolderName,
          pixKey: formData.pixKey || null,
          pixKeyType: formData.pixKeyType || null,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
            {/* Owner Type Selection */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Tipo de Proprietário *
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.ownerType === 'company' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="ownerType"
                    value="company"
                    checked={formData.ownerType === 'company'}
                    onChange={() => setFormData({ ...formData, ownerType: 'company', cpf: '' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <span className="text-2xl">🏢</span>
                    <p className="font-bold text-slate-800 mt-1">Pessoa Jurídica</p>
                    <p className="text-xs text-slate-500">Empresa com CNPJ</p>
                  </div>
                </label>
                <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.ownerType === 'individual' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="ownerType"
                    value="individual"
                    checked={formData.ownerType === 'individual'}
                    onChange={() => setFormData({ ...formData, ownerType: 'individual', companyCnpj: '' })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <span className="text-2xl">👤</span>
                    <p className="font-bold text-slate-800 mt-1">Pessoa Física</p>
                    <p className="text-xs text-slate-500">Hangar particular com CPF</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {formData.ownerType === 'company' ? 'Razão Social da Empresa *' : 'Nome Completo *'}
              </label>
              <input
                type="text"
                placeholder={formData.ownerType === 'company' ? 'Ex: Hangares Premium LTDA' : 'Ex: João Silva Santos'}
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {formData.ownerType === 'company' ? (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  CNPJ (14 dígitos) *
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.companyCnpj}
                  onChange={(e) => {
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
            ) : (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  CPF (11 dígitos) *
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d)/, '$1-$2');
                      setFormData({ ...formData, cpf: value });
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  required
                />
              </div>
            )}

            {/* PIX Key Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-900 mb-4">📱 Chave PIX (opcional)</h3>
              <p className="text-sm text-green-700 mb-4">
                Informe sua chave PIX para receber pagamentos instantâneos das reservas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo de Chave
                  </label>
                  <select
                    value={formData.pixKeyType}
                    onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formData.pixKeyType === 'email' ? 'seu@email.com' :
                      formData.pixKeyType === 'phone' ? '+55 11 99999-9999' :
                      formData.pixKeyType === 'random' ? 'xxxxxxxx-xxxx-xxxx-xxxx' :
                      'Informe sua chave'
                    }
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
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
