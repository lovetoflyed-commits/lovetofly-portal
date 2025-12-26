'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Helpers for masked fields
const isValidCPF = (cpf: string) => {
  const cleaned = cpf.replace(/[^\d]+/g, '');
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false;
  const digits = cleaned.split('').map(Number);
  const rest = (count: number) => (
    (digits.slice(0, count - 12).reduce((sum, el, idx) => sum + el * (count - idx), 0) * 10) % 11
  ) % 10;
  return rest(10) === digits[9] && rest(11) === digits[10];
};

const maskCPF = (value: string) => value
  .replace(/\D/g, '')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d{1,2})/, '$1-$2')
  .replace(/(-\d{2})\d+?$/, '$1');

const maskCEP = (value: string) => value
  .replace(/\D/g, '')
  .replace(/(\d{5})(\d)/, '$1-$2')
  .replace(/(-\d{3})\d+?$/, '$1');

const maskPhone = (value: string) => value
  .replace(/\D/g, '')
  .replace(/(\d{2})(\d)/, '($1) $2')
  .replace(/(\d{5})(\d)/, '$1-$2')
  .replace(/(-\d{4})\d+?$/, '$1');

// Login form
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      onSuccess();
      // Force page reload to show dashboard
      window.location.reload();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-900 text-white font-bold shadow-md hover:bg-blue-800 disabled:opacity-60"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

