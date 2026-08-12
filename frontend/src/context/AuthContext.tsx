'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserSession } from '@/lib/api-client';

const STORAGE_KEY = 'inkwell_session';
const LEGACY_STORAGE_KEY = 'book_studio_session';

interface AuthContextType {
  user: UserSession['user'] | null;
  loading: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Migration fallback check
    let session = localStorage.getItem(STORAGE_KEY);
    if (!session) {
      session = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (session) {
        localStorage.setItem(STORAGE_KEY, session);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    if (session) {
      try {
        const parsed: UserSession = JSON.parse(session);
        // Check session lifetime
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          setUser(null);
        } else {
          setUser(parsed.user);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, name: string) => {
    const session = await api.login(email, name);
    setUser(session.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
