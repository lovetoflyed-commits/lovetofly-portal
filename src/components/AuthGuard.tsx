'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give time for localStorage to load
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only check auth after initial loading
    if (!isChecking && !user) {
      // Lista de rotas públicas que não precisam de login
      const publicRoutes = ['/', '/login', '/register'];

      // Se a rota atual não for pública, manda pro login
      if (!publicRoutes.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [user, router, pathname, isChecking]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Se tiver usuário ou for rota pública, mostra o conteúdo
  return <>{children}</>;
}
