'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await login(email.trim(), name.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-charcoal border border-rule rounded-md p-6 sm:p-8 max-w-md w-full shadow-card font-ui">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-paper tracking-tight">Inkwell Studio</h2>
          <p className="text-xs text-muted mt-1 font-body">Identify yourself to continue into the publishing pipeline</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-bg border border-error/20 rounded-xs text-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block label-sm mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-faint" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Kenneth Grahame"
                className="w-full pl-9 pr-3 py-2 bg-obsidian border border-rule-strong rounded-sm text-paper text-sm placeholder-faint focus:outline-none focus:border-oxide transition-colors duration-fast"
                required
              />
            </div>
          </div>

          <div>
            <label className="block label-sm mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-faint" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. kenneth@example.com"
                className="w-full pl-9 pr-3 py-2 bg-obsidian border border-rule-strong rounded-sm text-paper text-sm placeholder-faint focus:outline-none focus:border-oxide transition-colors duration-fast"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-oxide hover:bg-oxide-hover text-paper text-xs font-semibold uppercase tracking-wider rounded-sm shadow-card transition-colors duration-fast disabled:opacity-50 mt-2"
          >
            {submitting ? 'Authenticating...' : 'Continue to Studio'}
          </button>
        </form>
      </div>
    </div>
  );
};
