import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bem-vinda ao Traço',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {children}
    </div>
  );
}
