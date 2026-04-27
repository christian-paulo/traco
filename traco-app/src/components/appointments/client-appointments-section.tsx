'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate, formatDateTimeShort } from '@/lib/format';
import type { AppointmentRow } from '@/lib/queries/appointments';
import type { ProcedureRow } from '@/lib/queries/procedures';

import {
  AppointmentFormDialog,
  type EditableAppointment,
} from './appointment-form-dialog';
import type { ClientLite } from './client-combobox';
import { DeleteAppointmentDialog } from './delete-appointment-dialog';

type Props = {
  clientId: string;
  clientName: string;
  appointments: AppointmentRow[];
  clients: ClientLite[];
  procedures: ProcedureRow[];
};

export function ClientAppointmentsSection({
  clientId,
  clientName,
  appointments,
  clients,
  procedures,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<EditableAppointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {appointments.length} {appointments.length === 1 ? 'atendimento' : 'atendimentos'}
        </p>
        <Button
          variant="outline-gold"
          onClick={() => setCreateOpen(true)}
          disabled={procedures.length === 0}
        >
          <Plus className="size-4" />
          Registrar atendimento
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="text-center">
            <p className="font-serif text-lg italic text-muted-foreground">
              Nenhum atendimento registrado para esta cliente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((apt) => {
            const overdue = apt.return_due_date !== null && apt.return_due_date < todayIso;
            return (
              <Card
                key={apt.id}
                variant="premium"
                className="bg-card border-0 ring-1 ring-[var(--border)] py-5"
              >
                <CardContent className="flex flex-col gap-3 px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <p className="font-serif text-lg font-medium text-foreground">
                        {formatDateTimeShort(apt.performed_at)}
                      </p>
                      {apt.procedure ? (
                        <Badge
                          variant="outline"
                          className="self-start border-transparent text-foreground"
                          style={{
                            backgroundColor: `${apt.procedure.color}1F`,
                            borderColor: `${apt.procedure.color}66`,
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: apt.procedure.color }}
                            aria-hidden
                          />
                          {apt.procedure.name}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-serif text-2xl font-medium text-foreground">
                        {formatCurrency(apt.price)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ações"
                              className="size-8"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditing({
                                id: apt.id,
                                client_id: apt.client_id,
                                procedure_id: apt.procedure_id,
                                performed_at: apt.performed_at,
                                price: apt.price,
                                notes: apt.notes,
                              })
                            }
                          >
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingId(apt.id)}
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {apt.return_due_date ? (
                    <p
                      className={
                        overdue
                          ? 'text-destructive text-xs font-medium uppercase tracking-[0.18em]'
                          : 'text-xs uppercase tracking-[0.18em] text-muted-foreground'
                      }
                    >
                      Próximo retorno previsto: {formatDate(apt.return_due_date, 'short')}
                      {overdue ? ' · vencido' : ''}
                    </p>
                  ) : null}
                  {apt.notes ? (
                    <p className="font-serif text-base italic text-foreground/80">
                      {apt.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AppointmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        procedures={procedures}
        defaultClientId={clientId}
      />
      <AppointmentFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        appointment={editing}
        clients={clients}
        procedures={procedures}
      />
      <DeleteAppointmentDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        appointmentId={deletingId}
      />
      <span className="sr-only">{clientName}</span>
    </div>
  );
}
