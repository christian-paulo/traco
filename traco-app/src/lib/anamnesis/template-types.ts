/**
 * Tipos do template de ficha v2.
 * Cada item do array `fields` é uma seção visual ou um campo de input.
 */

export type FieldType =
  | 'section'
  | 'text'
  | 'textarea'
  | 'date'
  | 'phone'
  | 'cpf'
  | 'boolean'
  | 'boolean_with_text'
  | 'select'
  | 'term_acceptance';

export type TemplateField = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  // Section-specific
  subtitle?: string;
  // Text/textarea-specific
  rows?: number;
  prefilled_from?: 'client.full_name' | 'client.phone' | 'client.email' | 'client.birth_date';
  // Select
  options?: string[];
  help?: string;
  // Boolean with text
  text_label?: string;
  // Term acceptance
  term_text?: string;
  // Validation hint
  validation?: 'cpf' | 'phone';
};

export type FieldValue =
  | string
  | boolean
  | { value: boolean; text: string }
  | undefined;

export type AnamnesisAnswers = Record<string, FieldValue>;

export const FIELD_KEYS = {
  fullName: 'f_name',
  birth: 'f_birth',
  phone: 'f_phone',
  cpf: 'f_cpf',
} as const;
