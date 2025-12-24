'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ATUALIZADO: Adicionamos os campos do perfil aqui para o TypeScript parar de reclamar
export interface User {
  id: string;
  name: string;
  email: string;
  anac_code?: string;
  role?: string;
  // Campos adicionais do perfil
  phone_number?: string;
  address?: string;
  current_license?: string;
  current_ratings?: string;
  total_flight_hours?: string | number;
  course_type?: string;
  transferred_from_ciac?: boolean;
  previous_ciac_name?: string;
  observations?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  updateUser: (data: Partial<User>) => void; // Adicionei uma função auxiliar útil
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadStorageData() {
      const storedUser = localStorage.getItem('@LoveToFly:user');
      const storedToken = localStorage.getItem('@LoveToFly:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function login(identifier: string, password: string) {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      localStorage.setItem('@LoveToFly:user', JSON.stringify(data.user));
      localStorage.setItem('@LoveToFly:token', data.token);

      setUser(data.user);
      router.push('/');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('@LoveToFly:user');
    localStorage.removeItem('@LoveToFly:token');
    setUser(null);
    router.push('/login');
  }

  // Função para atualizar o usuário localmente sem precisar relogar
  function updateUser(data: Partial<User>) {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('@LoveToFly:user', JSON.stringify(updatedUser));
    }
  }

  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
