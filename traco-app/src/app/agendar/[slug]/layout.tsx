import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agendar · Traço',
  robots: { index: false, follow: false },
};

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-cream min-h-dvh">{children}</div>;
}
