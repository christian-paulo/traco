'use client';

import { Pencil, Star } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { MessageTemplateEditorDialog } from '@/components/configuracoes/message-template-editor-dialog';
import { StepShell } from '@/components/onboarding/step-shell';
import { Button } from '@/components/ui/button';
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplateRow | null>(null);

  function handleContinue() {
    startTransition(async () => {
      const advanced = await advanceOnboardingStep('messages');
      if (!advanced.success) toast.error(advanced.error || 'Erro ao concluir.');
    });
  }

  function openEditor(t: MessageTemplateRow) {
    setEditing(t);
    setEditorOpen(true);
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
      description="Já preparei 4 templates de WhatsApp pra você. Pode usar como estão ou personalizar agora — clica no lápis pra editar qualquer um."
      onContinue={handleContinue}
      continuePending={pending}
      continueLabel="Concluir e ir pro dashboard"
    >
      <div className="flex flex-col gap-3">
        {CATEGORY_ORDER.map((cat) => {
          const template = defaultByCategory.get(cat);
          if (!template) return null;
          return (
            <TemplatePreviewCard
              key={cat}
              template={template}
              onEdit={() => openEditor(template)}
            />
          );
        })}
      </div>

      <div className="rounded-lg bg-cream/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-cream-dark">
        <p className="mb-1 font-medium text-foreground">💡 Como funciona</p>
        Cada categoria tem um template padrão (⭐). Quando você clicar em WhatsApp num
        agendamento ou cliente, ele sugere o template certo automaticamente — você revisa
        e envia. Dá pra criar mais templates depois em Configurações &gt; Mensagens.
      </div>

      <MessageTemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        defaultCategory={editing?.category ?? 'reminder'}
      />
    </StepShell>
  );
}

type CardProps = {
  template: MessageTemplateRow;
  onEdit: () => void;
};

function TemplatePreviewCard({ template, onEdit }: CardProps) {
  const rendered = renderTemplate(template.body, PREVIEW_VARS);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border bg-card p-4 ring-1',
        'border-[var(--gold)]/30 ring-[var(--gold)]/20',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-serif text-base font-medium leading-tight text-foreground">
            {template.name}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--gold)]">
            <Star className="size-3 fill-current" />
            {MESSAGE_TEMPLATE_CATEGORY_LABELS[template.category]}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label="Editar template"
          className="gap-1.5"
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
      <p className="whitespace-pre-line rounded-lg bg-cream/40 px-3 py-2.5 text-sm leading-relaxed text-foreground ring-1 ring-cream-dark">
        {rendered}
      </p>
    </div>
  );
}
