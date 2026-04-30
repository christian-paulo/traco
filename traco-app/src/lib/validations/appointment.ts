import { z } from 'zod';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const appointmentSchema = z.object({
  client_id: z.string().uuid('Selecione uma cliente.'),
  procedure_id: z.string().uuid('Selecione um procedimento.'),
  performed_at: z
    .string()
    .min(1, 'Informe a data e hora.')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Data inválida.')
    .refine(
      (v) => new Date(v).getTime() <= Date.now() + ONE_HOUR_MS,
      'Não pode ser no futuro além de 1 hora.',
    ),
  price: z.number().nonnegative('Valor não pode ser negativo.'),
  notes: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
});

export type AppointmentInput = z.input<typeof appointmentSchema>;
export type AppointmentValues = z.output<typeof appointmentSchema>;

export const scheduledAppointmentSchema = z.object({
  client_id: z.string().uuid('Selecione uma cliente.'),
  procedure_id: z.string().uuid('Selecione um procedimento.'),
  scheduled_start_at: z
    .string()
    .min(1, 'Informe a data e hora.')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Data inválida.'),
  scheduled_end_at: z
    .string()
    .min(1, 'Informe a duração.')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Data inválida.'),
  price: z.number().nonnegative('Valor não pode ser negativo.'),
  notes: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  notes_internal: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
});

export type ScheduledAppointmentInput = z.input<typeof scheduledAppointmentSchema>;
