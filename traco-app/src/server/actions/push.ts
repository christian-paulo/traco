'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

type SubscribeInput = {
  endpoint: string;
  p256dh: string;
  authSecret: string;
  deviceLabel?: string | null;
};

export async function subscribeToPush(input: SubscribeInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      tenant_id: profile.tenantId,
      user_id: profile.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth_secret: input.authSecret,
      device_label: input.deviceLabel ?? null,
      enabled: true,
    },
    { onConflict: 'user_id,endpoint' },
  );
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function unsubscribeFromPush(endpoint: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', profile.id)
    .eq('endpoint', endpoint);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}
