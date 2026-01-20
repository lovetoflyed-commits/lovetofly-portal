/**
 * Sentry Error Tracking Configuration
 * Initializes Sentry for error monitoring and performance tracking
 * 
 * Phase 1.3: Error Handling (Jan 20, 2026)
 */

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  // Only initialize if DSN is configured
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      
      // Environment configuration
      environment: process.env.NODE_ENV || 'development',
      
      // Release tracking (use git commit hash or version)
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Session replay sample rates
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Filter out known non-critical errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Ignore certain error types
        if (error instanceof Error) {
          // Ignore ResizeObserver errors (browser quirk)
          if (error.message?.includes('ResizeObserver')) {
            return null;
          }
          
          // Ignore cancelled requests
          if (error.message?.includes('AbortError')) {
            return null;
          }
          
          // Ignore network errors in development
          if (process.env.NODE_ENV === 'development' && error.message?.includes('NetworkError')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Ignore specific errors by type
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'ChunkLoadError',
        'Loading chunk',
      ],
    });

    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Manually log an error to Sentry
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error (Sentry not configured):', error, context);
  }
}

/**
 * Manually log a message to Sentry
 */
export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(user);
  }
}
