import { z } from 'zod';

export const MESSAGE_TEMPLATE_CATEGORIES = [
  'reminder',
  'aftercare',
  'recovery',
  'admin',
] as const;

export const MESSAGE_TEMPLATE_CATEGORY_LABELS: Record<
  (typeof MESSAGE_TEMPLATE_CATEGORIES)[number],
  string
> = {
  reminder: 'Lembretes',
  aftercare: 'Pós-cuidado',
  recovery: 'Recuperação',
  admin: 'Avisos',
};

export const MESSAGE_TEMPLATE_VARIABLES = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'procedimento', label: 'Procedimento' },
  { key: 'data', label: 'Data' },
  { key: 'hora', label: 'Hora' },
  { key: 'valor', label: 'Valor' },
  { key: 'dias', label: 'Dias' },
  { key: 'designer', label: 'Designer' },
  { key: 'studio', label: 'Studio' },
  { key: 'endereco', label: 'Endereço' },
] as const;

export const messageTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome precisa ter ao menos 2 letras.')
    .max(80, 'Nome muito longo.'),
  category: z.enum(MESSAGE_TEMPLATE_CATEGORIES),
  body: z
    .string()
    .trim()
    .min(5, 'A mensagem precisa ter ao menos 5 letras.')
    .max(1500, 'Mensagem muito longa.'),
  is_default: z.boolean().optional().default(false),
});

export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
export type MessageTemplateCategory = (typeof MESSAGE_TEMPLATE_CATEGORIES)[number];
