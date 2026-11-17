import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { PageTransition } from '@/components/ui/PageTransition';
import { CurtainNavigator } from '@/components/ui/CurtainNavigator';

export const metadata: Metadata = {
  title: { default: 'Vestige — Make the Invisible Visible', template: '%s · Vestige' },
  description: 'Reveal your hidden financial leaks, lost time, unseen human effort and silent health debt.',
  keywords: ['vestige', 'financial analysis', 'time management', 'health tracking', 'supply chain', 'personal finance'],
  openGraph: { type: 'website', siteName: 'Vestige' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#05060a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-ink text-slate-200 font-sans antialiased">
        <CustomCursor />
        <CurtainNavigator />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
