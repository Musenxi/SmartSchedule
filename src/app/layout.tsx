import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { ThemeEffect } from '@/components/theme-effect';
import { ThemeScript } from '@/components/theme-script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartSchedule - 智能课程表',
  description: 'AI驱动的智能课程表应用',
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
