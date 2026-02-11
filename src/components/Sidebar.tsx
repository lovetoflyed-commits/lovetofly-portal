'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';



type SidebarProps = {
  onFeatureClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
};

export default function Sidebar({ onFeatureClick, disabled }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  // Estado para controlar qual seção está expandida
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Detectar quando estamos no cliente para evitar hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const menuSections = [
    {
      title: 'Conta',
      items: [
        { href: '/profile', label: 'Meu Perfil', icon: '👤' },
        // { href: '/profile/settings', label: 'Configurações', icon: '⚙️' }, // descomente se houver rota
      ],
    },
    {
      title: 'Carreira',
      items: [
        { href: '/career', label: 'Central de Carreira', icon: '💼' },
        { href: '/career/jobs', label: 'Buscar Vagas', icon: '🔍' },
        user ? { href: '/career/my-applications', label: 'Minhas Candidaturas', icon: '📋' } : null,
        { href: '/career/companies', label: 'Empresas', icon: '🏢' },
        { href: '/mentorship', label: 'Mentoria', icon: '🤝' },
      ].filter(Boolean),
    },
    // Portal para Empresas - Only for business users (pessoa jurídica)
    ...(user?.user_type === 'business' ? [{
      title: 'Portal para Empresas',
      items: [
        { href: '/business/dashboard', label: 'Dashboard de Contratação', icon: '📊' },
        { href: '/business/company/profile', label: 'Perfil da Empresa', icon: '🏛️' },
        { href: '/business/jobs', label: 'Gerenciar Vagas', icon: '📄' },
      ],
    }] : []),
    {
      title: 'Classificados',
      items: [
        { href: '/classifieds/aircraft', label: 'Aeronaves', icon: '✈️' },
        { href: '/classifieds/parts', label: 'Peças e Motores', icon: '🔧' },
        { href: '/classifieds/avionics', label: 'Aviônicos', icon: '📡' },
      ],
    },
    {
      title: 'Traslados',
      items: [
        { href: '/traslados', label: 'Traslados de Aeronaves', icon: '🧭' },
        { href: '/traslados/messages', label: 'Mensagens', icon: '💬' },
        { href: '/traslados/status', label: 'Status da Operação', icon: '📡' },
        { href: '/traslados/owners', label: 'Para Proprietários', icon: '🧑‍✈️' },
        { href: '/traslados/pilots', label: 'Para Pilotos', icon: '🛫' },
      ],
    },
    {
      title: 'Comunidade',
      items: [
        { href: '/forum', label: 'Fórum', icon: '💬' },
      ],
    },
    {
      title: 'Cursos e Treinamento',
      items: [
        { href: '/courses', label: 'Cursos Online', icon: '📚' },
        { href: '/simulator', label: 'Simulador', icon: '🎮' },
      ],
    },
    {
      title: 'Ferramentas de Voo',
      items: [
        { href: '/tools/e6b', label: 'E6B Calculator', icon: '🧮' },
        { href: '/tools', label: 'Planejamento de Voo', icon: '🗺️' },
        { href: '/tools/glass-cockpit', label: 'Glass Cockpit Simulator', icon: '🛩️' },
        { href: '/tools/ifr-simulator', label: 'IFR Simulator', icon: '🛫' },
      ],
    },
    {
      title: 'HangarShare',
      items: [
        { href: '/hangarshare', label: 'Buscar Hangares', icon: '🏢' },
        { href: '/hangarshare/favorites', label: 'Favoritos', icon: '❤️' },
        { href: '/hangarshare/owner/register', label: 'Anunciar Hangar', icon: '➕' },
        { href: '/profile/bookings', label: 'Minhas Reservas', icon: '📅' },
      ],
    },
    {
      title: 'Logbook',
      items: [
        { href: '/logbook', label: 'Registro de Horas', icon: '✈️' },
      ],
    },
    {
      title: 'Meteorologia',
      items: [
        { href: '/weather', label: 'METAR/TAF', icon: '☁️' },
        { href: '/weather/radar', label: 'Radar Meteorológico', icon: '🌦️' },
      ],
    },
    {
      title: 'Navegação',
      items: [
        { href: '/', label: 'Dashboard', icon: '🏠' },
      ],
    },
    {
      title: 'Shop',
      items: [
        { href: '/shop', label: 'Pilot Shop', icon: '🛒' },
      ],
    },
  ];

  // Durante SSR ou hydration, sempre renderizar o sidebar para evitar mismatch
  // Só esconder após o cliente confirmar que não há usuário
  if (isClient && !user) return null;

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen border-r border-blue-900">
      <div className="p-6">
        <div className="text-white font-black text-xl tracking-wider mb-8">
          LOVE TO FLY
        </div>
        <div className="mb-6 p-4 bg-blue-900/80 rounded-lg">
          <div className="text-sm font-medium text-blue-200">Bem-vindo(a),</div>
          <div className="text-base font-bold text-white">{user?.name || 'Carregando...'}</div>
          {user?.plan && (
            <div className="mt-2 inline-block px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              {user.plan.toUpperCase()}
            </div>
          )}
        </div>
        <nav className="space-y-4">
          {menuSections.map((section) => {
            const isExpanded = expandedSection === section.title;
            return (
              <div key={section.title}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors focus:outline-none
                    ${isExpanded ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'}`}
                  onClick={() => setExpandedSection(isExpanded ? null : section.title)}
                >
                  <span className="text-xs font-bold uppercase tracking-wide flex-1 text-left">{section.title}</span>
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="mt-1 space-y-1 pl-4 border-l border-blue-900">
                    {section.items
                      .filter((item): item is NonNullable<typeof item> => Boolean(item))
                      .map((item) => (
                        disabled ? (
                          <button
                            key={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm cursor-not-allowed opacity-60 w-full text-left`}
                            onClick={onFeatureClick}
                            disabled
                            tabIndex={-1}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ) : (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm
                              ${pathname === item.href
                                ? 'bg-blue-500 text-white font-semibold'
                                : 'text-blue-100 hover:bg-blue-600 hover:text-white'}
                            `}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        )
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
