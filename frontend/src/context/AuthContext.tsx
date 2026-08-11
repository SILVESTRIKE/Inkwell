'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserSession } from '@/lib/api-client';

interface AuthContextType {
  user: UserSession['user'] | null;
  loading: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('book_studio_session');
    if (session) {
      try {
        const parsed: UserSession = JSON.parse(session);
        setUser(parsed.user);
      } catch {
        localStorage.removeItem('book_studio_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, name: string) => {
    const session = await api.login(email, name);
    setUser(session.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
