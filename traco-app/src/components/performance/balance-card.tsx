import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

type Props = {
  revenue: number;
  expenses: number;
  profit: number;
};

export function BalanceCard({ revenue, expenses, profit }: Props) {
  const max = Math.max(revenue, expenses, Math.abs(profit), 1);
  const profitPositive = profit >= 0;

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
      <CardContent className="flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Balanço financeiro no período
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <Stat
            label="Receita"
            value={revenue}
            color="text-emerald-700"
            barColor="bg-emerald-500"
            ratio={revenue / max}
          />
          <Stat
            label="Despesa"
            value={expenses}
            color="text-red-700"
            barColor="bg-red-500"
            ratio={expenses / max}
          />
          <Stat
            label="Lucro"
            value={Math.abs(profit)}
            color={profitPositive ? 'text-[var(--gold)]' : 'text-red-700'}
            barColor={profitPositive ? 'bg-[var(--gold)]' : 'bg-red-500'}
            ratio={Math.abs(profit) / max}
            icon={
              profitPositive ? (
                <ArrowUpRight className="size-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="size-3.5 text-red-600" />
              )
            }
            signed={profitPositive ? '+' : '−'}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type StatProps = {
  label: string;
  value: number;
  color: string;
  barColor: string;
  ratio: number;
  icon?: React.ReactNode;
  signed?: string;
};

function Stat({ label, value, color, barColor, ratio, icon, signed }: StatProps) {
  const heightPct = Math.max(4, Math.min(100, ratio * 100));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-24 w-full items-end justify-center sm:h-32">
        <div
          className={cn('w-9 rounded-t-md transition-all sm:w-12', barColor)}
          style={{ height: `${heightPct}%` }}
          aria-hidden
        />
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className={cn('flex items-center gap-1 text-base font-semibold tabular-nums sm:text-lg', color)}>
          {icon}
          {signed && value > 0 ? signed : ''}
          {formatCurrency(value)}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
