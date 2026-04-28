'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatCurrency } from '@/lib/format';

type Slice = {
  procedure_id: string;
  name: string;
  color: string;
  revenue: number;
  count: number;
  percentage: number;
};

type Props = {
  data: Slice[];
  total: number;
};

export function ProcedurePieChart({ data, total }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm italic text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }

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
              formatter={(value, _name, item) => [
                formatCurrency(Number(value ?? 0)),
                (item as { payload?: { name?: string } } | undefined)?.payload?.name ?? '',
              ] as [string, string]}
            />
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              innerRadius={56}
              outerRadius={90}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.procedure_id} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Total
          </span>
          <span className="font-serif text-xl font-medium text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {data.map((slice) => (
          <li key={slice.procedure_id} className="flex items-center gap-2.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-foreground">{slice.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(slice.revenue)} · {slice.percentage.toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
