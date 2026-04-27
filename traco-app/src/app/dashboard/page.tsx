import { AlertCircle, CalendarCheck, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getFirstName } from '@/lib/format';
import { getDashboardStats } from '@/lib/queries/dashboard';
import { getCurrentProfile } from '@/lib/queries/profile';

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
};

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className="size-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const stats = await getDashboardStats(profile.tenantId);
  const firstName = getFirstName(profile.fullName ?? profile.email);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Olá, {firstName || 'designer'}
        </h1>
        <p className="text-sm text-slate-500">Aqui está o resumo do seu dia.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clientes cadastradas"
          value={stats.totalClients.toLocaleString('pt-BR')}
          icon={Users}
        />
        <StatCard
          title="Atendimentos do mês"
          value={stats.monthlyAppointments.toLocaleString('pt-BR')}
          icon={CalendarCheck}
        />
        <StatCard
          title="Faturamento do mês"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Clientes a recuperar"
          value={stats.clientsToRecover.toLocaleString('pt-BR')}
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Em breve.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Em breve.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
