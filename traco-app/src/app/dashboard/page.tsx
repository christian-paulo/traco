import { AlertCircle, CalendarCheck, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getFirstName } from '@/lib/format';
import { getDashboardStats } from '@/lib/queries/dashboard';
import { getCurrentProfile } from '@/lib/queries/profile';

type StatCardProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  prefix?: string;
};

function StatCard({ label, icon: Icon, value, prefix }: StatCardProps) {
  return (
    <Card variant="premium" className="bg-card gap-3 border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-6 pb-0">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-[var(--gold)]" strokeWidth={1.5} />
      </CardHeader>
      <CardContent className="px-6">
        <p className="font-serif font-medium leading-none text-foreground">
          {prefix ? (
            <>
              <span className="text-2xl text-muted-foreground">{prefix}</span>{' '}
              <span className="text-4xl">{value}</span>
            </>
          ) : (
            <span className="text-4xl">{value}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <CardHeader className="px-6 pb-0">
      <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
      <CardTitle className="font-serif text-xl font-medium tracking-tight text-foreground">
        {title}
      </CardTitle>
    </CardHeader>
  );
}

function formatRevenue(value: number) {
  const formatted = formatCurrency(value);
  const match = formatted.match(/^(R\$)\s*(.+)$/);
  if (!match) return { prefix: undefined, value: formatted };
  return { prefix: match[1], value: match[2] };
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const stats = await getDashboardStats(profile.tenantId);
  const firstName = getFirstName(profile.fullName ?? profile.email);
  const revenue = formatRevenue(stats.monthlyRevenue);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Olá, {firstName || 'designer'}
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Aqui está o resumo do seu dia
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clientes cadastradas"
          icon={Users}
          value={stats.totalClients.toLocaleString('pt-BR')}
        />
        <StatCard
          label="Atendimentos do mês"
          icon={CalendarCheck}
          value={stats.monthlyAppointments.toLocaleString('pt-BR')}
        />
        <StatCard
          label="Faturamento do mês"
          icon={TrendingUp}
          prefix={revenue.prefix}
          value={revenue.value}
        />
        <StatCard
          label="Clientes a recuperar"
          icon={AlertCircle}
          value={stats.clientsToRecover.toLocaleString('pt-BR')}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <SectionHeader title="Próximos atendimentos" />
          <CardContent className="px-6 pt-2">
            <p className="font-serif text-base italic text-muted-foreground">Em breve.</p>
          </CardContent>
        </Card>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <SectionHeader title="Atividade recente" />
          <CardContent className="px-6 pt-2">
            <p className="font-serif text-base italic text-muted-foreground">Em breve.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
