'use server';

import { z } from 'zod';

import {
  sendBookingDraftClientEmail,
  sendBookingDraftDesignerEmail,
} from '@/lib/email';
import { formatDateTimeShort } from '@/lib/format';
import { getPublicAvailableSlots } from '@/lib/queries/public-booking';
import { createAdminClient } from '@/lib/supabase/admin';
import { digitsOnly, formatPhoneBR } from '@/lib/utils/phone';

type BookingResult =
  | { success: true; draftId: string }
  | { success: false; error: string };

const bookingSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  procedure_id: z.string().uuid(),
  scheduled_start_at: z.string().min(10),
  client: z.object({
    full_name: z.string().trim().min(3, 'Nome completo é obrigatório.').max(120),
    phone: z
      .string()
      .trim()
      .min(8, 'WhatsApp inválido.')
      .refine((v) => digitsOnly(v).length >= 10, 'WhatsApp inválido.'),
    email: z
      .string()
      .trim()
      .email('Email inválido.')
      .nullable()
      .optional()
      .or(z.literal('')),
    birth_date: z.string().trim().nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    referral_source: z.string().trim().max(60).nullable().optional(),
    consent: z.literal(true, {
      message: 'Aceite o uso dos dados para confirmar o agendamento.',
    }),
  }),
});

export type BookingInput = z.input<typeof bookingSchema>;

function isoLocalToMinutesOfDay(iso: string): number {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m) return -1;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  return hh * 60 + mm;
}

function dateOnly(iso: string): string {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

export async function createPublicBookingDraft(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: studio } = await supabase
    .from('studios')
    .select('id, tenant_id, name, slug, address')
    .eq('slug', data.slug)
    .maybeSingle();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };

  const { data: prof } = await supabase
    .from('professionals')
    .select('id')
    .eq('studio_id', studio.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!prof) return { success: false, error: 'Profissional indisponível.' };

  const { data: service } = await supabase
    .from('professional_services')
    .select('duration_minutes, custom_price, procedures(name)')
    .eq('professional_id', prof.id)
    .eq('procedure_id', data.procedure_id)
    .maybeSingle();
  if (!service) {
    return { success: false, error: 'Procedimento indisponível.' };
  }

  // Re-validar slot ainda livre (race condition guard)
  const date = dateOnly(data.scheduled_start_at);
  if (!date) return { success: false, error: 'Data inválida.' };
  const requestedStart = isoLocalToMinutesOfDay(data.scheduled_start_at);
  if (requestedStart < 0) return { success: false, error: 'Horário inválido.' };

  const slots = await getPublicAvailableSlots({
    professionalId: prof.id,
    procedureId: data.procedure_id,
    date,
  });
  const stillAvailable = slots.some(
    (s) => isoLocalToMinutesOfDay(s.start) === requestedStart,
  );
  if (!stillAvailable) {
    return {
      success: false,
      error: 'Esse horário foi ocupado. Escolha outro disponível.',
    };
  }

  // Inserir booking_draft
  const phoneFormatted = formatPhoneBR(data.client.phone);
  const emailValue = data.client.email && data.client.email.length > 0 ? data.client.email : null;
  const notes = data.client.notes && data.client.notes.length > 0 ? data.client.notes : null;
  const referral =
    data.client.referral_source && data.client.referral_source.length > 0
      ? data.client.referral_source
      : null;
  const finalNotes = referral
    ? notes
      ? `${notes}\n\n[Como conheceu: ${referral}]`
      : `[Como conheceu: ${referral}]`
    : notes;

  const { data: created, error } = await supabase
    .from('booking_drafts')
    .insert({
      tenant_id: studio.tenant_id,
      studio_id: studio.id,
      professional_id: prof.id,
      procedure_id: data.procedure_id,
      scheduled_start_at: data.scheduled_start_at,
      client_full_name: data.client.full_name,
      client_phone: phoneFormatted,
      client_email: emailValue,
      client_birth_date: data.client.birth_date || null,
      client_notes: finalNotes,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !created) {
    return { success: false, error: error?.message ?? 'Erro ao registrar.' };
  }

  // Buscar designer (profile + email)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('tenant_id', studio.tenant_id)
    .limit(1)
    .maybeSingle();

  type ProcRel = { name?: string };
  const procRel = service.procedures as ProcRel | ProcRel[] | null;
  const procObj = Array.isArray(procRel) ? procRel[0] : procRel;
  const procedureName = procObj?.name ?? 'Procedimento';
  const scheduledFormatted = formatDateTimeShort(data.scheduled_start_at);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://traco.app';
  const panelUrl = `${baseUrl}/dashboard/agendamentos-pendentes`;

  // Email pra designer (não bloqueia retorno)
  if (profile?.email) {
    void sendBookingDraftDesignerEmail({
      to: profile.email,
      designerFirstName: (profile.full_name ?? '').split(' ')[0] || 'designer',
      clientName: data.client.full_name,
      clientPhone: phoneFormatted,
      clientEmail: emailValue,
      scheduledFormatted,
      procedureName,
      clientNotes: finalNotes,
      panelUrl,
    }).catch((err) => {
      console.error('[booking] erro ao enviar email designer:', err);
    });
  }

  // Email pra cliente (se preencheu)
  if (emailValue) {
    void sendBookingDraftClientEmail({
      to: emailValue,
      clientName: data.client.full_name,
      designerName: profile?.full_name ?? 'sua designer',
      studioName: studio.name,
      scheduledFormatted,
      procedureName,
    }).catch((err) => {
      console.error('[booking] erro ao enviar email cliente:', err);
    });
  }

  return { success: true, draftId: created.id };
}

