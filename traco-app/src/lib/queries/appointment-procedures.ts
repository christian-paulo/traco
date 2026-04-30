import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type ProductUsed = {
  brand: string;
  product: string;
  lot?: string;
  expiry?: string;
  step_time?: number;
  category?: string;
};

export type StepTime = {
  step_name: string;
  minutes: number;
};

export type AppointmentProcedureRow = {
  id: string;
  appointment_id: string;
  products_used: ProductUsed[];
  step_times: StepTime[];
  technique: string | null;
  technical_notes: string | null;
};

export type FavoriteProductRow = {
  id: string;
  brand: string;
  product: string;
  category: string | null;
  default_step_time: number | null;
  use_count: number;
};

export async function getAppointmentProcedure(
  appointmentId: string,
): Promise<AppointmentProcedureRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointment_procedures')
    .select('id, appointment_id, products_used, step_times, technique, technical_notes')
    .eq('appointment_id', appointmentId)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    id: data.id,
    appointment_id: data.appointment_id,
    products_used: (data.products_used ?? []) as unknown as ProductUsed[],
    step_times: (data.step_times ?? []) as unknown as StepTime[],
    technique: data.technique,
    technical_notes: data.technical_notes,
  };
}

export async function listFavoriteProducts(): Promise<FavoriteProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('favorite_products')
    .select('id, brand, product, category, default_step_time, use_count')
    .order('use_count', { ascending: false });
  if (error) return [];
  return (data ?? []) as FavoriteProductRow[];
}
