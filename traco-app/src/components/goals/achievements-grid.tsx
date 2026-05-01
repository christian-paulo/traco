'use client';

import { Share2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/format';
import type { AchievementRow } from '@/lib/queries/goals';
import {
  ACHIEVEMENT_META,
  type AchievementType,
} from '@/lib/validations/goal';
import { cn } from '@/lib/utils';
import { markAchievementShared } from '@/server/actions/goals';

type Props = {
  achievements: AchievementRow[];
};

const ALL_TYPES: AchievementType[] = [
  'first_client',
  'tenth_client',
  'hundredth_client',
  'first_recovery',
  'streak_7',
  'streak_30',
  'monthly_record',
  'goal_25',
  'goal_50',
  'goal_75',
  'goal_100',
  'big_recovery',
  'first_month_pro',
];

export function AchievementsGrid({ achievements }: Props) {
  const [pending, startTransition] = useTransition();
  const earnedByType = new Map<AchievementType, AchievementRow>();
  for (const a of achievements) earnedByType.set(a.type, a);

  function handleShare(achievement: AchievementRow) {
    const meta = ACHIEVEMENT_META[achievement.type];
    const text = `${meta.icon} ${meta.label} — ${meta.description}\n\nFeito com Traço.`;
    if (navigator.share) {
      navigator
        .share({ title: meta.label, text })
        .then(() => {
          startTransition(async () => {
            await markAchievementShared(achievement.id);
          });
        })
        .catch(() => {
          // usuário cancelou — não marca como compartilhado
        });
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success('Conquista copiada — cole onde quiser.');
          startTransition(async () => {
            await markAchievementShared(achievement.id);
          });
        })
        .catch(() => toast.error('Erro ao copiar.'));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {ALL_TYPES.map((type) => {
        const earned = earnedByType.get(type);
        const meta = ACHIEVEMENT_META[type];
        return (
          <Card
            key={type}
            variant="premium"
            className={cn(
              'border-0 ring-1',
              earned
                ? 'bg-gradient-to-br from-[var(--gold)]/10 to-cream/40 ring-[var(--gold)]/40'
                : 'bg-cream-dark/30 ring-cream-dark opacity-70',
            )}
          >
            <CardContent className="flex flex-col items-center gap-2 px-4 py-5 text-center">
              <div
                className={cn(
                  'flex size-14 items-center justify-center rounded-full text-2xl',
                  earned ? 'bg-[var(--gold)]/15' : 'bg-cream-dark/60 grayscale',
                )}
                aria-hidden
              >
                {meta.icon}
              </div>
              <p className="font-serif text-sm font-medium text-foreground">
                {meta.label}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {meta.description}
              </p>
              {earned ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">
                    {formatRelativeDate(earned.earned_at)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleShare(earned)}
                    disabled={pending}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70 hover:text-[var(--gold)]"
                  >
                    <Share2 className="size-3" />
                    {earned.shared ? 'Compartilhado' : 'Compartilhar'}
                  </button>
                </>
              ) : (
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                  Pendente
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
