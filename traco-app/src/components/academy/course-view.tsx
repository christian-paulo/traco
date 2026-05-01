'use client';

import { CheckCircle2, Circle, Download, PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import type {
  LessonProgressRow,
  LessonRow,
} from '@/lib/queries/academy';
import { formatDuration } from '@/lib/validations/academy';
import { cn } from '@/lib/utils';

import { LessonPlayer } from './lesson-player';

type Props = {
  lessons: LessonRow[];
  progress: Map<string, LessonProgressRow>;
};

export function CourseView({ lessons, progress }: Props) {
  const initialIndex = (() => {
    // Encontra primeira não-concluída, senão volta pra primeira
    const idx = lessons.findIndex((l) => !progress.get(l.id)?.completed);
    return idx >= 0 ? idx : 0;
  })();
  const [activeIdx, setActiveIdx] = useState(initialIndex);
  const active = lessons[activeIdx];
  const activeProgress = active ? progress.get(active.id) : undefined;

  if (!active) {
    return (
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
        <CardContent className="text-center">
          <p className="font-serif text-lg italic text-muted-foreground">
            Este curso ainda não tem aulas publicadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar — lista de aulas */}
      <aside className="flex flex-col gap-2 lg:sticky lg:top-4 lg:h-fit">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Aulas do curso
        </p>
        <ol className="flex flex-col gap-1.5">
          {lessons.map((l, idx) => {
            const isActive = idx === activeIdx;
            const completed = progress.get(l.id)?.completed === true;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                    isActive
                      ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                      : 'border-cream-dark bg-card hover:border-[var(--gold)]/40 hover:bg-cream-dark/30',
                  )}
                  aria-pressed={isActive}
                >
                  <span className="mt-0.5">
                    {completed ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <Circle
                        className={cn(
                          'size-4',
                          isActive ? 'text-[var(--gold)]' : 'text-muted-foreground',
                        )}
                      />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p
                      className={cn(
                        'text-xs font-medium uppercase tracking-[0.12em]',
                        isActive ? 'text-[var(--gold)]' : 'text-muted-foreground',
                      )}
                    >
                      Aula {idx + 1}
                    </p>
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {l.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDuration(l.duration_seconds)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Conteúdo da aula ativa */}
      <section className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Aula {activeIdx + 1} de {lessons.length}
          </p>
          <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground">
            {active.title}
          </h2>
        </div>

        <LessonPlayer
          lessonId={active.id}
          videoUrl={active.video_url}
          initialPosition={activeProgress?.last_position_seconds ?? 0}
          initialCompleted={activeProgress?.completed ?? false}
        />

        {active.description ? (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
            <CardContent className="px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                {active.description}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {active.resources_urls.length > 0 ? (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
            <CardContent className="flex flex-col gap-2 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Recursos
              </p>
              <ul className="flex flex-col gap-1">
                {active.resources_urls.map((res, idx) => (
                  <li key={idx}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-cream-dark/30 hover:text-[var(--gold)]"
                    >
                      <Download className="size-4" />
                      {res.label}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-[var(--gold)] disabled:opacity-40"
          >
            ← Aula anterior
          </button>
          <button
            type="button"
            onClick={() => setActiveIdx(Math.min(lessons.length - 1, activeIdx + 1))}
            disabled={activeIdx >= lessons.length - 1}
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold)] transition-colors hover:underline disabled:opacity-40"
          >
            Próxima aula
            <PlayCircle className="size-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
