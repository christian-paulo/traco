import { ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import type { NextLessonForUser } from '@/lib/queries/academy';

type Props = {
  next: NextLessonForUser | null;
};

export function ContinueAcademyCard({ next }: Props) {
  if (!next) return null;

  const href = `/dashboard/academia/${next.courseSlug}`;
  const cta = next.isResume ? 'Continuar de onde parou' : 'Começar agora';
  const subtitle = next.isResume ? 'Você parou aqui' : 'Próxima aula sugerida';

  return (
    <Link href={href} className="block">
      <Card
        variant="premium"
        className="border-0 bg-gradient-to-br from-[var(--gold)]/15 to-cream/40 ring-1 ring-[var(--gold)]/30 transition-all hover:shadow-lg"
      >
        <CardContent className="flex items-center gap-4 px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20">
            {next.isResume ? (
              <PlayCircle className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
            ) : (
              <GraduationCap className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Academia · {subtitle}
            </p>
            <p className="font-serif text-base font-medium text-foreground">
              {next.lessonTitle}
            </p>
            <p className="text-xs text-muted-foreground">{next.courseTitle}</p>
          </div>
          <span className="hidden items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--gold)] sm:inline-flex">
            {cta}
            <ChevronRight className="size-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
