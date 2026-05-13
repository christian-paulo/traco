import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function DashboardHomeLoading() {
  return <PageSkeleton title="Olá…" subtitle="Carregando seu resumo" blocks={4} />;
}
