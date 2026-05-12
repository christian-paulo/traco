'use client';

import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import {
  MESSAGE_TEMPLATE_CATEGORIES,
  MESSAGE_TEMPLATE_CATEGORY_LABELS,
  type MessageTemplateCategory,
} from '@/lib/validations/message-template';
import {
  deleteMessageTemplate,
  setDefaultMessageTemplate,
} from '@/server/actions/message-templates';

import { MessageTemplateEditorDialog } from './message-template-editor-dialog';

type Props = {
  templates: MessageTemplateRow[];
};

export function MensagensTab({ templates }: Props) {
  const [activeCategory, setActiveCategory] = useState<MessageTemplateCategory>('reminder');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplateRow | null>(null);

  function handleNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function handleEdit(t: MessageTemplateRow) {
    setEditing(t);
    setEditorOpen(true);
  }

  const counts = MESSAGE_TEMPLATE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = templates.filter((t) => t.category === cat).length;
      return acc;
    },
    {} as Record<MessageTemplateCategory, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            Templates de mensagem
          </h2>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Crie modelos prontos com variáveis pra agilizar o WhatsApp
          </p>
        </div>
        <Button variant="premium" onClick={handleNew}>
          <Plus className="size-4" /> Novo template
        </Button>
      </div>

      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as MessageTemplateCategory)}
      >
        <TabsList className="flex-wrap">
          {MESSAGE_TEMPLATE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="gap-2">
              {MESSAGE_TEMPLATE_CATEGORY_LABELS[cat]}
              <span
                className={cn(
                  'ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                  activeCategory === cat
                    ? 'bg-foreground text-background'
                    : 'bg-cream-dark/60 text-muted-foreground',
                )}
              >
                {counts[cat]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {MESSAGE_TEMPLATE_CATEGORIES.map((cat) => {
          const items = templates.filter((t) => t.category === cat);
          return (
            <TabsContent key={cat} value={cat} className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Você tem <strong className="font-semibold text-foreground">{counts[cat]}</strong>{' '}
                {counts[cat] === 1 ? 'template' : 'templates'} em{' '}
                {MESSAGE_TEMPLATE_CATEGORY_LABELS[cat]}.
              </p>
              {items.length === 0 ? (
                <EmptyState onCreate={handleNew} />
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map((t) => (
                    <TemplateCard key={t.id} template={t} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <MessageTemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        defaultCategory={activeCategory}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card variant="premium" className="border-0 bg-cream/40 ring-1 ring-[var(--border)]">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="font-serif italic text-muted-foreground">
          Nenhum template aqui ainda. Crie o primeiro pra usar de atalho no WhatsApp.
        </p>
        <Button variant="outline" onClick={onCreate}>
          <Plus className="size-4" /> Criar template
        </Button>
      </CardContent>
    </Card>
  );
}

type TemplateCardProps = {
  template: MessageTemplateRow;
  onEdit: (t: MessageTemplateRow) => void;
};

function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const [pending, startTransition] = useTransition();

  function handleSetDefault() {
    if (template.is_default) return;
    startTransition(async () => {
      const result = await setDefaultMessageTemplate(template.id, template.category);
      if (result.success) {
        toast.success('Template marcado como padrão.');
      } else {
        toast.error(result.error || 'Erro ao atualizar.');
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir "${template.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteMessageTemplate(template.id);
      if (result.success) {
        toast.success('Template excluído.');
      } else {
        toast.error(result.error || 'Erro ao excluir.');
      }
    });
  }

  return (
    <Card
      variant="premium"
      className={cn(
        'border-0 transition-all',
        template.is_default
          ? 'bg-card ring-1 ring-[var(--gold)]/40'
          : 'bg-card ring-1 ring-[var(--border)]',
      )}
    >
      <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-base font-medium leading-tight text-foreground">
              {template.name}
            </h3>
            {template.is_default ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--gold)]">
                <Star className="size-3 fill-current" />
                Padrão
              </span>
            ) : null}
          </div>
          <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {template.body}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!template.is_default ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSetDefault}
              disabled={pending}
              aria-label="Marcar como padrão"
              className="gap-1"
            >
              <Star className="size-3.5" /> Padrão
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(template)}
            disabled={pending}
            aria-label="Editar template"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Excluir template"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
