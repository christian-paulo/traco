'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { appointmentSchema, type AppointmentInput } from '@/lib/validations/appointment';
import { createAppointment, updateAppointment } from '@/server/actions/appointments';

import { ClientCombobox, type ClientLite } from './client-combobox';
import { ProcedureRadioCards } from './procedure-radio-cards';

export type EditableAppointment = {
  id: string;
  client_id: string;
  procedure_id: string;
  performed_at: string;
  price: number;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: EditableAppointment | null;
  clients: ClientLite[];
  procedures: ProcedureRow[];
  defaultClientId?: string;
  onSaved?: (id: string) => void;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function nowLocalInput(): string {
  return toLocalInput(new Date().toISOString());
}

function buildDefaults(
  appointment: EditableAppointment | null | undefined,
  defaultClientId: string | undefined,
): AppointmentInput {
  if (appointment) {
    return {
      client_id: appointment.client_id,
      procedure_id: appointment.procedure_id,
      performed_at: toLocalInput(appointment.performed_at),
      price: appointment.price,
      notes: appointment.notes ?? '',
    };
  }
  return {
    client_id: defaultClientId ?? '',
    procedure_id: '',
    performed_at: nowLocalInput(),
    price: 0,
    notes: '',
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  clients,
  procedures,
  defaultClientId,
  onSaved,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(appointment);
  const lockedClient = Boolean(defaultClientId && !appointment);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: buildDefaults(appointment, defaultClientId),
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults(appointment, defaultClientId));
  }, [open, appointment, defaultClientId, form]);

  function onSubmit(values: AppointmentInput) {
    startTransition(async () => {
      if (isEdit && appointment) {
        const result = await updateAppointment(appointment.id, values);
        if (result.success) {
          toast.success('Atendimento atualizado.');
          onOpenChange(false);
          onSaved?.(appointment.id);
        } else {
          toast.error(result.error || 'Não foi possível salvar.');
        }
      } else {
        const result = await createAppointment(values);
        if (result.success) {
          toast.success('Atendimento registrado.');
          onOpenChange(false);
          onSaved?.(result.data.id);
        } else {
          toast.error(result.error || 'Não foi possível salvar.');
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium tracking-tight">
            {isEdit ? 'Editar atendimento' : 'Novo atendimento'}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase tracking-[0.3em]">
            {isEdit ? 'Atualize os dados' : 'Registre um atendimento realizado'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    <ClientCombobox
                      clients={clients}
                      value={field.value || null}
                      onChange={field.onChange}
                      disabled={isPending || lockedClient}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="procedure_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento *</FormLabel>
                  <FormControl>
                    <ProcedureRadioCards
                      procedures={procedures}
                      value={field.value || null}
                      onChange={(p) => {
                        field.onChange(p.id);
                        const currentPrice = form.getValues('price');
                        if (!isEdit || !currentPrice) {
                          form.setValue('price', p.default_price, { shouldValidate: true });
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="performed_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quando foi realizado? *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor cobrado *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={isPending}
                          value={Number.isFinite(field.value) ? field.value : ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === '' ? 0 : Number(v));
                          }}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Detalhes do atendimento (opcional)"
                      disabled={isPending}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="premium" size="xl" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEdit ? (
                  'Salvar alterações'
                ) : (
                  'Registrar atendimento'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
