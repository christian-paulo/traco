import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function PerformanceLoading() {
  return (
    <PageSkeleton
      title="Performance"
      subtitle="Receita, despesas e esforço no período"
      blocks={3}
    />
  );
}
