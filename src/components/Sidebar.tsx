'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


export default function Sidebar({ disabled = false, onFeatureClick }: {
  disabled?: boolean;
  onFeatureClick?: (e: React.MouseEvent) => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/courses', label: 'Courses', icon: '📚' },
    { href: '/logbook', label: 'Logbook', icon: '✈️' },
    { href: '/tools/e6b', label: 'E6B Calculator', icon: '🧮' },
    { href: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { href: '/forum', label: 'Forum', icon: '💬' },
    { href: '/career', label: 'Career', icon: '🎯' },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="text-blue-900 font-black text-xl tracking-wider mb-8">
          LOVE TO FLY
        </div>

        {user && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium text-gray-600">Welcome,</div>
            <div className="text-base font-bold text-gray-900">{user.name}</div>
            {user.plan && (
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                {user.plan.toUpperCase()}
              </div>
            )}
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            disabled ? (
              <button
                key={item.href}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-not-allowed opacity-60 bg-gray-100`}
                onClick={onFeatureClick}
                tabIndex={0}
                type="button"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          ))}
        </nav>
      </div>
    </aside>
  );
}
