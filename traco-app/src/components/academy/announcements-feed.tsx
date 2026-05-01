import { Megaphone } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/format';
import type { AnnouncementRow } from '@/lib/queries/academy';

type Props = {
  announcements: AnnouncementRow[];
};

export function AnnouncementsFeed({ announcements }: Props) {
  if (announcements.length === 0) return null;
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--gold)]/30">
      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-[var(--gold)]" />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Avisos da Academia
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-cream-dark">
          {announcements.map((a) => (
            <li key={a.id} className="-mx-2 flex flex-col gap-1 px-2 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-serif text-base font-medium text-foreground">
                  {a.title}
                </p>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {a.published_at ? formatRelativeDate(a.published_at) : '—'}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground/85">
                {a.content}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
