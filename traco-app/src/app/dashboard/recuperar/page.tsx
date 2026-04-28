import type { Metadata } from 'next';

import { RecuperarList } from '@/components/recuperar/recuperar-list';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { getClientsToRecover } from '@/lib/queries/clients';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Clientes a recuperar',
};

const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno.';

export default async function RecuperarPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [clients, tenantRow] = await Promise.all([
    getClientsToRecover(),
    profile
      ? supabase
          .from('tenants')
          .select('whatsapp_template')
          .eq('id', profile.tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const whatsappTemplate = tenantRow?.data?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE;
  const totalToRecover = clients.length;
  const potentialRevenue = clients.reduce((s, c) => s + c.last_procedure_default_price, 0);
  const mostOverdue = clients[0]?.days_overdue ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Clientes a recuperar
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Clientes que deveriam ter voltado
        </p>
      </header>

      {totalToRecover > 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-5">
          <CardContent className="grid grid-cols-1 gap-6 px-6 sm:grid-cols-3">
            <Stat
              label="Total a recuperar"
              value={String(totalToRecover)}
            />
            <Stat
              label="Receita potencial"
              value={formatCurrency(potentialRevenue)}
            />
            <Stat
              label="Mais atrasada"
              value={`${mostOverdue} dias`}
            />
          </CardContent>
        </Card>
      ) : null}

      <RecuperarList clients={clients} whatsappTemplate={whatsappTemplate} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-serif text-2xl font-medium text-foreground">{value}</span>
    </div>
  );
}
