'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  // CORREÇÃO: Usamos 'logout' em vez de 'signOut'
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Início', href: '/dashboard', icon: '🏠' },
    { name: 'Meu Perfil', href: '/profile', icon: '👤' },
    { name: 'Cursos', href: '/courses', icon: '🎓' },
    { name: 'Simulados', href: '/exams', icon: '📝' },
    { name: 'Regulamentação', href: '/regulations', icon: '⚖️' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shrink-0">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-blue-900">Menu</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout} // CORREÇÃO: Chamando a função logout
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
        >
          <span className="text-xl">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