// Register form (keeps required backend fields but simplified layout)
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', birthDate: '', cpf: '', email: '', password: '', confirmPassword: '',
    mobilePhone: '', addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '',
    addressCity: '', addressState: '', addressZip: '', addressCountry: 'Brasil', aviationRole: '',
    aviationRoleOther: '', socialMedia: '', newsletter: false, terms: false,
  });
  const [zipStatus, setZipStatus] = useState('');
  const [zipLoading, setZipLoading] = useState(false);

  const fetchAddressByCEP = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    setZipLoading(true);
    setZipStatus('Buscando CEP...');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      if (!response.ok) throw new Error('CEP lookup failed');

      const data = await response.json();
      if (data.erro) {
        setZipStatus('CEP não encontrado.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        addressZip: maskCEP(cleaned),
        addressStreet: data.logradouro || prev.addressStreet,
        addressNeighborhood: data.bairro || prev.addressNeighborhood,
        addressCity: data.localidade || prev.addressCity,
        addressState: data.uf || prev.addressState,
      }));

      setZipStatus('Endereço preenchido automaticamente.');
    } catch (err) {
      setZipStatus('Não foi possível buscar o CEP.');
    } finally {
      setZipLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (name === 'cpf') finalValue = maskCPF(value);
    if (name === 'addressZip') finalValue = maskCEP(value);
    if (name === 'mobilePhone') finalValue = maskPhone(value);

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (name === 'addressZip') {
      const cleanedZip = finalValue.replace(/\D/g, '');
      if (cleanedZip.length === 8) {
        fetchAddressByCEP(cleanedZip);
      } else {
        setZipStatus('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.terms) {
      setError('Você deve aceitar os termos de uso.');
      setLoading(false);
      return;
    }

    const cleanedCPF = formData.cpf.replace(/\D/g, '');
    if (!isValidCPF(cleanedCPF)) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const cleanedFormData = {
        ...formData,
        cpf: cleanedCPF,
        mobilePhone: formData.mobilePhone.replace(/\D/g, ''),
        addressZip: formData.addressZip.replace(/\D/g, ''),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedFormData),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
          <input name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome</label>
          <input name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento</label>
          <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">CPF</label>
          <input name="cpf" required value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
          <input name="mobilePhone" required value={formData.mobilePhone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
          <div className="relative">
            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Função na Aviação</label>
          <select name="aviationRole" required value={formData.aviationRole} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Selecione</option>
            <option value="student">Estudante</option>
            <option value="pilot">Piloto</option>
            <option value="instructor">Instrutor</option>
            <option value="mechanic">Mecânico</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">CEP</label>
          <input name="addressZip" required value={formData.addressZip} onChange={handleChange} placeholder="00000-000" className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          {zipStatus && (
            <p className="text-xs text-slate-500 mt-1">{zipLoading ? 'Buscando CEP...' : zipStatus}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
          <input name="addressStreet" required value={formData.addressStreet} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
          <input name="addressNumber" required value={formData.addressNumber} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
          <input name="addressNeighborhood" required value={formData.addressNeighborhood} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
          <input name="addressCity" required value={formData.addressCity} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
          <input name="addressState" required value={formData.addressState} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">País</label>
          <input name="addressCountry" required value={formData.addressCountry} onChange={handleChange} className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="w-4 h-4" />
        <span className="text-xs text-slate-700">Aceito os termos de uso</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-900 text-white font-bold shadow-md hover:bg-blue-800 disabled:opacity-60"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
}

// Modal shell
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative p-6 border border-slate-200">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xl">×</button>
        <h2 className="text-2xl font-bold text-blue-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Debug: log user state
  useEffect(() => {
    console.log('User state:', user);
  }, [user]);

  // Define feature modules with access requirements
  const modules = {
    navigation: {
      name: 'Navegação',
      icon: '🧭',
      minPlan: 'free',
      features: [
        { name: 'E6B Flight Computer', desc: 'Calculadora de navegação aérea', href: '/tools/e6b', minPlan: 'free' },
        { name: 'Glass Cockpit Simulator', desc: 'Simulador de cabine com aviônicos moderno', href: '/tools/glass-cockpit', minPlan: 'free' },
        { name: 'Planejamento de Voo', desc: 'Planejar rotas e calcular combustível', href: '/flight-plan', minPlan: 'premium' },
      ]
    },
    weather: {
      name: 'Meteorologia',
      icon: '☁️',
      minPlan: 'free',
      features: [
        { name: 'METAR/TAF', desc: 'Consulta de condições meteorológicas', href: '/weather', minPlan: 'free' },
        { name: 'Radar', desc: 'Radar meteorológico em tempo real', href: '/weather/radar', minPlan: 'premium' },
      ]
    },
    training: {
      name: 'Treinamento',
      icon: '🎓',
      minPlan: 'free',
      features: [
        { name: 'Logbook', desc: 'Registro de horas de voo', href: '/logbook', minPlan: 'free' },
        { name: 'Cursos', desc: 'Treinamento e certificação online', href: '/courses', minPlan: 'free' },
        { name: 'Simulador', desc: 'Treinamento em simulador', href: '/simulator', minPlan: 'pro' },
      ]
    },
    community: {
      name: 'Comunidade',
      icon: '💬',
      minPlan: 'free',
      features: [
        { name: 'Fórum', desc: 'Discussões com pilotos e instrutores', href: '/forum', minPlan: 'free' },
        { name: 'Marketplace', desc: 'Compra e venda de equipamentos', href: '/marketplace', minPlan: 'free' },
      ]
    },
    career: {
      name: 'Carreira',
      icon: '✈️',
      minPlan: 'premium',
      features: [
        { name: 'Vagas', desc: 'Oportunidades de emprego na aviação', href: '/career', minPlan: 'premium' },
        { name: 'Mentoria', desc: 'Conecte-se com mentores', href: '/mentorship', minPlan: 'pro' },
      ]
    },
  };

  const userPlan = user?.plan || 'free';
  const planPriority: Record<string, number> = { free: 0, premium: 1, pro: 2 };

  const hasAccess = (minPlan: string) => planPriority[userPlan] >= planPriority[minPlan];

  // If user is logged in, show modular dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-blue-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-pac.png" alt="Love to Fly" className="h-10 w-auto" />
              <span className="font-black tracking-wide text-lg">PORTAL LOVE TO FLY</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold uppercase">{userPlan}</span>
              <span className="text-sm">Olá, {user.name}</span>
              <button onClick={logout} className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50">Sair</button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Welcome Section */}
          <section className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <h1 className="text-3xl md:text-4xl font-black text-blue-900 mb-2">Bem vindo ao seu cockpit</h1>
            <p className="text-sm text-slate-600">Acesse suas ferramentas e acompanhe informações em tempo real.</p>
          </section>

          {/* Widgets Row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Widget 1: UTC Clock */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🕐</span>
                <h3 className="text-lg font-bold text-blue-900">Relógio UTC</h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-blue-900 mb-1">
                  {new Date().toUTCString().split(' ')[4]}
                </div>
                <div className="text-sm text-slate-500">
                  {new Date().toUTCString().split(',')[0]}
                </div>
              </div>
            </div>

            {/* Widget 2: Airport Weather */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">☁️</span>
                <h3 className="text-lg font-bold text-blue-900">Clima Aeroporto</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">SBGR</span>
                  <span className="font-bold text-green-600">VFR</span>
                </div>
                <div className="text-xs text-slate-500">
                  Temperatura: 28°C<br/>
                  Vento: 090/12kt<br/>
                  Visibilidade: 10km
                </div>
              </div>
            </div>

            {/* Widget 3: Latest News */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📰</span>
                <h3 className="text-lg font-bold text-blue-900">Últimas Notícias</h3>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-600 border-b border-slate-100 pb-2">
                  <p className="font-semibold">Nova rota SBSP-SBBR</p>
                  <p className="text-slate-400">Há 2 horas</p>
                </div>
                <div className="text-xs text-slate-600">
                  <p className="font-semibold">Atualização NOTAM</p>
                  <p className="text-slate-400">Há 5 horas</p>
                </div>
              </div>
            </div>
          </section>

          {/* Tools/Modules Section */}
          {Object.entries(modules).map(([key, module]) => {
            const moduleHasAccess = hasAccess(module.minPlan);
            const accessibleFeatures = module.features.filter(f => hasAccess(f.minPlan));
            const lockedFeatures = module.features.filter(f => !hasAccess(f.minPlan));

            if (!moduleHasAccess && accessibleFeatures.length === 0) return null;

            return (
              <section key={key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{module.icon}</span>
                  <h2 className="text-2xl font-bold text-blue-900">{module.name}</h2>
                  {!moduleHasAccess && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Requer {module.minPlan}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleFeatures.map((feature, idx) => (
                    <a
                      key={idx}
                      href={feature.href}
                      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition"
                    >
                      <h3 className="text-blue-900 font-bold mb-2">{feature.name}</h3>
                      <p className="text-sm text-slate-600">{feature.desc}</p>
                    </a>
                  ))}

                  {lockedFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-100 rounded-xl border border-slate-300 p-6 shadow-sm opacity-60 cursor-not-allowed relative"
                    >
                      <div className="absolute top-3 right-3 text-xs bg-slate-700 text-white px-2 py-1 rounded">
                        {feature.minPlan}
                      </div>
                      <h3 className="text-slate-700 font-bold mb-2">{feature.name}</h3>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {userPlan === 'free' && (
            <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-2">Desbloqueie todos os recursos</h2>
              <p className="mb-4 text-blue-100">Assine Premium ou Pro para acessar funcionalidades avançadas.</p>
              <button className="px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg shadow hover:bg-yellow-300">
                Ver Planos
              </button>
            </section>
          )}
        </main>
      </div>
    );
  }

  // Landing page for non-logged users
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-wide text-lg">PORTAL LOVE TO FLY</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLoginOpen(true)} className="px-4 py-2 rounded-lg bg-white text-blue-900 font-bold shadow-sm hover:bg-blue-50">Entrar</button>
            <button onClick={() => setRegisterOpen(true)} className="px-4 py-2 rounded-lg bg-yellow-400 text-blue-900 font-bold shadow-sm hover:bg-yellow-300">Cadastrar</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-2xl shadow p-6 border border-slate-100">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-700 font-semibold">O SEU PORTAL DA AVIAÇÃO CIVIL</p>
            <h1 className="text-3xl md:text-4xl font-black text-blue-900">Tudo em um só lugar</h1>
            <p className="text-sm text-slate-600 max-w-2xl">Acompanhe tempo, navegação, notícias e ferramentas essenciais. Entre ou cadastre-se para usar a E6B e recursos avançados.</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <button onClick={() => setLoginOpen(true)} className="px-5 py-2 rounded-lg bg-blue-900 text-white font-bold shadow hover:bg-blue-800">Fazer login</button>
              <button onClick={() => setRegisterOpen(true)} className="px-5 py-2 rounded-lg bg-white text-blue-900 font-bold border border-blue-200 hover:bg-blue-50">Criar conta</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-blue-900 font-bold mb-2">E6B Flight Computer</h3>
            <p className="text-sm text-slate-600 mb-3">Calculadora de navegação aérea profissional.</p>
            <button onClick={() => setLoginOpen(true)} className="px-4 py-2 rounded-lg bg-blue-900 text-white font-bold shadow hover:bg-blue-800">Faça login para usar</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-blue-900 font-bold mb-2">Clima &amp; METAR</h3>
            <p className="text-sm text-slate-600 mb-3">Consulte condições rapidamente e planeje seus voos.</p>
            <div className="text-xs text-slate-500">Acesse ferramentas de clima no painel após login.</div>
          </div>
        </section>
      </main>

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Entrar">
        <LoginForm onSuccess={() => setLoginOpen(false)} />
      </Modal>

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Criar conta">
        <RegisterForm onSuccess={() => { setRegisterOpen(false); setLoginOpen(true); }} />
      </Modal>
    </div>
  );
}