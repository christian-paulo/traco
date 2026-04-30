import { Clock, FileX, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import type { AnamnesisAnswers, TemplateField } from '@/lib/anamnesis/template-types';
import { getFirstName } from '@/lib/format';
import { getPublicFichaByToken } from '@/lib/queries/anamnesis';

import { FichaForm } from './ficha-form';

export const metadata: Metadata = {
  title: 'Sua ficha de anamnese',
  description: 'Preencha sua ficha antes do atendimento.',
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-cream flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-8">{children}</div>
    </main>
  );
}

function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--gold)]">
        Traço · Master Brow
      </span>
      <h1 className="font-serif text-3xl font-medium text-foreground">Ficha de anamnese</h1>
      {subtitle ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
      <div className="mt-2 h-px w-12 bg-[var(--gold)]" />
    </header>
  );
}

type StateProps = {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
};

function StatusCard({ icon, title, description }: StateProps) {
  return (
    <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border border-[var(--gold)]/20 p-8 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
        {icon}
      </div>
      <h2 className="font-serif text-xl font-medium text-foreground">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export default async function FichaPublicPage({ params }: { params: Params }) {
  const { token } = await params;
  const payload = await getPublicFichaByToken(token);

  if (!payload) {
    return (
      <PageShell>
        <BrandHeader />
        <StatusCard
          icon={<FileX className="size-6" strokeWidth={1.5} />}
          title="Link inválido"
          description="Este link foi removido ou nunca existiu. Entre em contato com sua designer."
        />
      </PageShell>
    );
  }

  if (payload.form.status === 'signed') {
    return (
      <PageShell>
        <BrandHeader />
        <StatusCard
          icon={<ShieldAlert className="size-6" strokeWidth={1.5} />}
          title="Ficha já assinada"
          description={
            <>
              Esta ficha já foi assinada
              {payload.form.signed_at ? (
                <>
                  {' '}em{' '}
                  <strong className="text-foreground">
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(payload.form.signed_at))}
                  </strong>
                </>
              ) : null}
              .{' '}
              {payload.form.pdf_url ? (
                <>
                  Você pode{' '}
                  <Link href={payload.form.pdf_url} className="underline underline-offset-2">
                    baixar sua cópia aqui
                  </Link>
                  .
                </>
              ) : null}
            </>
          }
        />
      </PageShell>
    );
  }

  if (new Date(payload.form.expires_at).getTime() < Date.now()) {
    return (
      <PageShell>
        <BrandHeader />
        <StatusCard
          icon={<Clock className="size-6" strokeWidth={1.5} />}
          title="Link expirado"
          description="Este link expirou. Entre em contato com sua designer para receber um novo."
        />
      </PageShell>
    );
  }

  const firstName = getFirstName(payload.client.full_name);
  const fields = payload.template.fields as TemplateField[];
  const initialAnswers = buildPrefilledAnswers(fields, payload.client);

  return (
    <PageShell>
      <BrandHeader
        subtitle={`Olá, ${firstName}! Antes do seu atendimento, preencha as informações abaixo.`}
      />
      <FichaForm token={token} fields={fields} initialAnswers={initialAnswers} />
    </PageShell>
  );
}

function buildPrefilledAnswers(
  fields: TemplateField[],
  client: { full_name: string; email: string | null; phone: string | null; birth_date: string | null },
): AnamnesisAnswers {
  const answers: AnamnesisAnswers = {};
  for (const field of fields) {
    if (field.type === 'section') continue;
    if (!field.prefilled_from) continue;
    switch (field.prefilled_from) {
      case 'client.full_name':
        answers[field.id] = client.full_name;
        break;
      case 'client.phone':
        answers[field.id] = client.phone ?? '';
        break;
      case 'client.email':
        answers[field.id] = client.email ?? '';
        break;
      case 'client.birth_date':
        answers[field.id] = client.birth_date ?? '';
        break;
    }
  }
  return answers;
}
