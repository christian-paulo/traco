'use client';

import { ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { cn } from '@/lib/utils';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import {
  MESSAGE_TEMPLATE_CATEGORY_LABELS,
  type MessageTemplateCategory,
} from '@/lib/validations/message-template';
import { renderTemplate } from '@/lib/whatsapp';
import { advanceOnboardingStep } from '@/server/actions/onboarding';

const PREVIEW_VARS = {
  cliente: 'Maria',
  procedimento: 'Brow Lamination',
  data: 'sexta, 02 de maio',
  hora: '14:00',
  valor: 'R$ 210,00',
  dias: '63',
  designer: 'Alana',
  studio: 'Studio Traço',
  endereco: 'Rua das Flores, 123 — Centro',
};

const CATEGORY_ORDER: MessageTemplateCategory[] = [
  'reminder',
  'aftercare',
  'recovery',
  'admin',
];

type Props = {
  templates: MessageTemplateRow[];
};

export function StepMessages({ templates }: Props) {
  const [pending, startTransition] = useTransition();

  function handleContinue() {
    startTransition(async () => {
      const advanced = await advanceOnboardingStep('messages');
      if (!advanced.success) toast.error(advanced.error || 'Erro ao concluir.');
    });
  }

  // Pega o default de cada categoria
  const defaultByCategory = new Map<MessageTemplateCategory, MessageTemplateRow>();
  for (const t of templates) {
    if (t.is_default && !defaultByCategory.has(t.category)) {
      defaultByCategory.set(t.category, t);
    }
  }

  return (
    <StepShell
      step="messages"
      subtitle="Passo 5 de 5"
      title="Suas mensagens prontas"
      description="Já preparei 4 templates de WhatsApp pra você. Eles aparecem no botão WhatsApp da agenda e do Recuperar. Pode usar como estão ou editar quando quiser."
      onContinue={handleContinue}
      continuePending={pending}
      continueLabel="Concluir e ir pro dashboard"
    >
      <div className="flex flex-col gap-3">
        {CATEGORY_ORDER.map((cat) => {
          const template = defaultByCategory.get(cat);
          if (!template) return null;
          return (
            <TemplatePreviewCard key={cat} template={template} />
          );
        })}
      </div>

      <Link
        href="/dashboard/configuracoes?tab=mensagens"
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--gold)] hover:underline"
      >
        Editar templates agora
        <ExternalLink className="size-3.5" />
      </Link>

      <div className="rounded-lg bg-cream/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-cream-dark">
        <p className="mb-1 font-medium text-foreground">💡 Como funciona</p>
        Cada categoria tem um template padrão (marcado com ⭐). Quando você clicar em
        WhatsApp num agendamento ou cliente, ele sugere o template certo automaticamente —
        você revisa e envia.
      </div>
    </StepShell>
  );
}

function TemplatePreviewCard({ template }: { template: MessageTemplateRow }) {
  const rendered = renderTemplate(template.body, PREVIEW_VARS);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-card p-4 ring-1',
        'border-[var(--gold)]/30 ring-[var(--gold)]/20',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-base font-medium leading-tight text-foreground">
          {template.name}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--gold)]">
          <Star className="size-3 fill-current" />
          {MESSAGE_TEMPLATE_CATEGORY_LABELS[template.category]}
        </span>
      </div>
      <p className="whitespace-pre-line rounded-lg bg-cream/40 px-3 py-2.5 text-sm leading-relaxed text-foreground ring-1 ring-cream-dark">
        {rendered}
      </p>
    </div>
  );
}
