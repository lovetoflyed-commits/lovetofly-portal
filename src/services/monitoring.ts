/**
 * Monitoring Service - Track API performance and custom metrics
 * Integrates with Sentry and provides custom event tracking
 */

import * as Sentry from '@sentry/nextjs';

export type MetricType = 'api_response_time' | 'database_query' | 'payment_processing' | 'email_sent' | 'user_action';
export type SeverityLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: number;
}

interface CustomEvent {
  message: string;
  type: MetricType;
  severity: SeverityLevel;
  metadata?: Record<string, any>;
}

/**
 * Global performance monitoring for API endpoints
 */
export class MonitoringService {
  /**
   * Track API response time and performance
   */
  static trackApiPerformance(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    success: boolean = true
  ) {
    Sentry.captureMessage(`API Performance: ${endpoint}`, {
      level: success ? 'info' : 'warning',
      tags: {
        endpoint,
        statusCode: statusCode.toString(),
        success: success.toString(),
      },
      contexts: {
        performance: {
          responseTime,
          threshold: 100, // ms
          exceedsThreshold: responseTime > 100,
        },
      },
    });

    // Log slow queries
    if (responseTime > 100) {
      console.warn(`Slow API: ${endpoint} took ${responseTime}ms`);
    }
  }

  /**
   * Track database query performance
   */
  static trackDatabaseQuery(
    query: string,
    executionTime: number,
    rowsAffected: number = 0
  ) {
    const isSlowQuery = executionTime > 50; // ms

    if (isSlowQuery) {
      Sentry.captureMessage('Slow database query detected', {
        level: 'warning',
        contexts: {
          database: {
            executionTime,
            rowsAffected,
            query: query.substring(0, 100), // First 100 chars only
          },
        },
      });

      console.warn(
        `Slow DB Query: ${executionTime}ms - ${query.substring(0, 50)}...`
      );
    }
  }

  /**
   * Track payment processing events
   */
  static trackPaymentEvent(
    eventType: 'initiated' | 'success' | 'failed',
    amount: number,
    currency: string = 'BRL',
    metadata?: Record<string, any>
  ) {
    const severity =
      eventType === 'failed' ? 'error' : eventType === 'success' ? 'info' : 'debug';

    Sentry.captureMessage(`Payment ${eventType}`, {
      level: severity,
      tags: {
        eventType,
        amount: amount.toString(),
        currency,
      },
      contexts: {
        payment: {
          ...metadata,
        },
      },
    });
  }

  /**
   * Track email sending events
   */
  static trackEmailEvent(
    recipient: string,
    emailType: string,
    success: boolean,
    error?: string
  ) {
    if (!success) {
      Sentry.captureMessage(`Email sending failed: ${emailType}`, {
        level: 'error',
        contexts: {
          email: {
            recipient,
            emailType,
            error,
          },
        },
      });
    }
  }

  /**
   * Track user actions for analytics
   */
  static trackUserAction(
    action: string,
    userId: number | string | null,
    metadata?: Record<string, any>
  ) {
    // Only track in production to avoid noise
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(`User action: ${action}`, {
        level: 'info',
        tags: {
          action,
          userId: userId?.toString() || 'anonymous',
        },
        contexts: {
          user: {
            userId,
            ...metadata,
          },
        },
      });
    }
  }

  /**
   * Report custom metric to Sentry
   */
  static recordMetric(metric: PerformanceMetric) {
    // Send to Sentry with structured format
    Sentry.captureMessage(`Metric: ${metric.name}`, {
      level: 'info',
      tags: {
        ...metric.tags,
        unit: metric.unit,
      },
      contexts: {
        metric: {
          value: metric.value,
          name: metric.name,
          unit: metric.unit,
        },
      },
    });
  }

  /**
   * Send custom event for debugging
   */
  static logEvent(event: CustomEvent) {
    Sentry.captureMessage(event.message, {
      level: event.severity,
      tags: {
        type: event.type,
      },
      contexts: {
        event: event.metadata,
      },
    });
  }

  /**
   * Capture exception with context
   */
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      contexts: {
        additional: context,
      },
    });
  }

  /**
   * Check if monitoring is enabled
   */
  static isEnabled(): boolean {
    return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  }
}

/**
 * Middleware helper for tracking API response times
 */
export function createPerformanceMonitoringMiddleware() {
  return (request: Request, handler: (req: Request) => Promise<Response>) => {
    return async (req: Request): Promise<Response> => {
      const startTime = performance.now();

      try {
        const response = await handler(req);
        const duration = performance.now() - startTime;

        // Track successful requests that are slow
        if (duration > 100) {
          MonitoringService.trackApiPerformance(
            req.url,
            duration,
            response.status,
            true
          );
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        MonitoringService.trackApiPerformance(req.url, duration, 500, false);
        throw error;
      }
    };
  };
}

export default MonitoringService;
