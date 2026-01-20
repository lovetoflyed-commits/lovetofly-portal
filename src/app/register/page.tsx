

"use client";
"use client";
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Função de validação de CPF
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf[10])) return false;
  return true;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    birthDate: '',
    mobilePhone: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'Brasil',
    aviationRole: '',
    licencas: '',
    habilitacoes: '',
    curso_atual: '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Busca automática de endereço pelo CEP
  const handleCepBlur = async () => {
    const cep = form.addressZip.replace(/\D/g, '');
    if (cep.length !== 8) {
      setError('');
      return;
    }
    setCepLoading(true);
    setError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.erro) {
        setError('CEP não encontrado. Verifique e tente novamente.');
        setCepLoading(false);
        return;
      }
      
      if (data.logradouro) {
        setForm((prev) => ({
          ...prev,
          addressStreet: data.logradouro || '',
          addressNeighborhood: data.bairro || '',
          addressCity: data.localidade || '',
          addressState: data.uf || '',
        }));
        setError(''); // Clear any previous errors
      } else {
        setError('Endereço incompleto retornado. Preencha manualmente.');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Não foi possível buscar o endereço. Verifique sua conexão.');
    }
    setCepLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);


    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    if (!form.terms) {
      setError('Você deve aceitar os termos de uso.');
      setLoading(false);
      return;
    }
    if (!isValidCPF(form.cpf)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.error || 'Erro ao cadastrar.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Criar nova conta</h1>
        {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">{error}</div>}
        {success && <div className="bg-green-100 border border-green-300 text-green-700 text-sm px-3 py-2 rounded">{success}</div>}
        <form className="space-y-3" onSubmit={handleSubmit} autoComplete="off">
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-bold mb-1">Nome</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-bold mb-1">Sobrenome</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">E-mail</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-bold mb-1">Senha</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-bold mb-1">Confirmar senha</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">CPF</label>
            <input name="cpf" value={form.cpf} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Data de nascimento</label>
            <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Celular</label>
            <input name="mobilePhone" value={form.mobilePhone} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">CEP</label>
            <div className="flex gap-2 items-center">
              <input name="addressZip" value={form.addressZip} onChange={handleChange} onBlur={handleCepBlur} required className="w-full px-3 py-2 border rounded" />
              {cepLoading && <span className="text-xs text-blue-600">Buscando...</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Rua</label>
            <input name="addressStreet" value={form.addressStreet} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-xs font-bold mb-1">Número</label>
              <input name="addressNumber" value={form.addressNumber} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold mb-1">Complemento</label>
              <input name="addressComplement" value={form.addressComplement} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold mb-1">Bairro</label>
              <input name="addressNeighborhood" value={form.addressNeighborhood} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-bold mb-1">Cidade</label>
              <input name="addressCity" value={form.addressCity} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/4">
              <label className="block text-xs font-bold mb-1">UF</label>
              <input name="addressState" value={form.addressState} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="w-1/4">
              <label className="block text-xs font-bold mb-1">País</label>
              <input name="addressCountry" value={form.addressCountry} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Perfil na aviação</label>
            <select name="aviationRole" value={form.aviationRole} onChange={handleChange} required className="w-full px-3 py-2 border rounded">
              <option value="">Selecione seu perfil</option>
              <option value="student">Estudante</option>
              <option value="pilot">Piloto</option>
              <option value="owner">Proprietário</option>
              <option value="mechanic">Mecânico</option>
              <option value="other">Outro</option>
            </select>
          </div>
          
          {/* Qualificações ANAC/RBAC 61 */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-bold mb-3 text-gray-700">Qualificações de Aviação (Opcional)</h3>
            <div>
              <label className="block text-xs font-bold mb-1">Licenças</label>
              <input 
                name="licencas" 
                value={form.licencas} 
                onChange={handleChange} 
                placeholder="Ex: PP, PC, ATP" 
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Digite suas licenças ANAC (PP, PC, ATP, PLA, etc.)</p>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold mb-1">Habilitações</label>
              <input 
                name="habilitacoes" 
                value={form.habilitacoes} 
                onChange={handleChange} 
                placeholder="Ex: MLTE, IFR, B737" 
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Digite suas habilitações (MLTE, IFR, habilitações de tipo, etc.)</p>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold mb-1">Curso Atual</label>
              <input 
                name="curso_atual" 
                value={form.curso_atual} 
                onChange={handleChange} 
                placeholder="Ex: Habilitação de Tipo A320" 
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Curso de aviação que está realizando atualmente (opcional)</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input name="terms" type="checkbox" checked={form.terms} onChange={handleChange} /> Aceito os termos de uso
          </label>
          <button type="submit" disabled={loading} className="w-full py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Cadastrando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
