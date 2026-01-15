'use client';

import { ReactNode } from 'react';
// import { useSessionTimeout } from '@/hooks/useSessionTimeout';

/**
 * Client-side wrapper component that activates session timeout
 * Wrapped separately from layout to keep layout server-side
 * Safe implementation - only tracks activity, doesn't modify auth
 * 
 * TEMPORARILY DISABLED: Session timeout causing unexpected logouts
 */
export function SessionTimeoutWrapper({ children }: { children: ReactNode }) {
  // Activate session timeout hook (30 minutes of inactivity)
  // useSessionTimeout(30);

  return <>{children}</>;
}
