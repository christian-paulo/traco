import type { Metadata } from 'next';

import { PlaceholderSection } from '@/components/shared/placeholder-section';

export const metadata: Metadata = {
  title: 'Atendimentos | Traço',
};

export default function AtendimentosPage() {
  return (
    <PlaceholderSection
      title="Atendimentos"
      description="Registre cada procedimento e acompanhe os retornos."
    />
  );
}
