'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '@/lib/format';

type Row = {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
};

type Props = {
  data: Row[];
};

export function RevenueVsExpenseChart({ data }: Props) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#E8E5DF" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7A7A7A', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7A7A7A', fontSize: 11 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value.toFixed(0)}`
            }
            width={60}
          />
          <Tooltip
            cursor={{ fill: 'rgba(201, 169, 97, 0.05)' }}
            contentStyle={{
              background: '#0A0A0A',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
            }}
            labelStyle={{
              color: '#C9A961',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: 10,
              marginBottom: 4,
            }}
            formatter={(value, name) => {
              const label =
                name === 'revenue'
                  ? 'Receita'
                  : name === 'expenses'
                    ? 'Despesa'
                    : 'Lucro';
              return [formatCurrency(Number(value ?? 0)), label] as [string, string];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) =>
              value === 'revenue'
                ? 'Receita'
                : value === 'expenses'
                  ? 'Despesa'
                  : 'Lucro'
            }
          />
          <Bar dataKey="revenue" fill="#2F855A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#B11212" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="#C9A961" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
