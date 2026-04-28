'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '@/lib/format';

type Props = {
  data: Array<{ dayOfWeek: number; label: string; revenue: number; appointments: number }>;
};

export function DayOfWeekChart({ data }: Props) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#E8E5DF" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7A7A7A', fontSize: 11, fontFamily: 'var(--font-sans)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7A7A7A', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value.toFixed(0)}`
            }
            width={60}
          />
          <Tooltip
            cursor={{ fill: 'rgba(201,169,97,0.08)' }}
            contentStyle={{
              background: '#0A0A0A',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Faturamento'] as [string, string]}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.dayOfWeek}
                fill={
                  entry.revenue === maxRevenue && maxRevenue > 0 ? '#C9A961' : '#A8884A'
                }
                opacity={entry.revenue === maxRevenue && maxRevenue > 0 ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
