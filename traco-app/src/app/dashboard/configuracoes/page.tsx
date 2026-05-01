import { headers } from 'next/headers';
import type { Metadata } from 'next';

import { BookingPolicyForm } from '@/components/configuracoes/booking-policy-form';
import { PrivacyForm } from '@/components/configuracoes/privacy-form';
import { ProceduresList } from '@/components/configuracoes/procedures-list';
import { ProfileForm } from '@/components/configuracoes/profile-form';
import { StudioSettingsForm } from '@/components/configuracoes/studio-settings-form';
import { TenantSettingsForm } from '@/components/configuracoes/tenant-settings-form';
import { WorkingHoursSettings } from '@/components/configuracoes/working-hours-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listProcedures } from '@/lib/queries/procedures';
import { getCurrentProfile } from '@/lib/queries/profile';
import { getSharingPreferences } from '@/lib/queries/sharing';
import {
  getCurrentProfessional,
  getCurrentStudio,
  listTimeOff,
  listWorkingHours,
} from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Configurações',
};

const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno.';

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const headerList = await headers();

  const [
    procedures,
    profileRow,
    tenantRow,
    studio,
    professional,
    sharingPrefs,
  ] = await Promise.all([
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
    getCurrentStudio(),
    getCurrentProfessional(),
    getSharingPreferences(),
  ]);

  const sharingInitial = sharingPrefs
    ? {
        never_show_revenue: sharingPrefs.never_show_revenue,
        never_show_profit: sharingPrefs.never_show_profit,
        never_show_expenses: sharingPrefs.never_show_expenses,
        default_template: sharingPrefs.default_template,
        watermark_enabled: sharingPrefs.watermark_enabled,
        custom_brand_color: sharingPrefs.custom_brand_color,
      }
    : {
        never_show_revenue: true,
        never_show_profit: true,
        never_show_expenses: true,
        default_template: 'operational' as const,
        watermark_enabled: true,
        custom_brand_color: null,
      };

  const [workingHours, timeOff] = professional
    ? await Promise.all([listWorkingHours(professional.id), listTimeOff(professional.id)])
    : [[], []];

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

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (headerList.get('host') ? `https://${headerList.get('host')}` : 'http://localhost:3000');

  const studioInitial = studio
    ? {
        name: studio.name,
        slug: studio.slug,
        address: studio.address ?? '',
        bio: studio.bio ?? '',
        cover_image_url: studio.cover_image_url ?? '',
      }
    : null;

  const bookingPolicyInitial = studio
    ? {
        waitlist_enabled: studio.waitlist_enabled,
        booking_buffer_minutes: studio.booking_buffer_minutes,
      }
    : null;

  const studioMissing = !studio || !professional;

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

      {studioMissing ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-amber-500/30 py-6">
          <CardContent className="px-6">
            <p className="font-serif text-lg italic text-amber-700">
              Studio ainda não inicializado. Aplique a migração 03 (SQL_BOOKING_SYSTEM.sql) no
              Supabase e recarregue.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
          <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
          <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
        </TabsList>

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

        <TabsContent value="studio" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Studio
            </h2>
            <p className="text-sm text-muted-foreground">
              Identidade pública do studio — nome, bio, endereço e link de agendamento.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              {studioInitial ? (
                <StudioSettingsForm initial={studioInitial} publicBaseUrl={publicBaseUrl} />
              ) : (
                <p className="font-serif italic text-muted-foreground">
                  Studio não disponível. Aplique a migração 03.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="horarios" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Horários e folgas
            </h2>
            <p className="text-sm text-muted-foreground">
              Quando você atende e quando está fora. A grade alimenta a disponibilidade pública.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              {professional ? (
                <WorkingHoursSettings initialHours={workingHours} initialTimeOff={timeOff} />
              ) : (
                <p className="font-serif italic text-muted-foreground">
                  Profissional não configurado. Aplique a migração 03.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamento" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Política de agendamento
            </h2>
            <p className="text-sm text-muted-foreground">
              Regras que valem pro link público e pra agenda interna.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              {bookingPolicyInitial ? (
                <BookingPolicyForm initial={bookingPolicyInitial} />
              ) : (
                <p className="font-serif italic text-muted-foreground">
                  Studio não disponível. Aplique a migração 03.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacidade" className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Privacidade dos posts
            </h2>
            <p className="text-sm text-muted-foreground">
              Controle o que aparece nos resumos compartilháveis. Padrão é proteger
              dados financeiros — você decide quando expor.
            </p>
          </div>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="px-6">
              <PrivacyForm initial={sharingInitial} />
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
