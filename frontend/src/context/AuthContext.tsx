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
    const initAuth = async () => {
      try {
        let session = api.getStoredSession();
        if (!session) {
          // Attempt silent refresh via HttpOnly cookie if access token is missing
          const refreshed = await api.refreshAccessToken();
          if (refreshed) {
            session = api.getStoredSession();
          }
        } else if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
          // Access token expired, attempt silent refresh via HttpOnly cookie
          const refreshed = await api.refreshAccessToken();
          if (refreshed) {
            session = api.getStoredSession();
          } else {
            session = null;
          }
        }
        setUser(session ? session.user : null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
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
