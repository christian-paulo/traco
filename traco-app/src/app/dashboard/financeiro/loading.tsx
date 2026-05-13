import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function FinanceiroLoading() {
  return (
    <PageSkeleton
      title="Financeiro"
      subtitle="Receita, despesas e metas"
      blocks={5}
    />
  );
}
