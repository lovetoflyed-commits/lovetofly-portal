'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerDashboardV2Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hangarshare/owner/dashboard');
  }, [router]);

  return null;
}
