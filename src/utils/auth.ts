// Placeholder for auth utilities
// TODO: Implement real JWT verification and helpers as needed
export function verifyToken(token: string): { id: string; role: string } | null {
  // Mock implementation for build to pass
  if (!token) return null;
  return { id: 'mock', role: 'USER' };
}