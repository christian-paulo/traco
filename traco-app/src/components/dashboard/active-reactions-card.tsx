import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeDate, getInitials } from '@/lib/format';
import type { ActiveReactionSummary } from '@/lib/queries/dashboard';

const TYPE_LABEL: Record<string, string> = {
  allergy: 'Alergia',
  irritation: 'Irritação',
  hypersensitivity: 'Hipersensibilidade',
  positive_excellent: 'Resultado excelente',
  below_expected: 'Abaixo do esperado',
  other: 'Outro',
};

type Props = {
  total: number;
  recent: ActiveReactionSummary[];
};

export function ActiveReactionsCard({ total, recent }: Props) {
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
          <AlertTriangle className="size-4 text-red-600" />
          Reações em observação
        </CardTitle>
        {total > 0 ? (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800">
            {total}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="px-6">
        {recent.length === 0 ? (
          <p className="font-serif text-base italic text-muted-foreground">
            Nenhuma reação ativa <span aria-hidden>🤍</span>
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-cream-dark">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/clientes/${r.client_id}`}
                  className="group/item -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-cream-dark/30"
                >
                  <Avatar className="size-9 border border-red-200 shrink-0">
                    <AvatarFallback className="bg-red-50 text-red-700 text-xs">
                      {getInitials(r.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.client_name}
                    </p>
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{TYPE_LABEL[r.reaction_type] ?? r.reaction_type}</span>
                      <span>·</span>
                      <span>{formatRelativeDate(r.recorded_at)}</span>
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/item:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
