'use client';

import { ExternalLink, MessageSquare, Settings2, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import { cn } from '@/lib/utils';
import {
  MESSAGE_TEMPLATE_CATEGORY_LABELS,
  type MessageTemplateCategory,
} from '@/lib/validations/message-template';
import {
  buildWhatsappUrl,
  renderTemplate,
  type WhatsappTemplateVars,
} from '@/lib/whatsapp';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MessageTemplateRow[];
  category: MessageTemplateCategory;
  phone: string;
  vars: WhatsappTemplateVars;
};

export function WhatsappTemplatePicker({
  open,
  onOpenChange,
  templates,
  category,
  phone,
  vars,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => templates.find((t) => t.is_default)?.id ?? templates[0]?.id ?? null,
  );

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const rendered = selected ? renderTemplate(selected.body, vars) : '';

  function handleSend() {
    if (!selected) return;
    const url = buildWhatsappUrl(phone, rendered);
    if (!url) {
      toast.error('Cliente sem telefone válido.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600" />
            Enviar via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha um template de{' '}
            <strong className="font-medium text-foreground">
              {MESSAGE_TEMPLATE_CATEGORY_LABELS[category]}
            </strong>
            . A mensagem abre direto no WhatsApp da cliente.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {templates.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {templates.map((t) => {
                  const isSelected = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'flex flex-col gap-1 rounded-lg border px-3.5 py-3 text-left transition-all',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-cream-dark bg-card hover:border-emerald-300 hover:bg-cream/40',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{t.name}</span>
                        {t.is_default ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--gold)]">
                            <Star className="size-2.5 fill-current" />
                            Padrão
                          </span>
                        ) : null}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {t.body}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selected ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Preview
                  </p>
                  <div className="whitespace-pre-line rounded-lg border border-emerald-200 bg-emerald-50/30 px-3.5 py-3 text-sm leading-relaxed text-foreground">
                    {rendered || (
                      <span className="italic text-muted-foreground/60">
                        Template vazio.
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Link
            href="/dashboard/configuracoes?tab=mensagens"
            className="mr-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5" />
            Editar templates
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="premium"
            onClick={handleSend}
            disabled={!selected}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Abrir WhatsApp
            <ExternalLink className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="font-serif italic text-muted-foreground">
        Você ainda não tem templates pra esta categoria.
      </p>
      <Link
        href="/dashboard/configuracoes?tab=mensagens"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--gold)] hover:underline"
      >
        <Settings2 className="size-4" />
        Criar template
      </Link>
    </div>
  );
}
