import { z } from 'zod';

import { isValidPhoneBR } from '@/lib/utils/phone';

export const PHOTOTYPES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
export type Phototype = (typeof PHOTOTYPES)[number];

export const PHOTOTYPE_LABELS: Record<Phototype, string> = {
  I: 'I — Branca extremamente clara',
  II: 'II — Branca clara',
  III: 'III — Branca morena',
  IV: 'IV — Morena clara',
  V: 'V — Morena escura',
  VI: 'VI — Negra',
};

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const clientFormSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome muito curto.').max(120, 'Nome muito longo.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Informe o WhatsApp.')
    .refine(isValidPhoneBR, 'Telefone inválido. Use DDD + número.'),
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine(
      (v) => v === null || z.string().email().safeParse(v).success,
      'Email inválido.',
    ),
  birth_date: optionalString,
  skin_phototype: z.enum(PHOTOTYPES).nullable().optional(),
  notes: optionalString,
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;