const waitlistSchema = z.object({
  slug: z.string().trim().min(1),
  procedure_id: z.string().uuid().nullable().optional(),
  preferred_date: z.string().trim().min(8),
  client_full_name: z.string().trim().min(3).max(120),
  client_phone: z
    .string()
    .trim()
    .refine((v) => digitsOnly(v).length >= 10, 'WhatsApp inválido.'),
  client_email: z
    .string()
    .trim()
    .email('Email inválido.')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type WaitlistInput = z.input<typeof waitlistSchema>;

export async function createPublicWaitlistEntry(
  input: WaitlistInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: studio } = await supabase
    .from('studios')
    .select('id, tenant_id, waitlist_enabled')
    .eq('slug', data.slug)
    .maybeSingle();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };
  if (!studio.waitlist_enabled) {
    return { success: false, error: 'Lista de espera desativada.' };
  }

  const { data: prof } = await supabase
    .from('professionals')
    .select('id')
    .eq('studio_id', studio.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const emailValue =
    data.client_email && data.client_email.length > 0 ? data.client_email : null;

  const { error } = await supabase.from('waitlist_entries').insert({
    tenant_id: studio.tenant_id,
    studio_id: studio.id,
    professional_id: prof?.id ?? null,
    procedure_id: data.procedure_id ?? null,
    preferred_date: data.preferred_date,
    client_full_name: data.client_full_name,
    client_phone: formatPhoneBR(data.client_phone),
    client_email: emailValue,
    status: 'pending',
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refreshAvailableSlots(args: {
  slug: string;
  procedureId: string;
  date: string;
}): Promise<{ slots: Array<{ start: string; end: string }> }> {
  const supabase = createAdminClient();
  const { data: studio } = await supabase
    .from('studios')
    .select('id')
    .eq('slug', args.slug)
    .maybeSingle();
  if (!studio) return { slots: [] };
  const { data: prof } = await supabase
    .from('professionals')
    .select('id')
    .eq('studio_id', studio.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (!prof) return { slots: [] };
  const slots = await getPublicAvailableSlots({
    professionalId: prof.id,
    procedureId: args.procedureId,
    date: args.date,
  });
  return { slots };
}
