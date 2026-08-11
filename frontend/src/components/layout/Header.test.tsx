import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { AuthContext } from '@/context/AuthContext';

describe('Header Component', () => {
  it('renders brand name Inkwell', () => {
    render(
      <AuthContext.Provider value={{ user: null, login: vi.fn(), logout: vi.fn(), loading: false }}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Inkwell/i)).toBeInTheDocument();
  });

  it('renders user details and triggers logout on click', () => {
    const mockLogout = vi.fn();
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'Alice Smith' };

    render(
      <AuthContext.Provider value={{ user: mockUser, login: vi.fn(), logout: mockLogout, loading: false }}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    const signOutBtn = screen.getByTitle('Sign Out');
    fireEvent.click(signOutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
