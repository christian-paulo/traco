import 'server-only';

import { createClient } from '@/lib/supabase/server';

const SLOT_GRANULARITY_MINUTES = 15;

type SlotArgs = {
  professionalId: string;
  procedureId: string;
  date: string; // YYYY-MM-DD
};

export type AvailableSlot = { start: string; end: string };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function buildLocalIso(date: string, minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${date}T${pad(h)}:${pad(m)}:00`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function isoToMinutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export async function getAvailableSlots({
  professionalId,
  procedureId,
  date,
}: SlotArgs): Promise<AvailableSlot[]> {
  const supabase = await createClient();
  const dayDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(dayDate.getTime())) return [];
  const dayOfWeek = dayDate.getDay();

  const [{ data: hours }, { data: service }, { data: appts }, { data: timeOff }, { data: studio }] =
    await Promise.all([
      supabase
        .from('working_hours')
        .select('start_time, end_time, is_active')
        .eq('professional_id', professionalId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('professional_services')
        .select('duration_minutes')
        .eq('professional_id', professionalId)
        .eq('procedure_id', procedureId)
        .maybeSingle(),
      supabase
        .from('appointments')
        .select('scheduled_start_at, scheduled_end_at, status')
        .eq('professional_id', professionalId)
        .gte('scheduled_start_at', `${date}T00:00:00`)
        .lte('scheduled_start_at', `${date}T23:59:59`),
      supabase
        .from('time_off')
        .select('start_at, end_at')
        .eq('professional_id', professionalId)
        .lte('start_at', `${date}T23:59:59`)
        .gte('end_at', `${date}T00:00:00`),
      supabase.from('studios').select('booking_buffer_minutes').limit(1).maybeSingle(),
    ]);

  if (!hours || !service) return [];

  const buffer = (studio?.booking_buffer_minutes as number | undefined) ?? 0;
  const duration = service.duration_minutes;
  const startBound = timeToMinutes(hours.start_time);
  const endBound = timeToMinutes(hours.end_time);

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
      const s = (overlapStart - dayStartMs) / 60_000;
      const e = (overlapEnd - dayStartMs) / 60_000;
      blocks.push({ start: s, end: e });
    }
  }

  function overlaps(s: number, e: number) {
    for (const b of blocks) {
      if (s < b.end && e > b.start) return true;
    }
    return false;
  }

  const slots: AvailableSlot[] = [];
  for (let m = startBound; m + duration <= endBound; m += SLOT_GRANULARITY_MINUTES) {
    if (!overlaps(m, m + duration)) {
      slots.push({
        start: buildLocalIso(date, m),
        end: buildLocalIso(date, m + duration),
      });
    }
  }
  return slots;
}

export async function getNextAvailableDate({
  professionalId,
  procedureId,
  fromDate,
  maxDaysAhead = 30,
}: {
  professionalId: string;
  procedureId: string;
  fromDate: string;
  maxDaysAhead?: number;
}): Promise<string | null> {
  const start = new Date(`${fromDate}T00:00:00`);
  for (let i = 0; i < maxDaysAhead; i += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    const iso = `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
    const slots = await getAvailableSlots({ professionalId, procedureId, date: iso });
    if (slots.length > 0) return iso;
  }
  return null;
}
