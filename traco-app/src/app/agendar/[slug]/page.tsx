import { CalendarX } from 'lucide-react';
import type { Metadata } from 'next';

import { BookingFlow } from '@/components/booking/booking-flow';
import { getPublicBookingPayload } from '@/lib/queries/public-booking';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPublicBookingPayload(slug);
  return {
    title: payload ? `Agendar com ${payload.studio.name}` : 'Studio não encontrado',
    robots: { index: false, follow: false },
  };
}

export default async function AgendarPage({ params }: { params: Params }) {
  const { slug } = await params;
  const payload = await getPublicBookingPayload(slug);

  if (!payload) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
          <CalendarX className="size-10 text-[var(--gold)]" strokeWidth={1.25} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium text-foreground">
          Studio não encontrado
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O link que você acessou pode ter sido alterado ou este studio não existe mais.
          Verifique com a profissional que enviou o convite.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="bg-ink border-b border-[var(--gold)]/20 px-4 py-3 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-serif text-xl font-light tracking-wide text-[var(--gold)]">
              Traço
            </span>
            <span className="text-[9px] font-light uppercase tracking-[0.3em] text-white/60">
              by Master Brow
            </span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--gold)]">
              {payload.studio.name}
            </span>
            {payload.studio.address ? (
              <span className="text-[10px] text-white/60">{payload.studio.address}</span>
            ) : null}
          </div>
        </div>
      </header>

      <BookingFlow payload={payload} />
    </main>
  );
}
