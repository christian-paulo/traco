import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

import { getPublicFichaByToken } from '@/lib/queries/anamnesis';

export const metadata: Metadata = {
  title: 'Ficha enviada | Traço',
};

type Params = Promise<{ token: string }>;

export default async function FichaSuccessPage({ params }: { params: Params }) {
  const { token } = await params;
  const payload = await getPublicFichaByToken(token);
  const pdfUrl = payload?.form.pdf_url;

  return (
    <main className="bg-cream flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <header className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--gold)]">
            Traço · Master Brow
          </span>
          <div className="mt-1 h-px w-12 bg-[var(--gold)]" />
        </header>

        <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
          <CheckCircle2 className="size-12 text-[var(--gold)]" strokeWidth={1.25} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-medium text-foreground">
            Ficha enviada com sucesso
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Você receberá uma cópia no seu email.
          </p>
        </div>

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink text-cream hover:bg-[var(--gold)] hover:text-ink inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-medium uppercase tracking-[0.18em] transition-colors"
          >
            Baixar minha ficha
          </a>
        ) : null}

        <p className="font-serif text-base italic text-muted-foreground">
          Até logo no seu atendimento ✨
        </p>
      </div>
    </main>
  );
}
