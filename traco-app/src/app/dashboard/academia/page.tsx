import { GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AnnouncementsFeed } from '@/components/academy/announcements-feed';
import { CommunityCard } from '@/components/academy/community-card';
import { CourseCard } from '@/components/academy/course-card';
import { Card, CardContent } from '@/components/ui/card';
import {
  getOverallProgress,
  listAnnouncements,
  listCoursesWithStats,
} from '@/lib/queries/academy';
import { getCurrentProfile } from '@/lib/queries/profile';

export const metadata: Metadata = {
  title: 'Academia Traço',
};

export default async function AcademiaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const [courses, announcements, overall] = await Promise.all([
    listCoursesWithStats(),
    listAnnouncements(3),
    getOverallProgress(),
  ]);

  const communityUrl = process.env.NEXT_PUBLIC_COMMUNITY_URL;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Academia Traço
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Aulas exclusivas pra você dominar o Método SRB
        </p>
        {overall.totalLessons > 0 ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-cream-dark">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500"
                style={{ width: `${overall.progressPct}%` }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {overall.completedLessons}/{overall.totalLessons} aulas concluídas ·{' '}
              {overall.progressPct.toFixed(0)}%
            </span>
          </div>
        ) : null}
      </header>

      <AnnouncementsFeed announcements={announcements} />

      {communityUrl ? <CommunityCard url={communityUrl} /> : null}

      {courses.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <GraduationCap className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Os primeiros cursos da Academia chegam em breve.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </section>
      )}
    </div>
  );
}
