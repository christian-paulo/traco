import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ClientDetailView } from '@/components/clients/client-detail-view';
import { getClientById } from '@/lib/queries/clients';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientById(id);
  return {
    title: client ? `${client.full_name} | Clientes` : 'Cliente | Traço',
  };
}

export default async function ClientDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        <Link href="/dashboard/clientes" className="transition-colors hover:text-[var(--gold)]">
          Clientes
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{client.full_name}</span>
      </nav>

      <ClientDetailView client={client} />
    </div>
  );
}
