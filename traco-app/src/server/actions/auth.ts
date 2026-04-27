'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu email.')
  .email('Email inválido.');

type ActionResult = { success: true } | { success: false; error: string };

export async function signInWithMagicLink(email: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Email inválido.' };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    headerList.get('origin') ??
    (headerList.get('host') ? `https://${headerList.get('host')}` : null) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
