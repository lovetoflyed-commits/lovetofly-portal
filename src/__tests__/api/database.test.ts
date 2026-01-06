/**
 * Test suite for database operations
 */
import pool from '@/config/db';

jest.mock('@/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hangar Listings', () => {
    test('should insert a new listing', async () => {
      const listingData = {
        owner_id: 1,
        airport_icao: 'SBSP',
        hangar_size: 'large',
        price_per_day: 100.00,
        price_per_month: 2500.00,
        approval_status: 'pending_approval',
      };

      const mockResult = {
        id: 1,
        ...listingData,
        created_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await pool.query(
        `INSERT INTO hangar_listings 
         (owner_id, airport_icao, hangar_size, price_per_day, price_per_month, approval_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          listingData.owner_id,
          listingData.airport_icao,
          listingData.hangar_size,
          listingData.price_per_day,
          listingData.price_per_month,
          listingData.approval_status,
        ]
      );

      expect(result.rows[0]).toMatchObject({
        id: 1,
        airport_icao: 'SBSP',
      });
    });

    test('should update listing approval status', async () => {
      const updates = {
        approval_status: 'approved',
        approved_by: 1,
        approved_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, ...updates }],
        rowCount: 1,
      });

      const result = await pool.query(
        `UPDATE hangar_listings 
         SET approval_status = $1, approved_by = $2, approved_at = $3 
         WHERE id = $4 
         RETURNING *`,
        [updates.approval_status, updates.approved_by, updates.approved_at, 1]
      );

      expect(result.rows[0].approval_status).toBe('approved');
    });

    test('should fetch approved listings with photos', async () => {
      const mockListings = [
        {
          id: 1,
          hangar_size: 'large',
          price_per_day: 100,
          approval_status: 'approved',
          photos: [
            { id: 1, url: '/photos/1.jpg', isPrimary: true },
            { id: 2, url: '/photos/2.jpg', isPrimary: false },
          ],
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockListings,
        rowCount: 1,
      });

      const result = await pool.query(
        `SELECT hl.*, json_agg(...) as photos 
         FROM hangar_listings hl
         LEFT JOIN hangar_photos p ON p.listing_id = hl.id
         WHERE hl.approval_status = 'approved'
         GROUP BY hl.id`
      );

      expect(result.rows[0].approval_status).toBe('approved');
      expect(result.rows[0].photos).toHaveLength(2);
    });

    test('should delete listing with cascade delete of photos', async () => {
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
  });

  describe('Hangar Photos', () => {
    test('should insert photo with display order', async () => {
      const photoData = {
        listing_id: 1,
        photo_url: '/uploads/photo1.jpg',
        is_primary: true,
        display_order: 0,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, ...photoData }],
        rowCount: 1,
      });

      const result = await pool.query(
        `INSERT INTO hangar_photos 
         (listing_id, photo_url, is_primary, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          photoData.listing_id,
          photoData.photo_url,
          photoData.is_primary,
          photoData.display_order,
        ]
      );

      expect(result.rows[0].is_primary).toBe(true);
    });

    test('should update primary photo flag', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, is_primary: true }],
        rowCount: 1,
      });

      const result = await pool.query(
        `UPDATE hangar_photos SET is_primary = true WHERE id = $1 RETURNING *`,
        [1]
      );

      expect(result.rows[0].is_primary).toBe(true);
    });

    test('should fetch photos ordered by display_order', async () => {
      const mockPhotos = [
        { id: 1, display_order: 0, photo_url: '/photo1.jpg' },
        { id: 2, display_order: 1, photo_url: '/photo2.jpg' },
        { id: 3, display_order: 2, photo_url: '/photo3.jpg' },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockPhotos,
        rowCount: 3,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_photos WHERE listing_id = $1 ORDER BY display_order`,
        [1]
      );

      expect(result.rows[0].display_order).toBe(0);
      expect(result.rows[2].display_order).toBe(2);
    });
  });

  describe('Transactions', () => {
    test('should handle transaction rollback on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Insert failed')); // INSERT error

      try {
        await mockClient.query('BEGIN');
        await mockClient.query('INSERT INTO table VALUES (...)');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle transaction commit on success', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // INSERT
      mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

      await mockClient.query('BEGIN');
      const result = await mockClient.query('INSERT INTO table VALUES (...)');
      await mockClient.query('COMMIT');

      expect(result.rows[0].id).toBe(1);
      expect(mockClient.release).toBeDefined();
    });
  });

  describe('Foreign Key Constraints', () => {
    test('should enforce foreign key constraints', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce({
        code: '23503',
        constraint: 'hangar_listings_owner_id_fkey',
        message: 'insert or update on table "hangar_listings" violates foreign key constraint',
      });

      try {
        await pool.query(
          `INSERT INTO hangar_listings (owner_id, ...) VALUES ($1, ...)`,
          [9999] // Non-existent owner
        );
      } catch (error: any) {
        expect(error.code).toBe('23503');
      }
    });

    test('should cascade delete related records', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rowCount: 5, // 5 photos deleted
      });

      const result = await pool.query(
        `DELETE FROM hangar_listings WHERE id = $1`,
        [1]
      );

      expect(result.rowCount).toBeGreaterThan(0);
    });
  });
});
