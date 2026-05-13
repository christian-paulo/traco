'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { formatPhoneBR, isValidPhoneBR } from '@/lib/utils/phone';

type SimpleResult = { success: true } | { success: false; error: string };

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome muito curto.').max(120, 'Nome muito longo.'),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === '' ? '' : v))
    .refine((v) => v === '' || isValidPhoneBR(v), 'Telefone inválido.'),
  avatar_url: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine(
      (v) => v === null || /^https?:\/\//i.test(v),
      'URL inválida — use http(s)://...',
    ),
});

const tenantSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto.').max(80),
  whatsapp_template: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  accent_color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.')
    .optional(),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type TenantInput = z.input<typeof tenantSchema>;

export async function updateProfile(input: ProfileInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone === '' ? null : formatPhoneBR(parsed.data.phone),
      avatar_url: parsed.data.avatar_url,
    })
    .eq('id', profile.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function updateTenantSettings(input: TenantInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const parsed = tenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name,
      whatsapp_template: parsed.data.whatsapp_template,
      ...(parsed.data.accent_color ? { accent_color: parsed.data.accent_color } : {}),
    })
    .eq('id', profile.tenantId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}
