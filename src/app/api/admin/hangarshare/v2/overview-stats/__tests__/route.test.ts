// Unit Tests for Overview Stats API
// File: src/app/api/admin/hangarshare/v2/overview-stats/__tests__/route.test.ts
// Purpose: Test API endpoint data structure and response format

import { GET } from '../route';

describe('Overview Stats API (/api/admin/hangarshare/v2/overview-stats)', () => {
  describe('Response Structure', () => {
    it('should return a valid response structure', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
    });

    it('should have correct data properties', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);
      const data = await response.json();

      if (data.success) {
        expect(data.data).toHaveProperty('heroMetrics');
        expect(data.data).toHaveProperty('financialMetrics');
        expect(data.data).toHaveProperty('occupancyMetrics');
        expect(data.data).toHaveProperty('bookingMetrics');
        expect(data.data).toHaveProperty('alerts');
        expect(data.data).toHaveProperty('topListings');
        expect(data.data).toHaveProperty('recentBookings');
      }
    });

    it('should have valid meta information', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.meta).toHaveProperty('responseTime');
      expect(data.meta).toHaveProperty('generatedAt');
      expect(typeof data.meta.responseTime).toBe('number');
      expect(typeof data.meta.generatedAt).toBe('string');
    });
  });

  describe('Hero Metrics', () => {
    it('should return hero metrics with required fields', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);
      const data = await response.json();

      if (data.data.heroMetrics && data.data.heroMetrics.length > 0) {
        const metric = data.data.heroMetrics[0];
        expect(metric).toHaveProperty('title');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('icon');
        expect(metric).toHaveProperty('status');
      }
    });
  });

  describe('Financial Metrics', () => {
    it('should return financial metrics with revenue data', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.financialMetrics).toHaveProperty('monthlyRevenue');
      expect(data.data.financialMetrics).toHaveProperty('totalRevenue');
      expect(data.data.financialMetrics).toHaveProperty('trend');
      expect(typeof data.data.financialMetrics.totalRevenue).toBe('number');
    });
  });

  describe('Alerts', () => {
    it('should return alerts with valid structure', async () => {
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.alerts).toHaveProperty('count');
      expect(data.data.alerts).toHaveProperty('items');
      expect(Array.isArray(data.data.alerts.items)).toBe(true);

      if (data.data.alerts.items.length > 0) {
        const alert = data.data.alerts.items[0];
        expect(['low', 'medium', 'high']).toContain(alert.severity);
      }
    });
  });
});
