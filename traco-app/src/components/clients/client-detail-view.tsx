'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AnamnesisSection } from '@/components/anamnesis/anamnesis-section';
import {
  ClientAppointmentsSection,
} from '@/components/appointments/client-appointments-section';
import type { ClientLite } from '@/components/appointments/client-combobox';
import { PhotosSection } from '@/components/photos/photos-section';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getInitials } from '@/lib/format';
import type { AnamnesisFormRow } from '@/lib/queries/anamnesis';
import type { AppointmentRow } from '@/lib/queries/appointments';
import type { ClientDetail } from '@/lib/queries/clients';
import type { PhotoWithUrl } from '@/lib/queries/photos';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { PHOTOTYPE_LABELS, type Phototype } from '@/lib/validations/client';

import { ClientFormDialog, type EditableClient } from './client-form-dialog';
import { DeleteClientDialog } from './delete-client-dialog';

type Props = {
  client: ClientDetail;
  appointments: AppointmentRow[];
  clients: ClientLite[];
  procedures: ProcedureRow[];
  anamnesisForms: AnamnesisFormRow[];
  photos: PhotoWithUrl[];
};

function phototypeLabel(value: string | null) {
  if (!value) return '—';
  if ((value as Phototype) in PHOTOTYPE_LABELS) {
    return PHOTOTYPE_LABELS[value as Phototype];
  }
  return value;
}

export function ClientDetailView({
  client,
  appointments,
  clients,
  procedures,
  anamnesisForms,
  photos,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const editable: EditableClient = {
    id: client.id,
    full_name: client.full_name,
    phone: client.phone,
    email: client.email,
    birth_date: client.birth_date,
    skin_phototype: client.skin_phototype,
    notes: client.notes,
    tags: client.tags ?? [],
  };

  return (
    <>
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-5">
          <Avatar className="size-20 border-2 border-[var(--gold)]/40">
            <AvatarFallback className="bg-cream text-[var(--gold)] text-2xl font-medium">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="h-px w-8 bg-[var(--gold)]" />
            <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              {client.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {client.phone}
              {client.email ? <span> · {client.email}</span> : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline-gold" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </header>

      <Tabs defaultValue="dados" className="mt-2">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="fichas">Fichas</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
              <CardHeader className="px-6 pb-2">
                <CardTitle className="font-serif text-lg font-medium">
                  Informações pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 px-6 sm:grid-cols-2">
                <Field label="Nome completo" value={client.full_name} />
                <Field
                  label="Nascimento"
                  value={client.birth_date ? formatDate(client.birth_date, 'long') : '—'}
                />
                <Field label="Fototipo" value={phototypeLabel(client.skin_phototype)} />
              </CardContent>
            </Card>

            <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
              <CardHeader className="px-6 pb-2">
                <CardTitle className="font-serif text-lg font-medium">Contato</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 px-6">
                <Field label="WhatsApp" value={client.phone} />
                <Field label="Email" value={client.email ?? '—'} />
              </CardContent>
            </Card>

            <Card
              variant="premium"
              className="bg-card border-0 ring-1 ring-[var(--border)] py-6 lg:col-span-2"
            >
              <CardHeader className="px-6 pb-2">
                <CardTitle className="font-serif text-lg font-medium">Tags</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {(client.tags ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem tags.</p>
                )}
              </CardContent>
            </Card>

            <Card
              variant="premium"
              className="bg-card border-0 ring-1 ring-[var(--border)] py-6 lg:col-span-2"
            >
              <CardHeader className="px-6 pb-2">
                <CardTitle className="font-serif text-lg font-medium">Observações</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {client.notes ? (
                  <p className="font-serif text-base italic text-foreground/90 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma observação.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="atendimentos" className="mt-6">
          <ClientAppointmentsSection
            clientId={client.id}
            clientName={client.full_name}
            appointments={appointments}
            clients={clients}
            procedures={procedures}
          />
        </TabsContent>

        <TabsContent value="fichas" className="mt-6">
          <AnamnesisSection
            client={{ id: client.id, full_name: client.full_name, email: client.email }}
            forms={anamnesisForms}
          />
        </TabsContent>

        <TabsContent value="fotos" className="mt-6">
          <PhotosSection clientId={client.id} photos={photos} procedures={procedures} />
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={editable} />
      <DeleteClientDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clientId={client.id}
        clientName={client.full_name}
        onDeleted={() => router.push('/dashboard/clientes')}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
