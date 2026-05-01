import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CourseView } from '@/components/academy/course-view';
import { Badge } from '@/components/ui/badge';
import {
  getCourseBySlug,
  listLessonsByCourse,
  listProgressByLessonIds,
} from '@/lib/queries/academy';
import { getCurrentProfile } from '@/lib/queries/profile';
import {
  COURSE_PLAN_LABELS,
  formatDuration,
} from '@/lib/validations/academy';

type Params = Promise<{ courseSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  return {
    title: course ? `${course.title} | Academia` : 'Curso | Academia',
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const { courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const lessons = await listLessonsByCourse(course.id);
  const progress = await listProgressByLessonIds(lessons.map((l) => l.id));

  const totalSeconds = lessons.reduce((s, l) => s + l.duration_seconds, 0);

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        <Link href="/dashboard/academia" className="hover:text-[var(--gold)]">
          Academia
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{course.title}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {course.required_plan !== 'free' ? (
            <Badge
              variant="outline"
              className="border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[10px] uppercase tracking-[0.14em]"
            >
              {COURSE_PLAN_LABELS[course.required_plan]}
            </Badge>
          ) : null}
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {lessons.length} aulas · {formatDuration(totalSeconds)}
          </span>
        </div>
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          {course.title}
        </h1>
        {course.description ? (
          <p className="max-w-3xl font-serif text-base italic text-muted-foreground">
            {course.description}
          </p>
        ) : null}
      </header>

      <CourseView lessons={lessons} progress={progress} />
    </div>
  );
}
