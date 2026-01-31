/** @jest-environment node */
// Unit Tests for Overview Stats API
// File: src/app/api/admin/hangarshare/v2/overview-stats/__tests__/route.test.ts
// Purpose: Test API endpoint data structure and response format

import pool from '@/config/db';
import { GET } from '../route';

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

const mockQuerySequence = () => {
  const mock = (pool as { query: jest.Mock }).query;
  mock.mockReset();

  mock
    .mockResolvedValueOnce({ rows: [{ count: 40 }] }) // users
    .mockResolvedValueOnce({ rows: [{ count: 8 }] }) // owners
    .mockResolvedValueOnce({ rows: [{ count: 22 }] }) // listings
    .mockResolvedValueOnce({ rows: [{ count: 12 }] }) // active listings
    .mockResolvedValueOnce({ rows: [{ count: 18 }] }) // bookings
    .mockResolvedValueOnce({ rows: [{ count: 3 }] }) // pending bookings
    .mockResolvedValueOnce({ rows: [{ count: 9 }] }) // completed bookings
    .mockResolvedValueOnce({ rows: [{ count: 55 }] }) // photos
    .mockResolvedValueOnce({ rows: [{ total_revenue: 125000, monthly_revenue: 24000 }] }) // revenue
    .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // alerts
    .mockResolvedValueOnce({
      rows: [
        { id: '1', name: 'Hangar Alpha', booking_count: 6, revenue: 5600 },
        { id: '2', name: 'Hangar Beta', booking_count: 4, revenue: 4200 },
      ],
    }) // top listings
    .mockResolvedValueOnce({
      rows: [
        {
          id: 'bk-1',
          listing_name: 'Hangar Alpha',
          owner_name: 'Ana Silva',
          booking_status: 'confirmed',
          check_in_date: new Date().toISOString(),
        },
      ],
    }) // recent bookings
    .mockResolvedValueOnce({ rows: [{ total_listings: 10, occupied: 6 }] }); // occupancy
};

describe('Overview Stats API (/api/admin/hangarshare/v2/overview-stats)', () => {
  describe('Response Structure', () => {
    it('should return a valid response structure', async () => {
      mockQuerySequence();
      const request = new Request('http://localhost:3000/api/admin/hangarshare/v2/overview-stats');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
    });

    it('should have correct data properties', async () => {
      mockQuerySequence();
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
      mockQuerySequence();
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
      mockQuerySequence();
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
      mockQuerySequence();
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
      mockQuerySequence();
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
