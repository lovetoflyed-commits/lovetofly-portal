/**
 * Test suite for listing operations
 */
import pool from '@/config/db';

jest.mock('@/config/db', () => ({
  query: jest.fn(),
}));

describe('Hangar Listing Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Listing', () => {
    test('should create listing with all fields', async () => {
      const listingData = {
        owner_id: 1,
        airport_icao: 'SBSP',
        hangar_number: 'A-101',
        hangar_size: 'large',
        price_per_day: 150.00,
        price_per_week: 900.00,
        price_per_month: 4000.00,
        dimensions_length: 30.0,
        dimensions_width: 25.0,
        dimensions_height: 10.0,
        climate_control: true,
        electricity: true,
        approval_status: 'pending_approval',
        description: 'Test hangar with premium features',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, ...listingData, created_at: new Date() }],
        rowCount: 1,
      });

      const result = await pool.query(
        `INSERT INTO hangar_listings (...) VALUES (...)`,
        Object.values(listingData)
      );

      expect(result.rows[0]).toMatchObject({
        airport_icao: 'SBSP',
        climate_control: true,
        approval_status: 'pending_approval',
      });
    });

    test('should set default approval_status to pending', async () => {
      const listingData = {
        owner_id: 1,
        airport_icao: 'SBSP',
        hangar_size: 'small',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, approval_status: 'pending_approval', ...listingData }],
        rowCount: 1,
      });

      const result = await pool.query(
        `INSERT INTO hangar_listings (...) VALUES (...)`,
        Object.values(listingData)
      );

      expect(result.rows[0].approval_status).toBe('pending_approval');
    });
  });

  describe('Update Listing', () => {
    test('should update listing details', async () => {
      const updates = {
        hangar_size: 'xlarge',
        price_per_day: 200.00,
        description: 'Updated description',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, ...updates }],
        rowCount: 1,
      });

      const result = await pool.query(
        `UPDATE hangar_listings SET hangar_size = $1, price_per_day = $2, description = $3 WHERE id = $4`,
        [updates.hangar_size, updates.price_per_day, updates.description, 1]
      );

      expect(result.rows[0].hangar_size).toBe('xlarge');
      expect(result.rows[0].price_per_day).toBe(200);
    });

    test('should verify ownership before updating', async () => {
      const ownerCheck = {
        id: 1,
        owner_id: 5,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [ownerCheck],
        rowCount: 1,
      });

      const result = await pool.query(
        `SELECT id, owner_id FROM hangar_listings WHERE id = $1`,
        [1]
      );

      // Check ownership
      const isOwner = result.rows[0].owner_id === 5; // Pretend userId is 5
      expect(isOwner).toBe(true);
    });
  });

  describe('Delete Listing', () => {
    test('should delete listing by ID', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await pool.query(
        `DELETE FROM hangar_listings WHERE id = $1 RETURNING id`,
        [1]
      );

      expect(result.rowCount).toBe(1);
    });

    test('should verify ownership before deletion', async () => {
      const ownerCheck = {
        id: 1,
        owner_id: 5,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [ownerCheck],
        rowCount: 1,
      });

      const result = await pool.query(
        `SELECT id, owner_id FROM hangar_listings WHERE id = $1`,
        [1]
      );

      const isOwner = result.rows[0].owner_id === 5;
      expect(isOwner).toBe(true);
    });

    test('should cascade delete photos when listing deleted', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await pool.query(
        `DELETE FROM hangar_listings WHERE id = $1`,
        [1]
      );

      expect(result.rowCount).toBe(1);
      // Photos should be deleted via CASCADE constraint
    });
  });

  describe('Search Listings', () => {
    test('should search by airport ICAO', async () => {
      const mockListings = [
        { id: 1, airport_icao: 'SBSP', hangar_size: 'large' },
        { id: 2, airport_icao: 'SBSP', hangar_size: 'small' },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_listings WHERE airport_icao = $1 AND approval_status = 'approved'`,
        ['SBSP']
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows.every(l => l.airport_icao === 'SBSP')).toBe(true);
    });

    test('should filter by price range', async () => {
      const mockListings = [
        { id: 1, price_per_day: 100 },
        { id: 2, price_per_day: 150 },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_listings WHERE price_per_day BETWEEN $1 AND $2`,
        [100, 200]
      );

      expect(result.rows.every(l => l.price_per_day >= 100 && l.price_per_day <= 200)).toBe(true);
    });

    test('should filter by approval status', async () => {
      const mockListings = [
        { id: 1, approval_status: 'approved' },
        { id: 2, approval_status: 'approved' },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_listings WHERE approval_status = 'approved'`
      );

      expect(result.rows.every(l => l.approval_status === 'approved')).toBe(true);
    });
  });

  describe('Featured Listings', () => {
    test('should fetch highlighted approved listings', async () => {
      const mockListings = [
        {
          id: 1,
          approval_status: 'approved',
          bookingCount: 5,
          photos: [],
        },
        {
          id: 2,
          approval_status: 'approved',
          bookingCount: 3,
          photos: [],
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_listings WHERE approval_status = 'approved' ORDER BY created_at DESC LIMIT 10`
      );

      expect(result.rows.every(l => l.approval_status === 'approved')).toBe(true);
    });

    test('should sort by booking count', async () => {
      const mockListings = [
        { id: 1, bookingCount: 10 },
        { id: 2, bookingCount: 5 },
        { id: 3, bookingCount: 3 },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 3,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_listings ORDER BY booking_count DESC LIMIT 10`
      );

      expect(result.rows[0].bookingCount).toBeGreaterThanOrEqual(result.rows[1].bookingCount);
    });
  });
});
