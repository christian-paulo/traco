import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ClientDetailView } from '@/components/clients/client-detail-view';
import { listAnamnesisFormsByClient } from '@/lib/queries/anamnesis';
import { getAppointmentsByClientId } from '@/lib/queries/appointments';
import { getClientById, listClients } from '@/lib/queries/clients';
import { listPhotosByClient } from '@/lib/queries/photos';
import { listProcedures } from '@/lib/queries/procedures';

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

  const [appointments, { rows: clientsRows }, procedures, anamnesisForms, photos] =
    await Promise.all([
      getAppointmentsByClientId(id),
      listClients({}),
      listProcedures(false),
      listAnamnesisFormsByClient(id),
      listPhotosByClient(id),
    ]);

  const clients = clientsRows.map((c) => ({ id: c.id, full_name: c.full_name, phone: c.phone }));

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

      <ClientDetailView
        client={client}
        appointments={appointments}
        clients={clients}
        procedures={procedures}
        anamnesisForms={anamnesisForms}
        photos={photos}
      />
    </div>
  );
}
