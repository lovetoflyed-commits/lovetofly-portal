'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Fetch unread notifications count
      const fetchUnreadCount = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch('/api/user/notifications?unreadOnly=true&limit=1', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchUnreadCount();
      // Poll only on initial load, not periodically
      return () => {};
    }
  }, [user]);

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
            <Link href="/shop" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Shop
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-900 font-medium transition-colors flex items-center gap-1">
                Classificados
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link href="/classifieds/aircraft" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-900 font-medium rounded-t-lg">
                  ✈️ Aircraft
                </Link>
                <Link href="/classifieds/parts" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-900 font-medium">
                  🔧 Parts
                </Link>
                <Link href="/classifieds/avionics" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-900 font-medium rounded-b-lg">
                  📡 Avionics
                </Link>
              </div>
            </div>
            <Link href="/forum" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">
              Forum
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative text-gray-700 hover:text-blue-900 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                    unreadCount={unreadCount}
                  />
                </div>

                <Link href="/profile" className="text-gray-700 hover:text-blue-900 font-medium">
                  {user.name || user.email}
                </Link>
                <Link
                  href="/"
                  className="bg-white text-blue-900 border border-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Página inicial
                </Link>
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
