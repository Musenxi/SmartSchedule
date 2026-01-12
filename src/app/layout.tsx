import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { ThemeEffect } from '@/components/theme-effect';
import { ThemeScript } from '@/components/theme-script';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '智能课程表',
  description: 'AI驱动的智能课程表应用',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SmartSchedule',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeScript />
        <Providers>
          <ThemeEffect />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
