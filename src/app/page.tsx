'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import WorldClocks from '@/components/WorldClocks';
import NewsFeed from '@/components/NewsFeed';
import QuickAccess from '@/components/QuickAccess';
import { useAuth } from '@/context/AuthContext';

// --- COMPONENTE: RELÓGIO UTC ---
function UTCClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = now.toISOString().split('T')[1].split('.')[0];
      setTime(timeString);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col items-center justify-center h-full">
      <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-1">HORÁRIO ZULU (UTC)</h3>
      <div className="text-4xl font-mono font-bold text-yellow-400">
        {time || '--:--:--'} <span className="text-lg text-slate-500">Z</span>
      </div>
    </div>
  );
}

// --- COMPONENTE: STATUS DO AERÓDROMO (VERSÃO RESTAURADA) ---
function AirportStatusWidget() {
  const [icao, setIcao] = useState('SBGR');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetar = async () => {
    if (icao.length !== 4) return;
    setLoading(true);
    try {
      // Busca via Proxy para evitar erro de CORS (Versão NOAA)
      const response = await fetch(`https://corsproxy.io/?https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`);
      const json = await response.json();

      if (json && json.length > 0) {
        const metar = json[0];
        // Lógica simples para determinar status visualmente
        let status = 'VFR';
        let color = 'text-green-500';

        // Se visibilidade < 5000m ou Teto < 1500ft (simplificado)
        const isCavok = metar.rawOb.includes('CAVOK');
        const lowVis = metar.visib && parseFloat(metar.visib) < 5; // < 5 milhas

        if (!isCavok && lowVis) {
          status = 'IFR';
          color = 'text-red-500';
        }

        setData({ ...metar, status, color });
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Erro ao buscar METAR:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-slate-200 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-blue-900 font-bold text-xs">STATUS DO AERÓDROMO</h3>
        <div className="flex gap-1">
          <input 
            value={icao} 
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            maxLength={4}
            className="w-12 text-xs border border-slate-300 rounded px-1 text-center font-mono uppercase"
          />
          <button onClick={fetchMetar} className="bg-blue-600 text-white text-[10px] px-2 rounded hover:bg-blue-700">OK</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {loading ? (
          <span className="text-xs text-slate-400 animate-pulse">Buscando...</span>
        ) : data ? (
          <>
            <div className={`text-3xl font-black ${data.color} mb-1`}>{data.status}</div>
            <div className="text-[9px] text-slate-500 font-mono leading-tight overflow-hidden h-10 w-full text-left bg-slate-50 p-1 rounded border border-slate-100">
              {data.rawOb}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-400">Digite o ICAO (ex: SBGR)</span>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE: NOTÍCIAS (MOCK) ---
function AviationNewsWidget() {
  const news = [
    { id: 1, category: 'REGULAÇÃO', date: 'Hoje, 10:00', title: 'ANAC publica nova emenda sobre RBAC 61 para pilotos privados.' },
    { id: 2, category: 'INDÚSTRIA', date: 'Ontem, 18:30', title: 'Embraer anuncia venda de 20 aeronaves E2 para companhia asiática.' },
    { id: 3, category: 'SEGURANÇA', date: '24 Dez, 14:00', title: 'Relatório preliminar sobre incidente em Congonhas é divulgado.' },
    { id: 4, category: 'TECNOLOGIA', date: '23 Dez, 09:15', title: 'Novo sistema de navegação por satélite promete maior precisão em aproximações.' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-blue-900 font-bold text-sm">ÚLTIMAS NOTÍCIAS</h3>
        <button className="text-blue-500 text-xs hover:underline">Atualizar</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {news.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-bold text-blue-600 uppercase">{item.category}</span>
              <span className="text-[9px] text-slate-400">{item.date}</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{item.title}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- COMPONENTE: FORMULÁRIO DE LOGIN ---
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);

    if (success) {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm text-center font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>

        <button
          type="button"
          onClick={() => setShowLoginModal(false)}
          className="w-full py-2 mt-4 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
        >
          VOLTAR
        </button>
      </form>
    </>
  );
}

// --- COMPONENTE: FORMULÁRIO DE REGISTRO ---
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas
    if (!isValidCPF(formData.cpf)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    if (!formData.terms) {
      setError('Você deve aceitar os termos de uso.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cadastro realizado com sucesso! Faça login.');
        onSuccess();
      } else {
        setError(data.error || 'Erro no cadastro.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }

    setLoading(false);
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm text-center font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sobrenome</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
          <input
            type="date"
            name="birthDate"
            required
            value={formData.birthDate}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">CPF</label>
          <input
            type="text"
            name="cpf"
            required
            value={formData.cpf}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
          <input
            type="text"
            name="mobilePhone"
            required
            value={formData.mobilePhone}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Função na Aviação</label>
          <select
            name="aviationRole"
            required
            value={formData.aviationRole}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">Selecione</option>
            <option value="student">Estudante</option>
            <option value="pilot">Piloto</option>
            <option value="instructor">Instrutor</option>
            <option value="mechanic">Mecânico</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-xs text-slate-700">Aceito os termos de uso</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
        </button>

        <button
          type="button"
          onClick={() => setShowRegisterModal(false)}
          className="w-full py-2 mt-4 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
        >
          VOLTAR
        </button>
      </form>
    </>
  );
}

// --- FUNÇÕES AUXILIARES PARA REGISTRO ---
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

// --- PÁGINA PRINCIPAL ---
export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden font-sans">

      {/* CABEÇALHO */}
      <header className="bg-blue-900 text-white shadow-md shrink-0 z-50 relative h-24">
        <div className="max-w-[1920px] mx-auto px-6 h-full flex justify-between items-center relative">
          <div className="flex-shrink-0 z-20">
            <img src="/logo-pac.png" alt="Logo" className="h-[3.5cm] w-auto object-contain drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider drop-shadow-md text-center">PORTAL LOVE TO FLY</h1>
            <p className="text-[10px] md:text-xs font-light tracking-[0.3em] text-blue-200 mt-0.5 text-center">O SEU PORTAL DA AVIAÇÃO CIVIL</p>
          </div>
          <div className="flex gap-3 text-xs font-bold items-center z-20">
            <button onClick={() => setShowLoginModal(true)} className="hover:text-blue-200 px-3 py-2">ENTRAR</button>
            <button onClick={() => setShowRegisterModal(true)} className="bg-yellow-400 text-blue-900 px-5 py-2 rounded hover:bg-yellow-300 shadow-lg transition-transform hover:scale-105">CADASTRAR</button>
          </div>
        </div>
      </header>

      {/* DASHBOARD */}
      <main className="flex-1 p-4 max-w-[1920px] mx-auto w-full h-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">

          {/* COLUNA 1: FERRAMENTAS */}
          <div className="md:col-span-3 flex flex-col gap-4 h-full">
            <div className="h-1/5"><UTCClock /></div>
            <div className="h-1/5"><AirportStatusWidget /></div>
            <div className="h-1/5"><WeatherWidget /></div>
            <div className="h-1/5"><WorldClocks /></div>
            <div className="h-1/5 bg-white p-4 rounded-xl shadow border border-slate-200 flex flex-col">
              <h3 className="text-blue-900 font-bold text-xs mb-3 text-center">LINKS RÁPIDOS</h3>
              <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto">
                <a href="https://aisweb.decea.mil.br/" target="_blank" className="flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-blue-800 rounded border border-slate-200 text-[10px] font-bold transition-all">AISWEB</a>
                <a href="https://www.redemet.aer.mil.br/" target="_blank" className="flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-blue-800 rounded border border-slate-200 text-[10px] font-bold transition-all">REDEMET</a>
                <a href="https://www.flightradar24.com/" target="_blank" className="flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-blue-800 rounded border border-slate-200 text-[10px] font-bold transition-all">FLIGHTRADAR</a>
                <a href="https://www.windy.com/" target="_blank" className="flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-blue-800 rounded border border-slate-200 text-[10px] font-bold transition-all">WINDY</a>
              </div>
            </div>
          </div>

          {/* COLUNA 2: CONTEÚDO CENTRAL */}
          <div className="md:col-span-6 flex flex-col gap-4 h-full">
            <div className="h-3/5">
              <AviationNewsWidget />
            </div>
            <div className="h-1/5">
              <QuickAccess />
            </div>
            {/* ESPAÇO GOOGLE ADS COM SCRIPT INSERIDO */}
            <div className="h-1/5 bg-white rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Publicidade Google</span>
            </div>
          </div>

          {/* COLUNA 3: PUBLICIDADE EMPRESAS */}
          <div className="md:col-span-3 flex flex-col gap-4 h-full">
            <div className="h-1/3">
              <NewsFeed />
            </div>
            <div className="h-1/3 bg-gradient-to-br from-slate-100 to-white rounded-xl shadow border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <span className="absolute top-2 right-2 text-[8px] text-slate-300 border border-slate-200 px-1 rounded">PUBLICIDADE</span>
              <h4 className="text-blue-900 font-bold text-sm mb-2">Sua Empresa Aqui</h4>
              <p className="text-xs text-slate-500">Anuncie para milhares de pilotos.</p>
              <button className="mt-3 text-[10px] bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Saiba mais</button>
            </div>
            <div className="h-1/3 bg-gradient-to-br from-slate-100 to-white rounded-xl shadow border border-slate-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <span className="absolute top-2 right-2 text-[8px] text-slate-300 border border-slate-200 px-1 rounded">PUBLICIDADE</span>
              <h4 className="text-blue-900 font-bold text-sm mb-2">Parceiro Oficial</h4>
              <p className="text-xs text-slate-500">Espaço reservado para patrocinadores.</p>
              <button className="mt-3 text-[10px] bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Contato</button>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 w-full max-w-md relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl"
            >
              ×
            </button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-900">Bem-vindo de volta!</h2>
              <p className="text-slate-500 mt-2">Acesse sua conta para continuar.</p>
            </div>
            <LoginForm onSuccess={() => setShowLoginModal(false)} />
            <div className="mt-6 text-center text-sm text-slate-600">
              Não tem uma conta?{' '}
              <button
                onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                className="text-blue-600 font-bold hover:underline"
              >
                Cadastre-se
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTER */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl z-10"
            >
              ×
            </button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-900">Criar Conta</h2>
              <p className="text-slate-500 mt-2">Junte-se à comunidade de aviação.</p>
            </div>
            <RegisterForm onSuccess={() => setShowRegisterModal(false)} />
            <div className="mt-6 text-center text-sm text-slate-600">
              Já tem uma conta?{' '}
              <button
                onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                className="text-blue-600 font-bold hover:underline"
              >
                Faça login
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
