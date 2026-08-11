import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Inkwell — Gemini AI Storybook Pipeline',
  description: 'Turn a book text into character portraits and chapter illustrations using Gemini API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
