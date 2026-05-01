import { z } from 'zod';

export const COURSE_PLANS = ['free', 'pro', 'studio'] as const;
export type CoursePlan = (typeof COURSE_PLANS)[number];

export const COURSE_PLAN_LABELS: Record<CoursePlan, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  studio: 'Studio',
};

export const courseSchema = z.object({
  title: z.string().trim().min(2, 'Título obrigatório.').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug obrigatório.')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen.'),
  description: z.string().trim().max(1000).nullable().optional(),
  cover_image_url: z.string().url('URL inválida.').nullable().optional().or(z.literal('')),
  sort_order: z.number().int().min(0).default(0),
  required_plan: z.enum(COURSE_PLANS).default('free'),
  is_published: z.boolean().default(false),
});

export type CourseInput = z.input<typeof courseSchema>;

export const lessonSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().trim().min(2, 'Título obrigatório.').max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  video_url: z.string().url('URL inválida.').nullable().optional().or(z.literal('')),
  duration_seconds: z.number().int().min(0).default(0),
  sort_order: z.number().int().min(0).default(0),
  resources_urls: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        url: z.string().url(),
      }),
    )
    .default([]),
  is_published: z.boolean().default(false),
});

export type LessonInput = z.input<typeof lessonSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(2000),
  linked_lesson_id: z.string().uuid().nullable().optional(),
  publish_now: z.boolean().default(true),
});

export type AnnouncementInput = z.input<typeof announcementSchema>;

export const progressSchema = z.object({
  lesson_id: z.string().uuid(),
  watched_seconds: z.number().int().min(0).optional(),
  last_position_seconds: z.number().int().min(0).optional(),
});

export type ProgressInput = z.input<typeof progressSchema>;

export type LessonResource = {
  label: string;
  url: string;
};

/**
 * Extrai ID do Vimeo de URL no formato https://vimeo.com/123456789
 * Retorna null se a URL não for Vimeo (player nativo será usado).
 */
export function extractVimeoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`;
  return `${s}s`;
}
