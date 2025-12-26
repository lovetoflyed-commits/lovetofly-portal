'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não tiver usuário (não logado)
    if (!user) {
      // Lista de rotas públicas que não precisam de login
      const publicRoutes = ['/', '/login', '/register'];

      // Se a rota atual não for pública, manda pro login
      if (!publicRoutes.includes(pathname)) {
        router.push('/login');
      }
    }
  }, [user, router, pathname]);

  // Se tiver usuário ou for rota pública, mostra o conteúdo
  return <>{children}</>;
}
