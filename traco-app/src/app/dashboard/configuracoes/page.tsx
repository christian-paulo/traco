import type { Metadata } from 'next';

import { PlaceholderSection } from '@/components/shared/placeholder-section';

export const metadata: Metadata = {
  title: 'Configurações | Traço',
};

export default function ConfiguracoesPage() {
  return (
    <PlaceholderSection
      title="Configurações"
      description="Ajuste seu perfil, procedimentos padrão e templates de anamnese."
    />
  );
}
