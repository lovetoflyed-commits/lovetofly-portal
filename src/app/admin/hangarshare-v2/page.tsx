'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HangarShareV2DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/hangarshare');
  }, [router]);

  return null;
}
