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
      <body className="bg-obsidian text-paper min-h-screen flex flex-col font-ui antialiased selection:bg-oxide-soft selection:text-paper overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 flex flex-col min-h-0 w-full">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
