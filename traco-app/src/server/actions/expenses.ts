'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import {
  expenseSchema,
  type ExpenseCategory,
  type ExpenseInput,
} from '@/lib/validations/expense';
import type { Json } from '@/types/database';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };
type UploadResult =
  | { success: true; data: { url: string; path: string } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function createExpense(input: ExpenseInput): Promise<CreateResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      tenant_id: profile.tenantId,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date,
      is_recurring: parsed.data.is_recurring,
      recurrence_pattern: parsed.data.is_recurring
        ? ((parsed.data.recurrence_pattern ?? null) as Json)
        : null,
      receipt_url:
        parsed.data.receipt_url && parsed.data.receipt_url.length > 0
          ? parsed.data.receipt_url
          : null,
      notes: parsed.data.notes ?? null,
      linked_product_id: parsed.data.linked_product_id ?? null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao registrar despesa.' };
  }

  revalidatePath('/dashboard/despesas');
  revalidatePath('/dashboard/financeiro');
  return { success: true, data: { id: data.id } };
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<SimpleResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('expenses')
    .update({
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date,
      is_recurring: parsed.data.is_recurring,
      recurrence_pattern: parsed.data.is_recurring
        ? ((parsed.data.recurrence_pattern ?? null) as Json)
        : null,
      receipt_url:
        parsed.data.receipt_url && parsed.data.receipt_url.length > 0
          ? parsed.data.receipt_url
          : null,
      notes: parsed.data.notes ?? null,
      linked_product_id: parsed.data.linked_product_id ?? null,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/despesas');
  revalidatePath('/dashboard/financeiro');
  return { success: true };
}

export async function deleteExpense(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/despesas');
  revalidatePath('/dashboard/financeiro');
  return { success: true };
}

export async function uploadReceipt(formData: FormData): Promise<UploadResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'Arquivo inválido.' };
  }
  if (file.size === 0) {
    return { success: false, error: 'Arquivo vazio.' };
  }
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return { success: false, error: 'Arquivo maior que 5MB.' };
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Formato não suportado (use JPG, PNG, WebP ou PDF).' };
  }

  const supabase = await createClient();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${profile.tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('expense-receipts')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from('expense-receipts')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedError || !signed?.signedUrl) {
    return { success: false, error: signedError?.message ?? 'Erro ao gerar URL.' };
  }

  return { success: true, data: { url: signed.signedUrl, path } };
}

export type ListExpensesArgs = {
  from?: string;
  to?: string;
  category?: ExpenseCategory | 'all';
  search?: string;
};
