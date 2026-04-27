'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatCurrency,
  formatDate,
  formatDateTimeShort,
  getInitials,
} from '@/lib/format';
import type { AppointmentRow } from '@/lib/queries/appointments';
import type { ProcedureRow } from '@/lib/queries/procedures';

import {
  AppointmentFormDialog,
  type EditableAppointment,
} from './appointment-form-dialog';
import type { ClientLite } from './client-combobox';
import { DeleteAppointmentDialog } from './delete-appointment-dialog';

type Props = {
  appointments: AppointmentRow[];
  clients: ClientLite[];
  procedures: ProcedureRow[];
};

export function AppointmentsTable({ appointments, clients, procedures }: Props) {
  const [editing, setEditing] = useState<EditableAppointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Procedimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Próximo retorno</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((apt) => {
            const overdue =
              apt.return_due_date !== null && apt.return_due_date < todayIso;
            return (
              <TableRow key={apt.id} className="hover:bg-cream-dark/40 transition-colors">
                <TableCell className="text-sm text-foreground">
                  {formatDateTimeShort(apt.performed_at)}
                </TableCell>
                <TableCell>
                  {apt.client ? (
                    <Link
                      href={`/dashboard/clientes/${apt.client.id}`}
                      className="flex items-center gap-2 hover:text-[var(--gold)]"
                    >
                      <Avatar className="size-7 border border-[var(--gold)]/30">
                        <AvatarFallback className="bg-cream text-[var(--gold)] text-[11px]">
                          {getInitials(apt.client.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {apt.client.full_name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {apt.procedure ? (
                    <Badge
                      variant="outline"
                      className="border-transparent text-foreground"
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
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatCurrency(apt.price)}
                </TableCell>
                <TableCell>
                  {apt.return_due_date ? (
                    <span
                      className={
                        overdue
                          ? 'text-destructive text-sm font-medium'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {formatDate(apt.return_due_date, 'short')}
                      {overdue ? <span className="ml-1.5 text-xs">· vencido</span> : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ações"
                          className="size-8"
                        >
                          <MoreHorizontal className="size-4" />
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
    </>
  );
}
