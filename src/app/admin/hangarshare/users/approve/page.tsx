'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApproveUsersPage() {
  const router = useRouter();

  useEffect(() => {
    // Get owner ID from URL if present
    const url = new URL(window.location.href);
    const ownerId = url.searchParams.get('id');
    
    if (ownerId) {
      router.replace(`/admin/hangarshare/owners/${ownerId}`);
    } else {
      router.replace('/admin/hangarshare?tab=users');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="text-lg font-semibold text-slate-900 mb-2">
          Redirecionando para Verificações...
        </div>
        <p className="text-slate-600">
          Você será levado para o módulo unificado de verificações de proprietários.
        </p>
      </div>
    </div>
  );
}

