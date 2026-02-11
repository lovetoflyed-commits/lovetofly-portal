'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancialDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/finance');
  }, [router]);

  return null;
}
