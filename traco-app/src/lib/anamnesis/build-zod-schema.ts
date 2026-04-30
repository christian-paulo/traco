import { z } from 'zod';

import type { TemplateField } from './template-types';
import { isValidPhoneBR } from '@/lib/utils/phone';
import { validateCPF } from '@/lib/validations/cpf';

/**
 * Constrói schema Zod dinâmico a partir do template da ficha.
 * Ignora type='section' (separadores visuais).
 */
export function buildAnamnesisSchema(fields: TemplateField[]): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.type === 'section') continue;
    shape[field.id] = buildFieldSchema(field);
  }

  return z.object(shape);
}

function buildFieldSchema(field: TemplateField): z.ZodTypeAny {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const base = z.string().trim();
      if (field.required) return base.min(1, 'Campo obrigatório.');
      return base.optional();
    }
    case 'date': {
      const base = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
      return field.required ? base : base.or(z.literal('')).optional();
    }
    case 'phone': {
      const base = z.string().refine((v) => isValidPhoneBR(v), 'Telefone inválido.');
      return field.required ? base : base.or(z.literal('')).optional();
    }
    case 'cpf': {
      const base = z.string().refine((v) => validateCPF(v), 'CPF inválido.');
      return field.required ? base : base.or(z.literal('')).optional();
    }
    case 'boolean': {
      if (field.required) {
        return z.boolean();
      }
      return z.boolean().optional();
    }
    case 'boolean_with_text': {
      const schema = z
        .object({
          value: z.boolean(),
          text: z.string().trim().default(''),
        })
        .refine(
          (data) => !data.value || data.text.length > 0,
          'Detalhe obrigatório quando "Sim".',
        );
      return field.required
        ? schema.refine(
            (data) => data.value !== undefined,
            'Selecione uma opção.',
          )
        : schema.optional();
    }
    case 'select': {
      const options = field.options ?? [];
      if (options.length === 0) return z.string().optional();
      const base = z.enum(options as [string, ...string[]]);
      return field.required ? base : base.or(z.literal('')).optional();
    }
    case 'term_acceptance': {
      return z
        .boolean()
        .refine((v) => v === true, 'É necessário aceitar o termo.');
    }
    default:
      return z.unknown();
  }
}
