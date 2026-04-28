import type { Metadata } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Traço — Sistema de gestão para designers de brow',
    template: '%s | Traço',
  },
  description: 'O sistema interno do studio Master Brow Lamination.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        {children}
        <Toaster
          richColors
          closeButton
          position="top-right"
          duration={4000}
          toastOptions={{
            classNames: {
              toast:
                'border border-cream-dark bg-card text-foreground shadow-lg rounded-xl font-sans',
              title: 'font-medium text-sm',
              description: 'text-muted-foreground text-xs',
              closeButton: 'border-cream-dark',
            },
          }}
        />
      </body>
    </html>
  );
}
