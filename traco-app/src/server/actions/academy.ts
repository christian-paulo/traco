'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import {
  announcementSchema,
  courseSchema,
  lessonSchema,
  progressSchema,
  type AnnouncementInput,
  type CourseInput,
  type LessonInput,
  type ProgressInput,
} from '@/lib/validations/academy';
import type { Json } from '@/types/database';

import {
  ensureAchievement,
  evaluateAbsoluteAchievements,
} from './achievements';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

// =========================================================================
// PROGRESS (todas as alunas)
// =========================================================================

const COMPLETION_THRESHOLD_PCT = 90;

export async function updateLessonProgress(
  input: ProgressInput,
): Promise<SimpleResult> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  // Lê duração da aula pra calcular se passou do threshold
  const { data: lesson } = await supabase
    .from('lessons')
    .select('duration_seconds')
    .eq('id', parsed.data.lesson_id)
    .maybeSingle();
  const duration = lesson?.duration_seconds ?? 0;

  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('id, watched_seconds, completed')
    .eq('lesson_id', parsed.data.lesson_id)
    .maybeSingle();

  const watchedDelta = parsed.data.watched_seconds ?? 0;
  const lastPos = parsed.data.last_position_seconds ?? 0;
  const watchedTotal = (existing?.watched_seconds ?? 0) + Math.max(0, watchedDelta);

  const shouldComplete =
    !existing?.completed &&
    duration > 0 &&
    lastPos >= duration * (COMPLETION_THRESHOLD_PCT / 100);

  const payload: {
    tenant_id: string;
    lesson_id: string;
    watched_seconds: number;
    last_position_seconds: number;
    completed?: boolean;
    completed_at?: string;
  } = {
    tenant_id: profile.tenantId,
    lesson_id: parsed.data.lesson_id,
    watched_seconds: watchedTotal,
    last_position_seconds: lastPos,
  };
  if (shouldComplete) {
    payload.completed = true;
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(payload, { onConflict: 'tenant_id,lesson_id' });

  if (error) return { success: false, error: error.message };

  if (shouldComplete) {
    await evaluateAcademyAchievements(profile.tenantId, parsed.data.lesson_id);
  }

  revalidatePath('/dashboard/academia');
  return { success: true };
}

export async function markLessonComplete(lessonId: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from('lessons')
    .select('duration_seconds')
    .eq('id', lessonId)
    .maybeSingle();
  const duration = lesson?.duration_seconds ?? 0;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        tenant_id: profile.tenantId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        last_position_seconds: duration,
        watched_seconds: duration,
      },
      { onConflict: 'tenant_id,lesson_id' },
    );

  if (error) return { success: false, error: error.message };

  await evaluateAcademyAchievements(profile.tenantId, lessonId);
  revalidatePath('/dashboard/academia');
  return { success: true };
}

/**
 * Avalia conquistas relacionadas à academia após completar uma aula.
 */
async function evaluateAcademyAchievements(
  tenantId: string,
  triggerLessonId: string,
): Promise<void> {
  const supabase = await createClient();

  // first_lesson_completed
  await ensureAchievement({ tenantId, type: 'first_lesson_completed' });

  // founder_traco — primeiras 100 alunas (ranking por created_at do tenant)
  const { data: tenantRow } = await supabase
    .from('tenants')
    .select('created_at')
    .eq('id', tenantId)
    .maybeSingle();
  if (tenantRow?.created_at) {
    const { count: olderTenants } = await supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', tenantRow.created_at);
    if ((olderTenants ?? 0) < 100) {
      await ensureAchievement({ tenantId, type: 'founder_traco' });
    }
  }

  // first_course_completed — verifica se todas as aulas do curso da triggerLesson estão completas
  const { data: triggerLesson } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('id', triggerLessonId)
    .maybeSingle();
  if (triggerLesson?.course_id) {
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', triggerLesson.course_id)
      .eq('is_published', true);
    const lessonIds = (courseLessons ?? []).map((l) => l.id as string);
    if (lessonIds.length > 0) {
      const { count: completedInCourse } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .in('lesson_id', lessonIds)
        .eq('completed', true);
      if ((completedInCourse ?? 0) >= lessonIds.length) {
        await ensureAchievement({ tenantId, type: 'first_course_completed' });
      }
    }
  }

  // lessons_5_in_week — 5 aulas concluídas nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: weekLessons } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)
    .gte('completed_at', sevenDaysAgo.toISOString());
  if ((weekLessons ?? 0) >= 5) {
    await ensureAchievement({ tenantId, type: 'lessons_5_in_week' });
  }

  // engaged_student — 50%+ de progresso geral
  const [{ count: totalLessons }, { count: completed }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true),
  ]);
  if (totalLessons && totalLessons > 0) {
    const pct = ((completed ?? 0) / totalLessons) * 100;
    if (pct >= 50) {
      await ensureAchievement({ tenantId, type: 'engaged_student' });
    }
  }

  await evaluateAbsoluteAchievements(tenantId);
}

