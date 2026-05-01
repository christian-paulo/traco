'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatCurrency } from '@/lib/format';
import {
  EXPENSE_CATEGORY_COLORS,
  type ExpenseCategory,
} from '@/lib/validations/expense';

type Slice = {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
};

type Props = {
  data: Slice[];
  total: number;
};

export function ExpensesPieChart({ data, total }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm italic text-muted-foreground">
        Sem despesas no período.
      </div>
    );
  }

  const top = data.slice(0, 5);

  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_220px]">
      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: '#0A0A0A',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value, _name, item) =>
                [
                  formatCurrency(Number(value ?? 0)),
                  (item as { payload?: { label?: string } } | undefined)?.payload?.label ?? '',
                ] as [string, string]
              }
            />
            <Pie
              data={top}
              dataKey="amount"
              nameKey="label"
              innerRadius={56}
              outerRadius={90}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {top.map((slice) => (
                <Cell
                  key={slice.category}
                  fill={EXPENSE_CATEGORY_COLORS[slice.category] ?? '#6B7280'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Total
          </span>
          <span className="font-serif text-xl font-medium text-red-700">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {top.map((slice) => (
          <li key={slice.category} className="flex items-center gap-2.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: EXPENSE_CATEGORY_COLORS[slice.category] ?? '#6B7280',
              }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-foreground">{slice.label}</span>
              <span className="text-muted-foreground">
                {formatCurrency(slice.amount)} · {slice.percentage.toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
