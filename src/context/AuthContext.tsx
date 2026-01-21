'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { initSentry, setUser as setSentryUser } from '@/config/sentry';

interface User {
  id: number;
  name: string;
  email: string;
  plan?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Initialize user and token from localStorage
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  
  const [error, setError] = useState<string | null>(null);

  // Initialize Sentry on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSentry();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Set user in Sentry for error tracking
        setSentryUser({
          id: data.user.id?.toString(),
          email: data.user.email,
          username: data.user.name,
        });
        
        console.log('[AuthContext] Login response user:', data.user);

        // After login, check membership and downgrade if expired, then sync plan and send notifications
        // TEMPORARILY DISABLED: Membership checks causing unexpected logouts
        /*
        try {
          const chk = await fetch('/api/membership/check-and-downgrade-v2', {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (chk.ok) {
            const m = await chk.json();
            if (m?.plan) {
              const merged = { ...data.user, plan: m.plan };
              setUser(merged);
              localStorage.setItem('user', JSON.stringify(merged));
              console.log('[AuthContext] Membership sync plan:', m.plan, 'status:', m.status, 'days_remaining:', m.days_remaining);
              if (m.notification_sent) {
                console.log('[AuthContext] Past-due notification sent to user');
              }
            }
          }
        } catch (e) {
          console.warn('[AuthContext] Membership check failed:', e);
        }
        */

        // Redirect based on role only
        if (data.user.role === 'master' || data.user.role === 'admin' || data.user.role === 'staff') {
          console.log('[AuthContext] Redirecting to /admin for admin/master/staff role');
          router.push('/admin');
        } else {
          console.log('[AuthContext] Redirecting to / for user role:', data.user.role);
          router.push('/');
        }
        return true;
      } else {
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Connection error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear user from Sentry
    setSentryUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } else {
      router.push('/');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
