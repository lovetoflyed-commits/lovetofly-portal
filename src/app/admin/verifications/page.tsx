'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminVerificationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/hangarshare');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecionando…</p>
    </div>
  );
}
