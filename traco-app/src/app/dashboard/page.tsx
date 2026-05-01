import { AlertCircle, CalendarCheck, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ActiveGoalsCard } from '@/components/dashboard/active-goals-card';
import { ActiveReactionsCard } from '@/components/dashboard/active-reactions-card';
import { PinnedNotesCard } from '@/components/dashboard/pinned-notes-card';
import { TodayAppointmentsCard } from '@/components/dashboard/today-appointments-card';
import { SeedTrigger } from '@/components/dashboard/seed-trigger';
import { OnboardingChecklist, type OnboardingStatus } from '@/components/onboarding/onboarding-checklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getFirstName } from '@/lib/format';
import {
  getActiveReactionsSummary,
  getDashboardStats,
  getPinnedNotesRecent,
  getTodayAppointments,
} from '@/lib/queries/dashboard';
import { listActiveGoals } from '@/lib/queries/goals';
import { refreshAllGoalsProgress } from '@/server/actions/goals';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  prefix?: string;
  href?: string;
};

function StatCard({ label, icon: Icon, value, prefix, href }: StatCardProps) {
  const card = (
    <Card
      variant="premium"
      className={cn(
        'bg-card gap-3 border-0 ring-1 ring-[var(--border)] py-6 transition-all',
        href && 'cursor-pointer hover:ring-[var(--gold)]/50',
      )}
    >
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

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
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

  // Recalcula goals antes de buscar (idempotente)
  await refreshAllGoalsProgress();

  const [stats, reactionsSummary, todayAppointments, pinnedNotes, activeGoals] =
    await Promise.all([
      getDashboardStats(profile.tenantId),
      getActiveReactionsSummary(3),
      getTodayAppointments(),
      getPinnedNotesRecent(5),
      listActiveGoals(),
    ]);
  const firstName = getFirstName(profile.fullName ?? profile.email);
  const revenue = formatRevenue(stats.monthlyRevenue);

  const supabase = await createClient();
  const [
    { data: profileRow },
    { data: appointmentsHead },
    { data: fichaHead },
    { data: customProcedure },
  ] = await Promise.all([
    supabase.from('profiles').select('phone').eq('id', profile.id).maybeSingle(),
    supabase.from('appointments').select('id').limit(1),
    supabase.from('anamnesis_forms').select('id').limit(1),
    supabase
      .from('procedures')
      .select('id, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1),
  ]);

  const onboarding: OnboardingStatus = {
    hasClient: stats.totalClients > 0,
    hasProfilePhone: Boolean(profileRow?.phone),
    hasCustomProcedure:
      (customProcedure ?? []).some(
        (p) => new Date(p.updated_at).getTime() - new Date(p.created_at).getTime() > 1500,
      ),
    hasAppointment: (appointmentsHead ?? []).length > 0,
    hasFicha: (fichaHead ?? []).length > 0,
  };

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

      <OnboardingChecklist status={onboarding} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clientes cadastradas"
          icon={Users}
          value={stats.totalClients.toLocaleString('pt-BR')}
          href="/dashboard/clientes"
        />
        <StatCard
          label="Atendimentos do mês"
          icon={CalendarCheck}
          value={stats.monthlyAppointments.toLocaleString('pt-BR')}
          href="/dashboard/atendimentos"
        />
        <StatCard
          label="Faturamento do mês"
          icon={TrendingUp}
          prefix={revenue.prefix}
          value={revenue.value}
          href="/dashboard/financeiro"
        />
        <StatCard
          label="Clientes a recuperar"
          icon={AlertCircle}
          value={stats.clientsToRecover.toLocaleString('pt-BR')}
          href="/dashboard/recuperar"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayAppointmentsCard appointments={todayAppointments} />
        </div>
        <ActiveReactionsCard
          total={reactionsSummary.total}
          recent={reactionsSummary.recent}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActiveGoalsCard goals={activeGoals} />
        <PinnedNotesCard notes={pinnedNotes} />
      </section>

      <SeedTrigger />
    </div>
  );
}
