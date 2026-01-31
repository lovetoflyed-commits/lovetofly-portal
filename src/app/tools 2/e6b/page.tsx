'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- FUNÇÕES AUXILIARES ---
const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfDigits = cpf.split('').map(el => +el);
  const rest = (count: number) => (cpfDigits.slice(0, count-12).reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
  return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
};

const maskCPF = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
};

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tools/e6b');
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', birthDate: '', cpf: '', email: '', password: '', mobilePhone: '',
    addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '', addressCountry: 'Brasil',
    aviationRole: '', aviationRoleOther: '', socialMedia: '', newsletter: false, terms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (name === 'cpf') finalValue = maskCPF(value);
    if (name === 'addressZip') finalValue = maskCEP(value);
    if (name === 'mobilePhone') finalValue = maskPhone(value);

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de recarregar
    console.log('1. Botão clicado. Iniciando validação...');
    setError('');

    // Validação CPF
    if (!isValidCPF(formData.cpf)) {
      console.log('ERRO: CPF Inválido detectado');
      setError('CPF inválido. Por favor verifique os números.');
      window.scrollTo(0, 0);
      return;
    }

    // Validação Termos
    if (!formData.terms) {
      console.log('ERRO: Termos não aceitos');
      setError('Você precisa aceitar os termos e políticas para continuar.');
      window.scrollTo(0, 0);
      return;
    }

    console.log('2. Validações OK. Preparando envio para API...');
    setLoading(true);

    try {
      console.log('3. Enviando fetch para /api/register com dados:', formData);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('4. Resposta recebida. Status:', response.status);
      const data = await response.json();
      console.log('5. Dados da resposta:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      console.log('6. SUCESSO! Redirecionando...');
      alert('Cadastro realizado com sucesso! Você será redirecionado para o Login.');
      router.push('/login');

    } catch (err: any) {
      console.error('ERRO NO CATCH:', err);
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center items-start">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-2">Crie sua Conta</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* --- DADOS PESSOAIS --- */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-blue-900 font-bold mb-4 border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome *</label>
                <input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sobrenome *</label>
                <input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento *</label>
                <input name="birthDate" type="date" required value={formData.birthDate} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CPF *</label>
                <input name="cpf" type="text" required maxLength={14} value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Celular *</label>
                <input name="mobilePhone" type="tel" required maxLength={15} value={formData.mobilePhone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso *</label>
                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* --- ENDEREÇO --- */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-blue-900 font-bold mb-4 border-b pb-2">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">CEP *</label>
                <input name="addressZip" type="text" required maxLength={9} value={formData.addressZip} onChange={handleChange} placeholder="00000-000" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço (Rua/Av) *</label>
                <input name="addressStreet" type="text" required value={formData.addressStreet} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número *</label>
                <input name="addressNumber" type="text" required value={formData.addressNumber} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
                <input name="addressComplement" type="text" value={formData.addressComplement} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bairro *</label>
                <input name="addressNeighborhood" type="text" required value={formData.addressNeighborhood} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade *</label>
                <input name="addressCity" type="text" required value={formData.addressCity} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado *</label>
                <select name="addressState" required value={formData.addressState} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">País *</label>
                <input name="addressCountry" type="text" required value={formData.addressCountry} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* --- PERFIL PROFISSIONAL --- */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h3 className="text-blue-900 font-bold mb-4 border-b pb-2">Perfil Profissional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Função na Aviação *</label>
                <select name="aviationRole" required value={formData.aviationRole} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  <option value="Piloto">Piloto</option>
                  <option value="Tripulante">Tripulante</option>
                  <option value="Mecanico">Mecânico de Aeronaves</option>
                  <option value="Aeroviario">Aeroviário</option>
                  <option value="Prestador">Prestador de Serviços</option>
                  <option value="Entusiasta">Entusiasta</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {formData.aviationRole === 'Outro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qual sua função? *</label>
                  <input name="aviationRoleOther" type="text" required value={formData.aviationRoleOther} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Rede Social (Instagram/LinkedIn) *</label>
                <input name="socialMedia" type="text" required value={formData.socialMedia} onChange={handleChange} placeholder="@seu.perfil" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* --- TERMOS --- */}
          <div className="space-y-3 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input name="newsletter" type="checkbox" checked={formData.newsletter} onChange={handleChange} className="mt-1 w-4 h-4 text-blue-900 rounded focus:ring-blue-500" />
              <span className="text-sm text-slate-700">Desejo receber notificações de atualizações, notícias, novidades e ofertas de promoções por e-mail.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input name="terms" type="checkbox" required checked={formData.terms} onChange={handleChange} className="mt-1 w-4 h-4 text-blue-900 rounded focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-bold">Estou ciente e concordo com todas as regras e política do Portal Love to Fly. *</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-900 text-white font-bold text-lg rounded-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 mt-6">
            {loading ? 'PROCESSANDO CADASTRO...' : 'FINALIZAR CADASTRO'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Já tem cadastro? <Link href="/login" className="text-blue-600 font-bold hover:underline">Fazer Login</Link>
        </div>
      </div>
    </div>
  );
}
