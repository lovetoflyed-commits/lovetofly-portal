// Component: Feature Flag Wrapper
// File: src/components/hangarshare-v2/FeatureFlagWrapper.tsx
// Purpose: Conditionally render components based on feature flag status

'use client';

import React, { useEffect, useState } from 'react';

interface FeatureFlagWrapperProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlagWrapper({ flag, children, fallback }: FeatureFlagWrapperProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFlag() {
      try {
        const response = await fetch(`/api/admin/feature-flags?flag=${flag}`);
        if (response.ok) {
          const data = await response.json();
          setEnabled(data.enabled === true);
        } else {
          setEnabled(false);
        }
      } catch (error) {
        console.error(`Error checking feature flag ${flag}:`, error);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    }

    checkFlag();
  }, [flag]);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading...</div>;
  }

  if (!enabled) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
