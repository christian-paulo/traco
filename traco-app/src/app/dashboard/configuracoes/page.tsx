import { headers } from 'next/headers';
import type { Metadata } from 'next';

import { AcademyAdminPanel } from '@/components/academy/admin/academy-admin-panel';
import { BookingPolicyForm } from '@/components/configuracoes/booking-policy-form';
import { MensagensTab } from '@/components/configuracoes/mensagens-tab';
import { PrivacyForm } from '@/components/configuracoes/privacy-form';
import { RestartOnboardingButton } from '@/components/configuracoes/restart-onboarding-button';
import { ProceduresList } from '@/components/configuracoes/procedures-list';
import { ProfileForm } from '@/components/configuracoes/profile-form';
import { StudioSettingsForm } from '@/components/configuracoes/studio-settings-form';
import { TenantSettingsForm } from '@/components/configuracoes/tenant-settings-form';
import { WorkingHoursSettings } from '@/components/configuracoes/working-hours-settings';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAdmin } from '@/lib/queries/academy';
import { listMessageTemplates } from '@/lib/queries/message-templates';
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

type SearchParams = Promise<{ tab?: string }>;

type Tab = 'studio' | 'procedimentos' | 'agendamento' | 'mensagens' | 'aparencia' | 'admin';

function parseTab(v: string | undefined, allowAdmin: boolean): Tab {
  if (v === 'admin' && allowAdmin) return 'admin';
  if (
    v === 'studio' ||
    v === 'procedimentos' ||
    v === 'agendamento' ||
    v === 'mensagens' ||
    v === 'aparencia'
  ) {
    return v;
  }
  // legacy values from old tabs — mapeamentos
  if (v === 'conta') return 'studio';
  if (v === 'horarios') return 'agendamento';
  if (v === 'privacidade' || v === 'personalizacao') return 'aparencia';
  return 'studio';
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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
    admin,
    messageTemplates,
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
    isAdmin(),
    listMessageTemplates(),
  ]);

  const [workingHours, timeOff] = professional
    ? await Promise.all([listWorkingHours(professional.id), listTimeOff(professional.id)])
    : [[], []];

  // Admin extras (só busca se for admin)
  const adminData = admin
    ? await Promise.all([
        supabase.from('courses').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('lessons')
          .select('*')
          .order('course_id', { ascending: true })
          .order('sort_order', { ascending: true }),
        supabase
          .from('course_announcements')
          .select('*')
          .order('created_at', { ascending: false }),
      ])
    : null;

  const tab = parseTab(params.tab, admin);

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

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência & privacidade</TabsTrigger>
          {admin ? <TabsTrigger value="admin">Admin</TabsTrigger> : null}
        </TabsList>

        {/* Studio = Conta + Studio */}
        <TabsContent value="studio" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                Studio
              </h2>
              <p className="text-sm text-muted-foreground">
                Você + identidade pública do studio.
              </p>
            </div>
            <RestartOnboardingButton />
          </div>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sua conta
              </p>
              <p className="text-xs text-muted-foreground">
                Nome, WhatsApp e foto. Aparece nos emails e PDFs enviados às clientes.
              </p>
              <div className="mt-3">
                <ProfileForm initial={profileInitial} />
              </div>
            </CardContent>
          </Card>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Studio público
              </p>
              <p className="text-xs text-muted-foreground">
                Nome, bio, endereço e link de agendamento.
              </p>
              <div className="mt-3">
                {studioInitial ? (
                  <StudioSettingsForm
                    initial={studioInitial}
                    publicBaseUrl={publicBaseUrl}
                  />
                ) : (
                  <p className="font-serif italic text-muted-foreground">
                    Studio não disponível. Aplique a migração 03.
                  </p>
                )}
              </div>
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

        {/* Agendamento = Horários + Política */}
        <TabsContent value="agendamento" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Agendamento
            </h2>
            <p className="text-sm text-muted-foreground">
              Horários, folgas e política do link público.
            </p>
          </div>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Horários e folgas
              </p>
              <p className="text-xs text-muted-foreground">
                Quando você atende e quando está fora. Alimenta a disponibilidade pública.
              </p>
              <div className="mt-3">
                {professional ? (
                  <WorkingHoursSettings
                    initialHours={workingHours}
                    initialTimeOff={timeOff}
                  />
                ) : (
                  <p className="font-serif italic text-muted-foreground">
                    Profissional não configurado. Aplique a migração 03.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Política de agendamento
              </p>
              <p className="text-xs text-muted-foreground">
                Regras que valem pro link público e pra agenda interna.
              </p>
              <div className="mt-3">
                {bookingPolicyInitial ? (
                  <BookingPolicyForm initial={bookingPolicyInitial} />
                ) : (
                  <p className="font-serif italic text-muted-foreground">
                    Studio não disponível. Aplique a migração 03.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensagens" className="mt-6">
          <MensagensTab templates={messageTemplates} />
        </TabsContent>

        {/* Aparência & privacidade = Personalização + Privacidade */}
        <TabsContent value="aparencia" className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Aparência & privacidade
            </h2>
            <p className="text-sm text-muted-foreground">
              Marca da comunicação e o que aparece nos posts compartilháveis.
            </p>
          </div>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Marca e templates
              </p>
              <p className="text-xs text-muted-foreground">
                Identidade do studio e templates de comunicação.
              </p>
              <div className="mt-3">
                <TenantSettingsForm initial={tenantInitial} />
              </div>
            </CardContent>
          </Card>

          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
            <CardContent className="flex flex-col gap-2 px-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Privacidade dos posts
              </p>
              <p className="text-xs text-muted-foreground">
                Padrão é proteger financeiro — você decide quando expor.
              </p>
              <div className="mt-3">
                <PrivacyForm initial={sharingInitial} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {admin && adminData ? (
          <TabsContent value="admin" className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                Admin · Academia Traço
              </h2>
              <p className="text-sm text-muted-foreground">
                Cursos, aulas e anúncios — só você vê.
              </p>
            </div>
            <AcademyAdminPanel
              courses={(adminData[0].data ?? []) as never}
              lessons={
                ((adminData[1].data ?? []) as Array<{
                  resources_urls?: unknown;
                }>).map((l) => ({
                  ...l,
                  resources_urls: Array.isArray(l.resources_urls) ? l.resources_urls : [],
                })) as never
              }
              announcements={(adminData[2].data ?? []) as never}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
