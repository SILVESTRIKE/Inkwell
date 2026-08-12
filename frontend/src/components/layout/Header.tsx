'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-charcoal border-b border-rule sticky top-0 z-30 px-4 py-3 sm:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/projects" className="flex items-center space-x-2 group">
          <span className="text-xl font-display font-bold text-paper tracking-tight group-hover:text-oxide transition-colors duration-fast">
            Inkwell
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted font-ui border-l border-rule pl-2.5 ml-1">
            Studio
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-sm text-muted hover:text-paper hover:bg-obsidian transition-colors duration-fast cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-rule">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-paper">{user.name}</p>
                <p className="text-[11px] text-muted">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-2.5 py-1 text-muted hover:text-paper text-xs font-medium transition-colors duration-fast cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-oxide" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
