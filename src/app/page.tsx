"use client";
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

import { useState, useEffect } from 'react';
import { maskCEP, maskCPF, maskPhone, isValidCPF } from '@/utils/masks';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import HangarCarousel from '@/components/HangarCarousel';



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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Debug: log user state
  useEffect(() => {
    console.log('User state:', user);
  }, [user]);

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Menu structure in alphabetical order
  const menuItems = [
    {
      name: 'Aeroclubes e CIAC\'s',
      children: []
    },
    {
      name: 'Aeronaves',
      children: [
        { name: 'Aluguel' },
        { name: 'Arrendamento' },
        { name: 'Compartilhamento' },
        { name: 'Compra/Venda' }
      ]
    },
    {
      name: 'ANAC',
      children: []
    },
    {
      name: 'Anúncios',
      children: []
    },
    {
      name: 'Aviação Geral',
      children: []
    },
    {
      name: 'Awards',
      children: []
    },
    {
      name: 'Carreira',
      children: [
        { name: 'Busca' },
        {
          name: 'Ofertas de Trabalho',
          children: ['Seleções Abertas', 'Vagas disponíveis']
        },
        {
          name: 'Profissionais',
          children: ['Agrícola', 'Executiva', 'Freelancers', 'Instrutores/Checadores', 'Linha Aérea', 'Particular', 'SAE', 'Traslados']
        }
      ]
    },
    {
      name: 'CENIPA',
      children: []
    },
    {
      name: 'Comercial',
      children: []
    },
    {
      name: 'Comunidade',
      children: [
        { name: 'Fóruns' },
        { name: 'Mídias Sociais' }
      ]
    },
    {
      name: 'Empresas',
      children: []
    },
    {
      name: 'Eventos',
      children: []
    },
    {
      name: 'Ferramentas Online',
      children: []
    },
    {
      name: 'Hangares',
      children: []
    },
    {
      name: 'História da Aviação',
      children: []
    },
    {
      name: 'Indústria',
      children: []
    },
    {
      name: 'Internacional',
      children: []
    },
    {
      name: 'Manutenção',
      children: []
    },
    {
      name: 'Meteorologia',
      children: []
    },
    {
      name: 'Museu Virtual',
      children: []
    },
    {
      name: 'Navegação Aérea',
      children: []
    },
    {
      name: 'Pilot Shop',
      children: []
    },
    {
      name: 'PORTAL',
      children: []
    },
    {
      name: 'Privado',
      children: []
    },
    {
      name: 'SIPAER',
      children: []
    },
    {
      name: 'Treinamento',
      children: [
        { name: 'Capacitação' },
        { name: 'Cursos' },
        { name: 'Graduação' },
        { name: 'Mentoria' },
        { name: 'Outros' },
        { name: 'Simuladores' },
        { name: 'Workshops' }
      ]
    },
    {
      name: 'AJUDA',
      children: []
    }
  ];

  // Define feature modules with access requirements
  const modules = {
    navigation: {
      name: 'Navegação',
      icon: '🧭',
      minPlan: 'free',
      features: [
        { name: 'E6B Flight Computer', desc: 'Calculadora de navegação aérea', href: '/tools/e6b', minPlan: 'free' },
        { name: 'Glass Cockpit Simulator', desc: 'Simulador de cabine com aviônicos moderno', href: '/tools/glass-cockpit', minPlan: 'free' },
        { name: 'Simulador IFR', desc: 'Procedimentos IFR e precisão', href: '/tools/ifr-simulator', minPlan: 'free' },
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
        { name: 'Pilot Shop', desc: 'Compra e venda de equipamentos', href: '/marketplace', minPlan: 'free' },
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
    hangarshare: {
      name: 'HangarShare',
      icon: '🏢',
      minPlan: 'free',
      features: [
        { name: 'Buscar Hangares', desc: 'Reserve hangares em aeródromos', href: '/hangarshare', minPlan: 'free' },
        { name: 'Anunciar Hangar', desc: 'Monetize seu espaço', href: '/hangarshare/owner/register', minPlan: 'free' },
        { name: 'Minhas Reservas', desc: 'Gerencie suas reservas', href: '/hangarshare/bookings', minPlan: 'free' },
      ]
    },
  };

  const userPlan = user?.plan || 'free';
  const planPriority: Record<string, number> = { free: 0, premium: 1, pro: 2 };

  const hasAccess = (minPlan: string) => planPriority[userPlan] >= planPriority[minPlan];

  // Weather widget state
  const [icaoCode, setIcaoCode] = useState('SBCF');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // News widget state
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // Classifieds carousel state - Enhanced with more details like controller.com
  const classifieds = [
    {
      title: '2015 CESSNA 172S SKYHAWK',
      category: 'Monomotor Pistão',
      price: 'USD $285,000',
      priceNote: 'Payments as low as USD $2,640.00*',
      year: '2015',
      hours: '2,150 Total Time',
      location: 'São Paulo, Brasil',
      seller: 'LANE AVIATION',
      phone: '+55 (11) 98765-4321',
      featured: true,
      image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: '2020 EXTRA 330LX',
      category: 'Aerodesportiva',
      price: 'USD $495,000',
      priceNote: 'Payments as low as USD $4,580.00*',
      year: '2020',
      hours: '450 Total Time',
      location: 'Rio de Janeiro, Brasil',
      seller: 'AirplanesUSA',
      phone: '+55 (21) 97654-3210',
      featured: true,
      image: '/extra330.png'
    },
    {
      title: '2018 BEECHCRAFT KING AIR 350i',
      category: 'Bimotor Turboélice',
      price: 'USD $6,500,000',
      priceNote: 'Payments as low as USD $60,200.00*',
      year: '2018',
      hours: '1,890 Total Time',
      location: 'Belo Horizonte, Brasil',
      seller: 'G2G Aviation',
      phone: '+55 (31) 99876-5432',
      featured: true,
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: '2012 CESSNA CITATION M2',
      category: 'Jato de Pequeno Porte',
      price: 'USD $3,250,000',
      priceNote: 'Payments as low as USD $30,100.00*',
      year: '2012',
      hours: '2,400 Total Time',
      location: 'Dallas, Texas, EUA',
      seller: 'Ava Aviation',
      phone: '+1 (214) 73305-4567',
      featured: true,
      image: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const [listingIndex, setListingIndex] = useState(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('painel');
  // ICAO for Procedures & NOTAMs quick widget
  const [proceduresIcao, setProceduresIcao] = useState('');

  // Fetch default airport weather and news on mount
  useEffect(() => {
    if (user) {
      fetchWeather('SBCF');
      fetchNews();
    }
  }, [user]);

  // Auto-rotate classifieds
  useEffect(() => {
    const id = setInterval(() => {
      setListingIndex((prev) => (prev + 1) % classifieds.length);
    }, 5500);
    return () => clearInterval(id);
  }, [classifieds.length]);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const response = await fetch('/api/news/aviation');
      if (response.ok) {
        const data = await response.json();
        setNewsArticles(data.articles || []);
      }
    } catch {
      // Erro ao buscar notícias
    } finally {
      setLoadingNews(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const published = new Date(dateString);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'Agora';
  };

  const fetchWeather = async (icao: string) => {
    if (icao.length !== 4) return;
    
    setLoadingWeather(true);
    setWeatherError('');
    setWeatherData(null);
    
    try {
      const response = await fetch(`/api/weather/metar?icao=${icao}`);
      
      if (!response.ok) {
        let errorMessage = 'Aeroporto não encontrado';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // Se não conseguir parsear o JSON, usa a mensagem padrão
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setWeatherData(data);
      setWeatherError('');
    } catch (error: any) {
      setWeatherError(error.message || 'Erro ao buscar dados. Verifique o código ICAO.');
      setWeatherData(null);
      // Erro ao buscar clima
    } finally {
      setLoadingWeather(false);
    }
  };

  const getFlightCategory = (category?: string) => {
    switch(category) {
      case 'VFR': return { label: 'VFR', color: 'text-green-600', bg: 'bg-green-50' };
      case 'MVFR': return { label: 'MVFR', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'IFR': return { label: 'IFR', color: 'text-red-600', bg: 'bg-red-50' };
      case 'LIFR': return { label: 'LIFR', color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { label: 'N/A', color: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  // If user is logged in, show modular dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <Sidebar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Welcome Section */}
          <section className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-blue-900 mb-2">Bem vindo ao seu cockpit</h1>
                <p className="text-sm text-slate-600">Acesse suas ferramentas e acompanhe informações em tempo real.</p>
              </div>
              {/* Procedimentos & NOTAMs (AISWEB) - substitui os botões de acesso rápido */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                  <span className="text-xl">📑</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ICAO (ex: SBSP)"
                      maxLength={4}
                      value={proceduresIcao}
                      onChange={(e) => setProceduresIcao(e.target.value.toUpperCase())}
                      className="w-24 rounded border border-slate-300 px-2 py-1 text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <a
                      href={(proceduresIcao || '').trim().length === 4 ? `/procedures/${(proceduresIcao || '').trim().toUpperCase()}#procedures` : '#'}
                      className={`px-3 py-1 text-xs font-bold rounded ${ (proceduresIcao || '').trim().length === 4 ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-slate-300 text-slate-600 cursor-not-allowed'}`}
                    >
                      Procedimentos
                    </a>
                    <a
                      href={(proceduresIcao || '').trim().length === 4 ? `/procedures/${(proceduresIcao || '').trim().toUpperCase()}#rotaer` : '#'}
                      className={`px-3 py-1 text-xs font-bold rounded ${ (proceduresIcao || '').trim().length === 4 ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-300 text-slate-600 cursor-not-allowed'}`}
                    >
                      ROTAER
                    </a>
                    <a
                      href={(proceduresIcao || '').trim().length === 4 ? `/procedures/${(proceduresIcao || '').trim().toUpperCase()}#notams` : '#'}
                      className={`px-3 py-1 text-xs font-bold rounded ${ (proceduresIcao || '').trim().length === 4 ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-slate-300 text-slate-600 cursor-not-allowed'}`}
                    >
                      NOTAMs
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Carrossel de ofertas de hangares */}
          <HangarCarousel />

          {/* Widgets Row: Weather | Classifieds | News | HangarShare - with stacked Income Widgets in News column */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Col 1: Airport Weather */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">☁️</span>
                <h3 className="text-lg font-bold text-blue-900">Clima Aeroporto</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ICAO (ex: SBGR)"
                    maxLength={4}
                    value={icaoCode}
                    onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={() => fetchWeather(icaoCode)}
                    disabled={loadingWeather || icaoCode.length !== 4}
                    className="px-3 py-1 bg-blue-900 text-white text-xs font-bold rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loadingWeather ? '...' : 'Buscar'}
                  </button>
                </div>
                
                {weatherError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {weatherError}
                  </div>
                )}
                
                {weatherData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-bold">{weatherData.station}</span>
                      <span className={`font-bold px-2 py-1 rounded text-xs ${getFlightCategory(weatherData.flight_category).bg} ${getFlightCategory(weatherData.flight_category).color}`}>
                        {getFlightCategory(weatherData.flight_category).label}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-700 space-y-1">
                      {weatherData.temperature && (
                        <div>🌡️ Temp: {weatherData.temperature.repr}°C{weatherData.dewpoint && ` • Dew: ${weatherData.dewpoint.repr}°C`}</div>
                      )}
                      {weatherData.wind_direction && weatherData.wind_speed && (
                        <div>💨 Vento: {weatherData.wind_direction.repr}°/{weatherData.wind_speed.repr} KT
                          {weatherData.wind_gust && ` G${weatherData.wind_gust.repr} KT`}
                        </div>
                      )}
                      {weatherData.visibility && (
                        <div>👁️ Vis: {weatherData.visibility.repr} KM</div>
                      )}
                      {weatherData.altimeter && (
                        <div>🎚️ QNH: {weatherData.altimeter.repr} inHg</div>
                      )}
                      {weatherData.clouds && weatherData.clouds.length > 0 && (
                        <div>☁️ Nuvens: {weatherData.clouds.join(', ')} FT</div>
                      )}
                    </div>
                    
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded font-mono break-all leading-relaxed">
                      {weatherData.raw}
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      ⏰ {weatherData.time ? new Date(weatherData.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'Z' : 'N/A'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">
                    Digite um código ICAO e clique em Buscar
                  </div>
                )}
              </div>

              {/* Mock Ad: Empresa de Manutenção de Aeronaves */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Anúncio</div>
                <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg p-3 flex gap-3 items-center">
                  <img
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=70"
                    alt="MRO Manutenção Aeronáutica"
                    width={80}
                    height={64}
                    className="w-20 h-16 object-cover rounded"
                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-900 leading-tight">MRO Prime Aviation</h4>
                    <p className="text-[11px] text-slate-600">Inspeções, motores, aviônicos e pintura. Certificação ANAC.</p>
                    <button className="mt-1 px-2 py-1 text-[11px] bg-blue-900 text-white rounded hover:bg-blue-800">Solicitar orçamento</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2: Classifieds Carousel - Enhanced Design */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Classificados Premium</div>
                  <h3 className="text-lg font-black text-blue-900">Aeronaves à Venda</h3>
                </div>
                {classifieds[listingIndex].featured && (
                  <span className="bg-yellow-400 text-blue-900 px-2 py-1 rounded text-xs font-bold">Featured</span>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                <img
                  src={classifieds[listingIndex].image}
                  alt={classifieds[listingIndex].title}
                  className="w-full h-40 object-cover"
                />
                <button 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-lg"
                  title="Favoritar"
                >
                  <span className="text-slate-600">♡</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-base font-bold text-blue-900">{classifieds[listingIndex].title}</h4>
                  <p className="text-xs text-slate-500">{classifieds[listingIndex].category}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-green-700">{classifieds[listingIndex].price}</span>
                </div>
                
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">📅 Ano:</span>
                    <span>{classifieds[listingIndex].year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">⏱️ Horas:</span>
                    <span>{classifieds[listingIndex].hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">📍 Local:</span>
                    <span>{classifieds[listingIndex].location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">🏢 Vendedor:</span>
                    <span>{classifieds[listingIndex].seller}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded hover:bg-blue-800">
                    📧 Email Seller
                  </button>
                  <button className="flex-1 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600">
                    📞 {classifieds[listingIndex].phone}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <button
                  aria-label="Anterior"
                  onClick={() => setListingIndex((listingIndex - 1 + classifieds.length) % classifieds.length)}
                  className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ‹
                </button>
                
                <div className="flex gap-1.5">
                  {classifieds.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setListingIndex(i)}
                      className={`h-2 rounded-full transition-all ${i === listingIndex ? 'bg-blue-900 w-6' : 'bg-slate-300 w-2 hover:bg-slate-400'}`}
                      aria-label={`Ir para anúncio ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  aria-label="Próximo"
                  onClick={() => setListingIndex((listingIndex + 1) % classifieds.length)}
                  className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                >
                  ›
                </button>
              </div>

            </div>

            {/* Col 3: Clock + Latest News */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕐</span>
                  <h3 className="text-sm font-bold text-blue-900">UTC</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-900">
                    {new Date().toUTCString().split(' ')[4]}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {new Date().toUTCString().split(',')[0]}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📰</span>
                  <h3 className="text-lg font-bold text-blue-900">Notícias Aviação</h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingNews ? (
                    <div className="text-xs text-slate-500 text-center py-4">Carregando...</div>
                  ) : newsArticles.length > 0 ? (
                    newsArticles.slice(0, 3).map((article, index) => (
                      <a
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-slate-600 border-b border-slate-100 pb-2 hover:bg-slate-50 px-2 -mx-2 rounded transition-colors"
                      >
                        <p className="font-semibold line-clamp-2">{article.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-slate-400">{getTimeAgo(article.publishedAt)}</p>
                          <p className="text-slate-400 text-xs">{article.source.name}</p>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">Sem notícias disponíveis</div>
                  )}
                </div>
              </div>

              {/* Mock Ad: Condomínio Aeronáutico (movido para coluna da direita) */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Anúncio</div>
                <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-lg p-3 flex gap-3 items-center">
                  <img
                    src="https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=500&q=70"
                    alt="Condomínio Aeronáutico"
                    width={80}
                    height={64}
                    className="w-20 h-16 object-cover rounded"
                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-900 leading-tight">SkyPark Condomínio Aeronáutico</h4>
                    <p className="text-[11px] text-slate-600">Lotes e hangares prontos. Pista asfaltada, abastecimento e lounge.</p>
                    <button className="mt-1 px-2 py-1 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600">Saiba mais</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 4: HangarShare Featured Listing */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">HangarShare</div>
                  <h3 className="text-lg font-black text-blue-900">Espaço para sua Aeronave</h3>
                </div>
                <span className="bg-green-400 text-green-900 px-2 py-1 rounded text-xs font-bold">Novo</span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                <img
                  src="/hangars/29aec752-cafd-4cbe-b7d7-01ecbbf5c9f9.jpeg"
                  alt="Hangar para locação"
                  className="w-full h-40 object-cover"
                />
                <button 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-lg"
                  title="Favoritar"
                >
                  <span className="text-slate-600">♡</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-base font-bold text-blue-900">Reserve ou Anuncie seu Hangar</h4>
                  <p className="text-xs text-slate-500">Plataforma completa para locação de hangares</p>
                </div>
                
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">🏢 Hangares:</span>
                    <span>Disponíveis em todo Brasil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">💰 Preços:</span>
                    <span>A partir de R$ 50/dia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">📍 Aeródromos:</span>
                    <span>SBSP, SBRJ, SBCF e mais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">⚡ Reserva:</span>
                    <span>Instantânea e segura</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href="/hangarshare" 
                    className="flex-1 px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded hover:bg-blue-800 text-center"
                  >
                    🔍 Buscar Hangares
                  </a>
                  <a 
                    href="/hangarshare/owner/register" 
                    className="flex-1 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 text-center"
                  >
                    ➕ Anunciar Hangar
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Income Widgets Row - Below Main Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aviation Insurance Quote Widget */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                <div>
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Seguro Aeronáutico</div>
                  <h3 className="text-lg font-black text-blue-900">Cotação Imediata</h3>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 space-y-3">
                <p className="text-sm text-blue-900 font-semibold">Proteção completa para sua aeronave</p>
                
                <div className="space-y-2">
                  <div className="text-xs text-blue-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Responsabilidade Civil</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Danos à Aeronave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Cobertura Internacional</span>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-blue-900 text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition">
                  Solicitar Cotação
                </button>
              </div>

              <div className="text-xs text-slate-500 text-center">
                Comparamos as melhores seguradoras do Brasil
              </div>
            </div>

            {/* Pilot Shop Deal of the Day */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎁</span>
                  <div>
                    <div className="text-xs font-semibold text-orange-900 uppercase tracking-wide">Oferta do Dia</div>
                    <h3 className="text-lg font-black text-blue-900">Pilot Shop</h3>
                  </div>
                </div>
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">-25%</span>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80"
                  alt="Headset de aviação Bose A20"
                  className="w-full h-32 object-cover"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-base font-bold text-blue-900">Headset Bose A20</h4>
                  <p className="text-xs text-slate-500">Comunicação profissional com cancelamento de ruído</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-green-700">R$ 5.999</span>
                  <span className="text-sm line-through text-slate-400">R$ 7.999</span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                  <span className="font-semibold">⏰ Oferta válida por:</span> 23h 45min
                </div>

                <a
                  href="/marketplace"
                  className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition text-center block"
                >
                  Ver Oferta Completa
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Landing page for non-logged users
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Sidebar & Main Content Layout */}

      <div className="flex min-h-[calc(100vh-210px)]">
        {/* Sidebar para usuário logado */}
        {user && (
          <Sidebar />
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 py-8 space-y-6 max-w-6xl mx-auto w-full bg-gray-50">
          <HangarCarousel />
          {/* Conteúdo principal permanece */}
          {/* Prévia de ferramentas e módulos (visível sem login) */}
          {Object.entries(modules).map(([key, module]) => {
            const moduleHasAccess = hasAccess(module.minPlan);
            const accessibleFeatures = module.features.filter(f => hasAccess(f.minPlan));
            const lockedFeatures = module.features.filter(f => !hasAccess(f.minPlan));

            // No landing, mostramos apenas o cabeçalho do módulo e as features livres
            return (
              <section key={`landing-${key}`} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{module.icon}</span>
                  <h2 className="text-2xl font-bold text-blue-900">{module.name}</h2>
                  {!moduleHasAccess && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Alguns itens requerem {module.minPlan}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleFeatures.map((feature, idx) => (
                    <a
                      key={idx}
                      href={feature.href}
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition"
                    >
                      <h3 className="text-blue-900 font-bold mb-2">{feature.name}</h3>
                      <p className="text-sm text-gray-800">{feature.desc}</p>
                    </a>
                  ))}

                  {lockedFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-100 rounded-xl border border-gray-300 p-6 shadow-sm opacity-60 cursor-not-allowed relative"
                    >
                      <div className="absolute top-3 right-3 text-xs bg-blue-900 text-white px-2 py-1 rounded">
                        {feature.minPlan}
                      </div>
                      <h3 className="text-gray-700 font-bold mb-2">{feature.name}</h3>
                      <p className="text-sm text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Entrar">
        <LoginForm onSuccess={() => setLoginOpen(false)} />
      </Modal>

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Criar conta">
        <RegisterForm onSuccess={() => { setRegisterOpen(false); setLoginOpen(true); }} />
      </Modal>
    </div>
  );
}