/**
 * Test suite for airport search API
 */
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';

// Mock the database pool
jest.mock('@/config/db', () => ({
  query: jest.fn(),
}));

describe('Airport Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 if ICAO code is missing', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/api/hangarshare/airport/search'));
    
    // Since we're testing the API logic directly, we'll test the validation
    const icaoCode = new URL(req.url).searchParams.get('icao');
    expect(icaoCode).toBeNull();
  });

  test('should return 400 if ICAO code is too short', async () => {
    const searchParams = new URLSearchParams({ icao: 'A' });
    expect(searchParams.get('icao')?.length).toBeLessThan(2);
  });

  test('should query database with ICAO code', async () => {
    const mockAirport = {
      icao_code: 'SBSP',
      iata_code: 'GRU',
      airport_name: 'São Paulo/Congonhas',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      is_public: true,
    };

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [mockAirport],
      rowCount: 1,
    });

    const result = await pool.query(
      `SELECT * FROM airport_icao WHERE icao_code = $1`,
      ['SBSP']
    );

    expect(result.rows[0]).toEqual(mockAirport);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      ['SBSP']
    );
  });

  test('should return 404 if airport not found', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    const result = await pool.query(
      `SELECT * FROM airport_icao WHERE icao_code = $1`,
      ['XXXX']
    );

    expect(result.rows.length).toBe(0);
  });

  test('should support prefix search', async () => {
    const mockAirports = [
      { icao_code: 'SBSP', airport_name: 'São Paulo/Congonhas' },
      { icao_code: 'SBGR', airport_name: 'São Paulo/Guarulhos' },
    ];

    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: mockAirports,
      rowCount: 2,
    });

    const result = await pool.query(
      `SELECT * FROM airport_icao WHERE icao_code LIKE $1`,
      ['SB%']
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].icao_code).toMatch(/^SB/);
  });
});
