import type { Metadata } from 'next';

import { PlaceholderSection } from '@/components/shared/placeholder-section';

export const metadata: Metadata = {
  title: 'Clientes | Traço',
};

export default function ClientesPage() {
  return (
    <PlaceholderSection
      title="Clientes"
      description="Cadastre, edite e acompanhe o histórico das suas clientes."
    />
  );
}
