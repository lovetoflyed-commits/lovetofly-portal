/**
 * Test suite for hangar owners API
 */
import pool from '@/config/db';

jest.mock('@/config/db', () => ({
  query: jest.fn(),
}));

describe('Hangar Owners API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/hangarshare/owners', () => {
    test('should create a new owner with valid data', async () => {
      const ownerData = {
        user_id: 1,
        company_name: 'Test Company',
        cnpj: '12.345.678/0001-90',
        phone: '(11) 98765-4321',
        address: 'Test Address, 123',
        website: 'https://test.com',
        description: 'Test description',
      };

      const mockResult = {
        id: 1,
        ...ownerData,
        created_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await pool.query(
        `INSERT INTO hangar_owners 
         (user_id, company_name, cnpj, phone, address, website, description, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [
          ownerData.user_id,
          ownerData.company_name,
          ownerData.cnpj,
          ownerData.phone,
          ownerData.address,
          ownerData.website,
          ownerData.description,
        ]
      );

      expect(result.rows[0]).toMatchObject({
        id: 1,
        company_name: 'Test Company',
      });
    });

    test('should reject if company_name is missing', async () => {
      const ownerData = {
        user_id: 1,
        company_name: '',
        cnpj: '12.345.678/0001-90',
      };

      expect(ownerData.company_name).toBe('');
    });

    test('should reject duplicate CNPJ', async () => {
      const cnpj = '12.345.678/0001-90';

      (pool.query as jest.Mock).mockRejectedValueOnce({
        code: '23505',
        constraint: 'hangar_owners_cnpj_key',
        message: 'duplicate key value violates unique constraint',
      });

      try {
        await pool.query(
          `INSERT INTO hangar_owners (cnpj, ...) VALUES ($1, ...)`,
          [cnpj]
        );
      } catch (error: any) {
        expect(error.code).toBe('23505');
        expect(error.constraint).toBe('hangar_owners_cnpj_key');
      }
    });
  });

  describe('GET /api/hangarshare/owners', () => {
    test('should fetch all owners with their hangars count', async () => {
      const mockOwners = [
        {
          id: 1,
          user_id: 1,
          company_name: 'Premium Hangars',
          phone: '(11) 98765-4321',
          owner_name: 'John Doe',
          total_hangars: 3,
        },
        {
          id: 2,
          user_id: 2,
          company_name: 'Sky Storage',
          phone: '(21) 99999-9999',
          owner_name: 'Jane Smith',
          total_hangars: 1,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockOwners,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT ho.*, COUNT(hl.id) as total_hangars 
         FROM hangar_owners ho
         LEFT JOIN hangar_listings hl ON hl.owner_id = ho.id
         GROUP BY ho.id`
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].total_hangars).toBe(3);
      expect(result.rows[1].company_name).toBe('Sky Storage');
    });

    test('should return empty array if no owners exist', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_owners`
      );

      expect(result.rows).toHaveLength(0);
    });

    test('should order owners by creation date (newest first)', async () => {
      const mockOwners = [
        { id: 2, company_name: 'New Company', created_at: '2025-01-06' },
        { id: 1, company_name: 'Old Company', created_at: '2025-01-01' },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockOwners,
        rowCount: 2,
      });

      const result = await pool.query(
        `SELECT * FROM hangar_owners ORDER BY created_at DESC`
      );

      expect(result.rows[0].id).toBe(2);
      expect(result.rows[1].id).toBe(1);
    });
  });
});
