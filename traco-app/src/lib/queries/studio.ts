import 'server-only';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import { getCurrentProfile } from './profile';

export type StudioRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  address: string | null;
  bio: string | null;
  cover_image_url: string | null;
  is_solo: boolean;
  waitlist_enabled: boolean;
  booking_buffer_minutes: number;
  timezone: string;
};

export type ProfessionalRow = {
  id: string;
  tenant_id: string;
  studio_id: string;
  display_name: string;
  role_title: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
};

export type WorkingHourRow = {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type TimeOffRow = {
  id: string;
  professional_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  is_recurring: boolean;
};

export type ProfessionalServiceRow = {
  id: string;
  professional_id: string;
  procedure_id: string;
  duration_minutes: number;
  custom_price: number | null;
  is_active: boolean;
};

export const getCurrentStudio = cache(async (): Promise<StudioRow | null> => {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('studios')
    .select('*')
    .eq('tenant_id', profile.tenantId)
    .maybeSingle();
  return (data as StudioRow | null) ?? null;
});

export const getCurrentProfessional = cache(async (): Promise<ProfessionalRow | null> => {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('tenant_id', profile.tenantId)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as ProfessionalRow | null) ?? null;
});

export async function listWorkingHours(professionalId: string): Promise<WorkingHourRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('professional_id', professionalId)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkingHourRow[];
}

export async function listTimeOff(professionalId: string): Promise<TimeOffRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('time_off')
    .select('*')
    .eq('professional_id', professionalId)
    .order('start_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TimeOffRow[];
}

export async function listProfessionalServices(
  professionalId: string,
): Promise<ProfessionalServiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professional_services')
    .select('*')
    .eq('professional_id', professionalId);
  if (error) throw error;
  return (data ?? []) as ProfessionalServiceRow[];
}
