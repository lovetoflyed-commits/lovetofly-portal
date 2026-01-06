// Jest setup file
require('@testing-library/jest-dom');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/lovetofly_test';
process.env.NEXTAUTH_SECRET = 'test-auth-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
process.env.RESEND_API_KEY = 'test-resend-key';

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
