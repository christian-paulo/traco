import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'products',
  'rent',
  'marketing',
  'transport',
  'equipment',
  'tax',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  products: 'Produtos',
  rent: 'Aluguel',
  marketing: 'Marketing',
  transport: 'Transporte',
  equipment: 'Equipamentos',
  tax: 'Impostos / taxas',
  other: 'Outro',
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  products: '#C9A961',
  rent: '#0A0A0A',
  marketing: '#D97706',
  transport: '#2563EB',
  equipment: '#7C3AED',
  tax: '#DC2626',
  other: '#6B7280',
};

export const RECURRENCE_TYPES = ['weekly', 'monthly', 'yearly'] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export const recurrencePatternSchema = z.object({
  type: z.enum(RECURRENCE_TYPES),
  day: z.number().int().min(1).max(31).optional(),
});

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(2, 'Descrição obrigatória.').max(180),
  amount: z.number().nonnegative('Valor inválido.'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: recurrencePatternSchema.nullable().optional(),
  receipt_url: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().trim().max(500).nullable().optional(),
  linked_product_id: z.string().uuid().nullable().optional(),
});

export type ExpenseInput = z.input<typeof expenseSchema>;
export type ExpenseValues = z.output<typeof expenseSchema>;
