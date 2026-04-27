import type { Metadata } from 'next';

import { PlaceholderSection } from '@/components/shared/placeholder-section';

export const metadata: Metadata = {
  title: 'Financeiro | Traço',
};

export default function FinanceiroPage() {
  return (
    <PlaceholderSection
      title="Financeiro"
      description="Faturamento por procedimento e visão geral da receita."
    />
  );
}
