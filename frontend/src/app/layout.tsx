import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Inkwell — Storybook AI Pipeline',
  description: 'Turn book text into character portraits and chapter illustrations using Gemini API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-obsidian text-paper min-h-screen flex flex-col font-ui antialiased selection:bg-oxide-soft selection:text-paper">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-8 sm:py-12">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