// =========================================================================
// ADMIN — Cursos
// =========================================================================

async function ensureAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: 'Sessão expirada.' };
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profile.id)
    .maybeSingle();
  if (data?.role !== 'admin') {
    return { ok: false, error: 'Acesso restrito a administradores.' };
  }
  return { ok: true };
}

export async function createCourse(input: CourseInput): Promise<CreateResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      cover_image_url:
        parsed.data.cover_image_url && parsed.data.cover_image_url.length > 0
          ? parsed.data.cover_image_url
          : null,
      sort_order: parsed.data.sort_order,
      required_plan: parsed.data.required_plan,
      is_published: parsed.data.is_published,
    })
    .select('id')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar curso.' };
  }
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true, data: { id: data.id } };
}

export async function updateCourse(
  id: string,
  input: CourseInput,
): Promise<SimpleResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from('courses')
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      cover_image_url:
        parsed.data.cover_image_url && parsed.data.cover_image_url.length > 0
          ? parsed.data.cover_image_url
          : null,
      sort_order: parsed.data.sort_order,
      required_plan: parsed.data.required_plan,
      is_published: parsed.data.is_published,
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true };
}

export async function deleteCourse(id: string): Promise<SimpleResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true };
}

// =========================================================================
// ADMIN — Aulas
// =========================================================================

export async function createLesson(input: LessonInput): Promise<CreateResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: parsed.data.course_id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      video_url:
        parsed.data.video_url && parsed.data.video_url.length > 0
          ? parsed.data.video_url
          : null,
      duration_seconds: parsed.data.duration_seconds,
      sort_order: parsed.data.sort_order,
      resources_urls: parsed.data.resources_urls as unknown as Json,
      is_published: parsed.data.is_published,
    })
    .select('id')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar aula.' };
  }
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true, data: { id: data.id } };
}

export async function updateLesson(
  id: string,
  input: LessonInput,
): Promise<SimpleResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from('lessons')
    .update({
      course_id: parsed.data.course_id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      video_url:
        parsed.data.video_url && parsed.data.video_url.length > 0
          ? parsed.data.video_url
          : null,
      duration_seconds: parsed.data.duration_seconds,
      sort_order: parsed.data.sort_order,
      resources_urls: parsed.data.resources_urls as unknown as Json,
      is_published: parsed.data.is_published,
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true };
}

export async function deleteLesson(id: string): Promise<SimpleResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = await createClient();
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true };
}

// =========================================================================
// ADMIN — Anúncios
// =========================================================================

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<CreateResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('course_announcements')
    .insert({
      title: parsed.data.title,
      content: parsed.data.content,
      linked_lesson_id: parsed.data.linked_lesson_id ?? null,
      published_at: parsed.data.publish_now ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar anúncio.' };
  }
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true, data: { id: data.id } };
}

export async function deleteAnnouncement(id: string): Promise<SimpleResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from('course_announcements')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/academia');
  revalidatePath('/dashboard/admin/academia');
  return { success: true };
}
