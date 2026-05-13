import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function AgendaLoading() {
  return (
    <PageSkeleton
      title="Agenda"
      subtitle="Calendário do dia e histórico de atendimentos"
      blocks={3}
    />
  );
}
