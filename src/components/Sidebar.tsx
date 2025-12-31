'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';



type SidebarProps = {
  onFeatureClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
};

export default function Sidebar({ onFeatureClick, disabled }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  // Estado para controlar qual seção está expandida
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const menuSections = [
    {
      title: 'Navegação',
      items: [
        { href: '/', label: 'Dashboard', icon: '🏠' },
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
      title: 'Meteorologia',
      items: [
        { href: '/weather', label: 'METAR/TAF', icon: '☁️' },
        // { href: '/weather/radar', label: 'Radar Meteorológico', icon: '🌦️' }, // descomente se houver subrota
      ],
    },
    {
      title: 'Logbook',
      items: [
        { href: '/logbook', label: 'Registro de Horas', icon: '✈️' },
      ],
    },
    {
      title: 'HangarShare',
      items: [
        { href: '/hangarshare', label: 'Buscar Hangares', icon: '🏢' },
        { href: '/hangarshare/owner/register', label: 'Anunciar Hangar', icon: '➕' },
        { href: '/hangarshare/bookings', label: 'Minhas Reservas', icon: '📅' },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { href: '/marketplace', label: 'Pilot Shop', icon: '🛒' },
      ],
    },
    {
      title: 'Cursos e Treinamento',
      items: [
        { href: '/courses', label: 'Cursos Online', icon: '📚' },
      ],
    },
    {
      title: 'Comunidade',
      items: [
        { href: '/forum', label: 'Fórum', icon: '💬' },
      ],
    },
    {
      title: 'Carreira',
      items: [
        { href: '/career', label: 'Vagas de Emprego', icon: '🎯' },
        // { href: '/career/mentorship', label: 'Mentoria', icon: '🤝' }, // descomente se houver rota
      ],
    },
    {
      title: 'Conta',
      items: [
        { href: '/profile', label: 'Meu Perfil', icon: '👤' },
        // { href: '/profile/settings', label: 'Configurações', icon: '⚙️' }, // descomente se houver rota
      ],
    },
  ];

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen border-r border-blue-900">
      <div className="p-6">
        <div className="text-white font-black text-xl tracking-wider mb-8">
          LOVE TO FLY
        </div>
        {user && (
          <div className="mb-6 p-4 bg-blue-900/80 rounded-lg">
            <div className="text-sm font-medium text-blue-200">Bem-vindo(a),</div>
            <div className="text-base font-bold text-white">{user.name}</div>
            {user.plan && (
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                {user.plan.toUpperCase()}
              </div>
            )}
          </div>
        )}
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
                  aria-expanded={isExpanded}
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
                    {section.items.map((item) => (
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
