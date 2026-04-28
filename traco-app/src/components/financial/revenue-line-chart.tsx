'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '@/lib/format';

type Props = {
  data: Array<{ month: string; label: string; revenue: number; appointments: number }>;
};

export function RevenueLineChart({ data }: Props) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
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
            cursor={{ stroke: '#C9A961', strokeWidth: 1, strokeOpacity: 0.4 }}
            contentStyle={{
              background: '#0A0A0A',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
            }}
            labelStyle={{
              color: '#C9A961',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: 10,
              marginBottom: 4,
            }}
            formatter={(value, name) =>
              (name === 'revenue'
                ? [formatCurrency(Number(value ?? 0)), 'Faturamento']
                : [String(value ?? 0), 'Atendimentos']) as [string, string]
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#C9A961"
            strokeWidth={2}
            dot={{ stroke: '#C9A961', strokeWidth: 2, fill: '#fff', r: 4 }}
            activeDot={{ r: 6, fill: '#C9A961' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
