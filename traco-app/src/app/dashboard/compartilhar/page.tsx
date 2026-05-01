import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SharingFlow } from '@/components/sharing/sharing-flow';
import { getCurrentProfile } from '@/lib/queries/profile';
import { getReportData, getSharingPreferences } from '@/lib/queries/sharing';

export const metadata: Metadata = {
  title: 'Compartilhar resumo',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function CompartilharPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  // Default: últimos 7 dias pra hidratar preview do tipo "weekly"
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const [preferences, data] = await Promise.all([
    getSharingPreferences(),
    getReportData({ periodStart: isoOf(start), periodEnd: isoOf(today) }),
  ]);

  // Defensive: se trigger não criou preferences (tenant antigo), usa defaults
  const prefs = preferences ?? {
    never_show_revenue: true,
    never_show_profit: true,
    never_show_expenses: true,
    watermark_enabled: true,
    custom_brand_color: null,
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Compartilhar resumo
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Transforme seus dados em assets pra Stories e Posts
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Privacidade primeiro: dados financeiros começam bloqueados. Ajuste em
          Configurações → Privacidade quando quiser destravar.
        </p>
      </header>

      <SharingFlow
        initialData={data}
        preferences={{
          never_show_revenue: prefs.never_show_revenue,
          never_show_profit: prefs.never_show_profit,
          never_show_expenses: prefs.never_show_expenses,
          watermark_enabled: prefs.watermark_enabled,
          custom_brand_color: prefs.custom_brand_color,
        }}
      />
    </div>
  );
}
