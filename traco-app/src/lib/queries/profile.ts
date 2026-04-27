import 'server-only';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export type CurrentProfile = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, tenant_id, email, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
  };
});
