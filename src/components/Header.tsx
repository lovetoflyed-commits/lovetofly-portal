'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-blue-900 font-black text-xl tracking-wider">
              LOVE TO FLY
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/courses" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Courses
            </Link>
            <Link href="/logbook" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Logbook
            </Link>
            <Link href="/tools/e6b" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Tools
            </Link>
            <Link href="/marketplace" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Marketplace
            </Link>
            <Link href="/forum" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Forum
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/profile" className="text-gray-700 hover:text-blue-900 font-medium">
                  {user.name || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-900 font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
