import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import type { AchievementRow } from '@/lib/queries/goals';
import { ACHIEVEMENT_META } from '@/lib/validations/goal';

type Props = {
  achievements: AchievementRow[];
};

export function UnseenAchievementsCard({ achievements }: Props) {
  if (achievements.length === 0) return null;
  const top = achievements.slice(0, 3);
  const remaining = achievements.length - top.length;

  return (
    <Link href="/dashboard/metas#conquistas" className="block">
      <Card
        variant="premium"
        className="border-0 bg-gradient-to-br from-[var(--gold)]/15 to-cream/40 ring-1 ring-[var(--gold)]/40 transition-all hover:shadow-lg"
      >
        <CardContent className="flex items-center gap-4 px-6 py-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20">
            <Sparkles
              className="size-6 text-[var(--gold)]"
              strokeWidth={1.5}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-serif text-lg font-medium text-foreground">
              Novas conquistas! 🎉
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {top.map((a) => {
                const meta = ACHIEVEMENT_META[a.type];
                return (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs ring-1 ring-[var(--gold)]/30"
                  >
                    <span aria-hidden>{meta.icon}</span>
                    <span className="text-foreground">{meta.label}</span>
                  </span>
                );
              })}
              {remaining > 0 ? (
                <span className="text-xs text-muted-foreground">
                  +{remaining}
                </span>
              ) : null}
            </div>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--gold)]">
            Ver →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
