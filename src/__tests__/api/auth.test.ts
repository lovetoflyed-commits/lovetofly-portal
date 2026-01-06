/**
 * Test suite for authentication and authorization
 */
import jwt from 'jsonwebtoken';

describe('JWT Authentication', () => {
  const secret = 'test-secret-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    test('should generate valid JWT token', () => {
      const payload = {
        userId: '1',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, secret, { expiresIn: '24h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should include user data in token', () => {
      const payload = {
        userId: '42',
        email: 'user@test.com',
      };

      const token = jwt.sign(payload, secret);
      const decoded = jwt.verify(token, secret) as any;

      expect(decoded.userId).toBe('42');
      expect(decoded.email).toBe('user@test.com');
    });
  });

  describe('Token Verification', () => {
    test('should verify valid token', () => {
      const payload = {
        userId: '1',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, secret);
      const decoded = jwt.verify(token, secret);

      expect(decoded).toMatchObject(payload);
    });

    test('should reject invalid token signature', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, 'wrong-secret');

      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('invalid signature');
    });

    test('should reject expired token', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, secret, { expiresIn: '-1s' });

      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });

    test('should reject tampered token', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, secret);
      const tampered = token.slice(0, -5) + 'xxxxx';

      expect(() => {
        jwt.verify(tampered, secret);
      }).toThrow();
    });
  });

  describe('Authorization Checks', () => {
    test('should extract userId from valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, secret);
      const decoded = jwt.verify(token, secret) as any;

      expect(decoded.userId).toBe('123');
    });

    test('should handle missing Bearer token', () => {
      const authHeader = 'InvalidFormat token123';
      const bearerToken = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;

      expect(bearerToken).toBeNull();
    });

    test('should extract token from Authorization header', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, secret);
      const authHeader = `Bearer ${token}`;

      const extractedToken = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;

      expect(extractedToken).toBe(token);

      const decoded = jwt.verify(extractedToken!, secret) as any;
      expect(decoded.userId).toBe('1');
    });
  });

  describe('Token Expiration', () => {
    test('should set proper expiration time', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, secret, { expiresIn: '24h' });
      const decoded = jwt.verify(token, secret) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should handle token with no expiration', () => {
      const payload = { userId: '1' };
      const token = jwt.sign(payload, secret);
      const decoded = jwt.verify(token, secret) as any;

      // Token without expiration will have iat but no exp
      expect(decoded.iat).toBeDefined();
    });
  });
});
