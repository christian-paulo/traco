import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  CoursePlan,
  LessonResource,
} from '@/lib/validations/academy';

export type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
  required_plan: CoursePlan;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  sort_order: number;
  resources_urls: LessonResource[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonProgressRow = {
  id: string;
  tenant_id: string;
  lesson_id: string;
  watched_seconds: number;
  last_position_seconds: number;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  linked_lesson_id: string | null;
  published_at: string | null;
  created_at: string;
};

export type CourseWithStats = CourseRow & {
  lessonsCount: number;
  totalDurationSeconds: number;
  completedCount: number;
  progressPct: number;
};

export async function listCoursesWithStats(): Promise<CourseWithStats[]> {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  const list = (courses ?? []) as unknown as CourseRow[];
  if (list.length === 0) return [];

  const ids = list.map((c) => c.id);
  const [{ data: lessonsRaw }, { data: progressRaw }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, course_id, duration_seconds, is_published')
      .in('course_id', ids)
      .eq('is_published', true),
    supabase.from('lesson_progress').select('lesson_id, completed'),
  ]);

  type LessonLite = {
    id: string;
    course_id: string;
    duration_seconds: number;
  };
  const lessons = (lessonsRaw ?? []) as unknown as LessonLite[];
  const progressByLesson = new Map<string, boolean>();
  for (const p of progressRaw ?? []) {
    progressByLesson.set(p.lesson_id as string, Boolean(p.completed));
  }

  return list.map((course) => {
    const courseLessons = lessons.filter((l) => l.course_id === course.id);
    const lessonsCount = courseLessons.length;
    const totalDurationSeconds = courseLessons.reduce(
      (s, l) => s + (l.duration_seconds ?? 0),
      0,
    );
    const completedCount = courseLessons.filter((l) =>
      progressByLesson.get(l.id) === true,
    ).length;
    const progressPct = lessonsCount > 0 ? (completedCount / lessonsCount) * 100 : 0;
    return {
      ...course,
      lessonsCount,
      totalDurationSeconds,
      completedCount,
      progressPct,
    };
  });
}

export async function getCourseBySlug(slug: string): Promise<CourseRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!data) return null;
  return data as unknown as CourseRow;
}

export async function listLessonsByCourse(courseId: string): Promise<LessonRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  return ((data ?? []) as unknown as LessonRow[]).map((l) => ({
    ...l,
    resources_urls: Array.isArray(l.resources_urls) ? l.resources_urls : [],
  }));
}

export async function getLessonById(id: string): Promise<LessonRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  return data as unknown as LessonRow;
}

export async function listProgressByLessonIds(
  lessonIds: string[],
): Promise<Map<string, LessonProgressRow>> {
  const map = new Map<string, LessonProgressRow>();
  if (lessonIds.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .in('lesson_id', lessonIds);
  for (const r of data ?? []) {
    const row = r as unknown as LessonProgressRow;
    map.set(row.lesson_id, row);
  }
  return map;
}

export type OverallProgress = {
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
};

export async function getOverallProgress(): Promise<OverallProgress> {
  const supabase = await createClient();
  const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true),
  ]);
  const t = totalLessons ?? 0;
  const c = completedLessons ?? 0;
  return {
    totalLessons: t,
    completedLessons: c,
    progressPct: t > 0 ? (c / t) * 100 : 0,
  };
}

export async function listAnnouncements(limit = 5): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('course_announcements')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as AnnouncementRow[];
}

export async function getCurrentRole(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return (data?.role as string | undefined) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentRole();
  return role === 'admin';
}

export type NextLessonForUser = {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  resumeFromSeconds: number;
  isResume: boolean;
};

/**
 * Próxima aula pra mostrar no card "Continuar na Academia" do dashboard.
 * Prioridade:
 * 1. Aula em andamento (last_position_seconds > 0 && !completed) — "Continuar de onde parou"
 * 2. Primeira aula não-iniciada do curso de menor sort_order — "Começar"
 * Retorna null se todas as aulas publicadas já estão concluídas.
 */
export async function getNextLessonForUser(): Promise<NextLessonForUser | null> {
  const supabase = await createClient();

  type CourseLite = {
    slug?: string;
    title?: string;
    sort_order?: number;
    is_published?: boolean;
  };
  type LessonLite = {
    id: string;
    title: string;
    course_id: string;
    courses: CourseLite | CourseLite[] | null;
  };
  type ProgressLite = {
    lesson_id: string;
    last_position_seconds: number;
    lessons: LessonLite | LessonLite[] | null;
  };

  // 1. Aula em andamento (não concluída + tem progresso > 0) — mais recente
  const { data: inProgress } = await supabase
    .from('lesson_progress')
    .select(
      'lesson_id, last_position_seconds, lessons(id, title, course_id, courses(slug, title, sort_order, is_published))',
    )
    .eq('completed', false)
    .gt('last_position_seconds', 0)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ip = inProgress as unknown as ProgressLite | null;
  const ipLesson = ip ? (Array.isArray(ip.lessons) ? ip.lessons[0] : ip.lessons) : null;
  const ipCourse = ipLesson
    ? Array.isArray(ipLesson.courses)
      ? ipLesson.courses[0]
      : ipLesson.courses
    : null;
  if (ip && ipLesson && ipCourse?.is_published && ipCourse.slug && ipCourse.title) {
    return {
      courseSlug: ipCourse.slug,
      courseTitle: ipCourse.title,
      lessonId: ipLesson.id,
      lessonTitle: ipLesson.title,
      resumeFromSeconds: ip.last_position_seconds ?? 0,
      isResume: true,
    };
  }

  // 2. Primeira aula não-concluída do primeiro curso publicado
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (!courses || courses.length === 0) return null;

  const { data: completedRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('completed', true);
  const completedSet = new Set(
    (completedRows ?? []).map((r) => (r as { lesson_id: string }).lesson_id),
  );

  for (const c of courses) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, sort_order')
      .eq('course_id', c.id as string)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    for (const l of lessons ?? []) {
      if (!completedSet.has(l.id as string)) {
        return {
          courseSlug: c.slug as string,
          courseTitle: c.title as string,
          lessonId: l.id as string,
          lessonTitle: l.title as string,
          resumeFromSeconds: 0,
          isResume: false,
        };
      }
    }
  }
  return null;
}
