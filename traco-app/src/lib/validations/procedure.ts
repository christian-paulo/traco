import { z } from 'zod';

export const procedureSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto.').max(80, 'Nome muito longo.'),
  default_price: z.number().nonnegative('Valor não pode ser negativo.'),
  default_return_days: z
    .number()
    .int('Use número inteiro.')
    .min(1, 'Mínimo 1 dia.')
    .max(365, 'Máximo 365 dias.'),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  is_active: z.boolean().optional(),
});

export type ProcedureInput = z.input<typeof procedureSchema>;
export type ProcedureValues = z.output<typeof procedureSchema>;
