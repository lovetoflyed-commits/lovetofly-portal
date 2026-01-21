// Component: Feature Flag Wrapper
// File: src/components/FeatureFlagWrapper.tsx
// Purpose: Conditionally render components based on feature flag status

'use client';

import { useEffect, useState } from 'react';

interface FeatureFlagWrapperProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onStatusChange?: (enabled: boolean) => void;
}

/**
 * FeatureFlagWrapper Component
 * 
 * Wraps content that should only display when a feature flag is enabled.
 * Supports graceful fallback when flag is disabled or loading.
 * 
 * @example
 * ```tsx
 * <FeatureFlagWrapper flag="hangarshare_new_dashboard">
 *   <HangarShareV2Dashboard />
 * </FeatureFlagWrapper>
 * ```
 * 
 * @param flag - The feature flag name to check
 * @param children - Content to show when flag is enabled
 * @param fallback - Content to show when flag is disabled (optional)
 * @param onStatusChange - Callback when flag status changes (optional)
 */
export function FeatureFlagWrapper({
  flag,
  children,
  fallback,
  onStatusChange,
}: FeatureFlagWrapperProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/admin/feature-flags/check?flag=${encodeURIComponent(flag)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const enabled = data.enabled === true;

        setIsEnabled(enabled);
        if (onStatusChange) {
          onStatusChange(enabled);
        }

        // Log flag status for debugging
        console.log(
          `[FeatureFlagWrapper] Flag "${flag}" is ${enabled ? 'ENABLED' : 'DISABLED'}`
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[FeatureFlagWrapper] Error checking flag "${flag}":`, errorMessage);
        setError(errorMessage);
        // Fail-safe: disable feature on error
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFlag();

    // Optionally refresh flag status periodically (30 seconds)
    const interval = setInterval(checkFlag, 30000);
    return () => clearInterval(interval);
  }, [flag, onStatusChange]);

  // While loading, show fallback or nothing
  if (loading) {
    return fallback ? <>{fallback}</> : null;
  }

  // If error occurred, show fallback (fail-safe to disabled state)
  if (error) {
    console.warn(
      `[FeatureFlagWrapper] Falling back due to error checking flag "${flag}"`
    );
    return fallback ? <>{fallback}</> : null;
  }

  // Show children if enabled, otherwise show fallback
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook: useFeatureFlag
 * 
 * Check feature flag status directly in components
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { enabled, loading } = useFeatureFlag('hangarshare_new_dashboard');
 *   
 *   if (loading) return <LoadingSpinner />;
 *   return enabled ? <NewDashboard /> : <OldDashboard />;
 * }
 * ```
 */
export function useFeatureFlag(flagName: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/admin/feature-flags/check?flag=${encodeURIComponent(flagName)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEnabled(data.enabled === true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[useFeatureFlag] Error checking flag "${flagName}":`, errorMessage);
        setError(errorMessage);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFlag();

    // Refresh flag status periodically (30 seconds)
    const interval = setInterval(checkFlag, 30000);
    return () => clearInterval(interval);
  }, [flagName]);

  return { enabled, loading, error };
}
