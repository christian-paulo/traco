import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

/**
 * Cliente Supabase com service_role key.
 * Bypassa RLS — use APENAS em rotas públicas (sem auth) ou ações privilegiadas
 * que precisam ler/escrever dados além do tenant atual.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE service role não configurada.');
  }
  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
