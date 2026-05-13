import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function ClientesLoading() {
  return <PageSkeleton title="Clientes" subtitle="Gerencie suas clientes" blocks={3} />;
}
