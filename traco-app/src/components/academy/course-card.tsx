import { Clock, GraduationCap, PlayCircle } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CourseWithStats } from '@/lib/queries/academy';
import {
  COURSE_PLAN_LABELS,
  formatDuration,
} from '@/lib/validations/academy';

type Props = {
  course: CourseWithStats;
};

export function CourseCard({ course }: Props) {
  return (
    <Link
      href={`/dashboard/academia/${course.slug}`}
      className="group/course flex flex-col"
    >
      <Card
        variant="premium"
        className="flex flex-1 flex-col overflow-hidden bg-card border-0 ring-1 ring-[var(--border)] transition-all hover:shadow-xl hover:ring-[var(--gold)]/40"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[var(--gold)]/15 to-cream">
          {course.cover_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap
                className="size-16 text-[var(--gold)]/60"
                strokeWidth={1.25}
              />
            </div>
          )}
          {course.required_plan !== 'free' ? (
            <Badge
              variant="outline"
              className="absolute left-3 top-3 border-[var(--gold)]/50 bg-card/95 text-[10px] uppercase tracking-[0.14em]"
            >
              {COURSE_PLAN_LABELS[course.required_plan]}
            </Badge>
          ) : null}
          {course.progressPct === 100 ? (
            <Badge
              variant="outline"
              className="absolute right-3 top-3 border-emerald-300 bg-emerald-50 text-[10px] uppercase tracking-[0.14em] text-emerald-800"
            >
              Concluído
            </Badge>
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 px-5 py-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-serif text-xl font-medium leading-tight text-foreground">
              {course.title}
            </h3>
            {course.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {course.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="size-3.5" />
              {course.lessonsCount} {course.lessonsCount === 1 ? 'aula' : 'aulas'}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {formatDuration(course.totalDurationSeconds)}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-1">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500 transition-all"
                style={{ width: `${course.progressPct}%` }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {course.completedCount}/{course.lessonsCount} aulas ·{' '}
              {course.progressPct.toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
