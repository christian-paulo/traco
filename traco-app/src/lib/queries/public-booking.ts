import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type PublicStudio = {
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
  rating: number;
  reviews_count: number;
};

export type PublicProfessional = {
  id: string;
  display_name: string;
  role_title: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export type PublicService = {
  id: string;
  procedure_id: string;
  duration_minutes: number;
  custom_price: number | null;
  procedure: {
    id: string;
    name: string;
    color: string;
    default_price: number;
    default_return_days: number;
  };
};

export type PublicWorkingHour = {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type PublicTimeOff = {
  id: string;
  professional_id: string;
  start_at: string;
  end_at: string;
};

export type PublicBookingPayload = {
  studio: PublicStudio;
  professional: PublicProfessional;
  services: PublicService[];
  workingHours: PublicWorkingHour[];
  timeOff: PublicTimeOff[];
  designer: { full_name: string; phone: string | null };
};

export async function getPublicBookingPayload(slug: string): Promise<PublicBookingPayload | null> {
  const supabase = createAdminClient();

  const { data: studio } = await supabase
    .from('studios')
    .select(
      'id, tenant_id, name, slug, address, bio, cover_image_url, is_solo, waitlist_enabled, booking_buffer_minutes, rating, reviews_count',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!studio) return null;

  const { data: prof } = await supabase
    .from('professionals')
    .select('id, display_name, role_title, avatar_url, bio')
    .eq('studio_id', studio.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!prof) return null;

  const [{ data: services }, { data: hours }, { data: timeOff }, { data: profile }] =
    await Promise.all([
      supabase
        .from('professional_services')
        .select(
          'id, procedure_id, duration_minutes, custom_price, procedures(id, name, color, default_price, default_return_days, is_active)',
        )
        .eq('professional_id', prof.id)
        .eq('is_active', true),
      supabase
        .from('working_hours')
        .select('id, professional_id, day_of_week, start_time, end_time')
        .eq('professional_id', prof.id)
        .eq('is_active', true),
      supabase
        .from('time_off')
        .select('id, professional_id, start_at, end_at')
        .eq('professional_id', prof.id)
        .gte('end_at', new Date().toISOString()),
      supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('tenant_id', studio.tenant_id)
        .limit(1)
        .maybeSingle(),
    ]);

  type RawProcedure = {
    id: string;
    name: string;
    color: string;
    default_price: number;
    default_return_days: number;
    is_active: boolean;
  };
  type RawService = {
    id: string;
    procedure_id: string;
    duration_minutes: number;
    custom_price: number | null;
    procedures: RawProcedure | RawProcedure[] | null;
  };
  const list: PublicService[] = ((services ?? []) as unknown as RawService[])
    .map((row) => {
      const proc = Array.isArray(row.procedures) ? row.procedures[0] : row.procedures;
      if (!proc || !proc.is_active) return null;
      return {
        id: row.id,
        procedure_id: row.procedure_id,
        duration_minutes: row.duration_minutes,
        custom_price: row.custom_price,
        procedure: {
          id: proc.id,
          name: proc.name,
          color: proc.color,
          default_price: Number(proc.default_price ?? 0),
          default_return_days: proc.default_return_days,
        },
      } satisfies PublicService;
    })
    .filter((v): v is PublicService => v !== null);

  return {
    studio: {
      id: studio.id,
      tenant_id: studio.tenant_id,
      name: studio.name,
      slug: studio.slug,
      address: studio.address,
      bio: studio.bio,
      cover_image_url: studio.cover_image_url,
      is_solo: studio.is_solo,
      waitlist_enabled: studio.waitlist_enabled,
      booking_buffer_minutes: studio.booking_buffer_minutes,
      rating: Number(studio.rating ?? 0),
      reviews_count: studio.reviews_count ?? 0,
    },
    professional: {
      id: prof.id,
      display_name: prof.display_name,
      role_title: prof.role_title,
      avatar_url: prof.avatar_url,
      bio: prof.bio,
    },
    services: list,
    workingHours: (hours ?? []) as PublicWorkingHour[],
    timeOff: (timeOff ?? []) as PublicTimeOff[],
    designer: { full_name: profile?.full_name ?? prof.display_name, phone: profile?.phone ?? null },
  };
}

const SLOT_GRANULARITY_MINUTES = 15;

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}
function buildLocalIso(date: string, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${date}T${pad(h)}:${pad(m)}:00`;
}
function isoToMinutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export type PublicSlot = { start: string; end: string };

export async function getPublicAvailableSlots(args: {
  professionalId: string;
  procedureId: string;
  date: string;
}): Promise<PublicSlot[]> {
  const supabase = createAdminClient();
  const dayDate = new Date(`${args.date}T00:00:00`);
  if (Number.isNaN(dayDate.getTime())) return [];
  const dow = dayDate.getDay();

  const [{ data: hour }, { data: service }, { data: appts }, { data: timeOff }, { data: studio }] =
    await Promise.all([
      supabase
        .from('working_hours')
        .select('start_time, end_time, is_active')
        .eq('professional_id', args.professionalId)
        .eq('day_of_week', dow)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('professional_services')
        .select('duration_minutes')
        .eq('professional_id', args.professionalId)
        .eq('procedure_id', args.procedureId)
        .maybeSingle(),
      supabase
        .from('appointments')
        .select('scheduled_start_at, scheduled_end_at, status')
        .eq('professional_id', args.professionalId)
        .gte('scheduled_start_at', `${args.date}T00:00:00`)
        .lte('scheduled_start_at', `${args.date}T23:59:59`),
      supabase
        .from('time_off')
        .select('start_at, end_at')
        .eq('professional_id', args.professionalId)
        .lte('start_at', `${args.date}T23:59:59`)
        .gte('end_at', `${args.date}T00:00:00`),
      supabase
        .from('studios')
        .select('booking_buffer_minutes')
        .limit(1)
        .maybeSingle(),
    ]);

  if (!hour || !service) return [];

  const buffer = (studio?.booking_buffer_minutes as number | undefined) ?? 0;
  const duration = service.duration_minutes;
  const startBound = timeToMin(hour.start_time);
  const endBound = timeToMin(hour.end_time);

  type Block = { start: number; end: number };
  const blocks: Block[] = [];
  for (const apt of appts ?? []) {
    if (!apt.scheduled_start_at || !apt.scheduled_end_at) continue;
    if (apt.status === 'cancelled' || apt.status === 'no_show') continue;
    const s = isoToMinutesOfDay(apt.scheduled_start_at);
    const e = isoToMinutesOfDay(apt.scheduled_end_at);
    blocks.push({ start: s - buffer, end: e + buffer });
  }
  for (const off of timeOff ?? []) {
    const startMs = new Date(off.start_at).getTime();
    const endMs = new Date(off.end_at).getTime();
    const dayStartMs = dayDate.getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
    const overlapStart = Math.max(startMs, dayStartMs);
    const overlapEnd = Math.min(endMs, dayEndMs);
    if (overlapEnd > overlapStart) {
      blocks.push({
        start: (overlapStart - dayStartMs) / 60_000,
        end: (overlapEnd - dayStartMs) / 60_000,
      });
    }
  }

  // Não permite slots no passado
  const now = new Date();
  const isToday =
    dayDate.getFullYear() === now.getFullYear() &&
    dayDate.getMonth() === now.getMonth() &&
    dayDate.getDate() === now.getDate();
  const minStart = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  function overlaps(s: number, e: number) {
    for (const b of blocks) {
      if (s < b.end && e > b.start) return true;
    }
    return false;
  }

  const slots: PublicSlot[] = [];
  for (let m = startBound; m + duration <= endBound; m += SLOT_GRANULARITY_MINUTES) {
    if (m < minStart) continue;
    if (!overlaps(m, m + duration)) {
      slots.push({
        start: buildLocalIso(args.date, m),
        end: buildLocalIso(args.date, m + duration),
      });
    }
  }
  return slots;
}

export async function getPublicNextAvailableDate(args: {
  professionalId: string;
  procedureId: string;
  fromDate: string;
  maxDaysAhead?: number;
}): Promise<string | null> {
  const max = args.maxDaysAhead ?? 30;
  const start = new Date(`${args.fromDate}T00:00:00`);
  for (let i = 0; i < max; i += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    const iso = `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
    const slots = await getPublicAvailableSlots({
      professionalId: args.professionalId,
      procedureId: args.procedureId,
      date: iso,
    });
    if (slots.length > 0) return iso;
  }
  return null;
}
