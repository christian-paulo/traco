import type { Metadata } from 'next';

import { ProceduresList } from '@/components/configuracoes/procedures-list';
import { ProfileForm } from '@/components/configuracoes/profile-form';
import { TenantSettingsForm } from '@/components/configuracoes/tenant-settings-form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listProcedures } from '@/lib/queries/procedures';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Configurações',
};

const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno.';

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [procedures, profileRow, tenantRow] = await Promise.all([
    listProcedures(true),
    profile
      ? supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile
      ? supabase
          .from('tenants')
          .select('name, whatsapp_template, accent_color')
          .eq('id', profile.tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profileInitial = {
    full_name: profileRow?.data?.full_name ?? '',
    phone: profileRow?.data?.phone ?? '',
    avatar_url: profileRow?.data?.avatar_url ?? '',
  };

  const tenantInitial = {
    name: tenantRow?.data?.name ?? '',
    whatsapp_template: tenantRow?.data?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE,
    accent_color: tenantRow?.data?.accent_color ?? '#C9A961',
  };

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Personalize o que você oferece
        </p>
      </header>

      <Tabs defaultValue="procedimentos">
        <TabsList>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
        </TabsList>

        <TabsContent value="procedimentos" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Catálogo de procedimentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure os procedimentos que você oferece. Cor, valor padrão e dias para retorno.
            </p>
          </div>
          {procedures.length === 0 ? (
            <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
              <CardContent className="text-center">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Nenhum procedimento cadastrado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProceduresList procedures={procedures} />
          )}
        </TabsContent>

        <TabsContent value="conta" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Sua conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Nome, WhatsApp e foto. Estes dados aparecem nos emails e PDFs enviados às clientes.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              <ProfileForm initial={profileInitial} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizacao" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Personalização
            </h2>
            <p className="text-sm text-muted-foreground">
              Identidade do studio e templates de comunicação.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              <TenantSettingsForm initial={tenantInitial} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
